'use client';

import { Client } from '@stomp/stompjs';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import throttle from 'lodash.throttle';
import { nanoid } from 'nanoid';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import {
  fetchRoomDetails,
  fetchRoomMessages,
  fetchWhiteboard,
  joinRoom as joinRoomApi,
  leaveRoom as leaveRoomApi,
  deleteRoom as deleteRoomApi,
} from '../../../lib/api';
import type { ChatMessage, Participant, RoomDetail } from '../../../lib/types';
import { useAuthStore } from '../../../store/auth';
import { CodeEditor } from '../../../components/Room/CodeEditor';
import { MultiTabCodeEditor } from '../../../components/Room/MultiTabCodeEditor';
import { CollaborativeDocument } from '../../../components/Room/CollaborativeDocument';
import { WhiteboardCanvas } from '../../../components/Room/WhiteboardCanvas';
import { ScreenShare } from '../../../components/Room/ScreenShare';
import { CodeExecutor } from '../../../components/Room/CodeExecutor';
import { VideoGrid } from '../../../components/Room/VideoGrid';
import { ProblemPanel } from '../../../components/Room/ProblemPanel';
import { ProblemSelector } from '../../../components/Room/ProblemSelector';
import { TestCaseRunner } from '../../../components/Room/TestCaseRunner';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:9000';
const stompUrl = backendUrl.replace('http', 'ws').replace('https', 'wss') + '/ws';
const yjsUrl = process.env.NEXT_PUBLIC_YJS_URL ?? 'ws://localhost:1234';
const peerUrl = process.env.NEXT_PUBLIC_PEER_URL ?? 'http://localhost:8080';

export default function RoomPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug;
  const user = useAuthStore((state) => state.user);
  const refresh = useAuthStore((state) => state.refresh);

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [whiteboard, setWhiteboard] = useState<string>('');
  const [whiteboardUpdatedBy, setWhiteboardUpdatedBy] = useState<string | null>(null);
  const [whiteboardUpdatedAt, setWhiteboardUpdatedAt] = useState(0);
  const [joined, setJoined] = useState(false);
  const [password, setPassword] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [yContext, setYContext] = useState<{ doc: Y.Doc; provider: WebsocketProvider } | null>(null);
  const [useMultiTab, setUseMultiTab] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [problem, setProblem] = useState<any | null>(null);
  const [showProblemSelector, setShowProblemSelector] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('javascript');

  const clientRef = useRef<Client | null>(null);
  const stompConnectedRef = useRef(false);
  const selfIdRef = useRef<string>(user?.id ?? nanoid());
  const whiteboardUpdatedAtRef = useRef(0);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [activeWindow, setActiveWindow] = useState<'video' | 'chat' | 'whiteboard' | null>('video');
  const [windows, setWindows] = useState({
    video: { x: 24, y: 24, width: 360, height: 220, z: 2, open: true },
    chat: { x: 420, y: 24, width: 320, height: 360, z: 3, open: true },
    whiteboard: { x: 24, y: 270, width: 360, height: 300, z: 1, open: true },
  });
  const dragRef = useRef<{
    id: 'video' | 'chat' | 'whiteboard';
    offsetX: number;
    offsetY: number;
    mode: 'move' | 'resize';
  } | null>(null);

  useEffect(() => {
    if (!user) {
      refresh().catch(console.error);
    }
  }, [user, refresh]);

  useEffect(() => {
    if (user?.id && selfIdRef.current !== user.id) {
      selfIdRef.current = user.id;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!slug) {
      return;
    }
    const load = async () => {
      try {
        const detail = await fetchRoomDetails(slug);
        setRoom(detail);
        setParticipants(detail.participants ?? []);
        const history = await fetchRoomMessages(slug);
        setMessages(history.reverse());
        const whiteboardState = await fetchWhiteboard(slug);
        if (whiteboardState && typeof whiteboardState === 'object' && 'imageData' in whiteboardState) {
          const state = whiteboardState as { imageData: string; updatedAt?: string; updatedAtMs?: number };
          setWhiteboard(state.imageData);
          const nextTs = state.updatedAtMs ?? (state.updatedAt ? Date.parse(state.updatedAt) : 0);
          if (Number.isFinite(nextTs) && nextTs > 0) {
            setWhiteboardUpdatedAt(nextTs);
            whiteboardUpdatedAtRef.current = nextTs;
          }
        }
      } catch (error) {
        console.error(error);
        router.replace('/rooms');
      }
    };
    load().catch(console.error);
  }, [slug, router]);

  useEffect(() => {
    if (!slug || !joined) return;
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(yjsUrl, `room-${slug}`, doc, { connect: true });
    
    // Initialize language map if it doesn't exist
    const langMap = doc.getMap('language');
    if (!langMap.get('current')) {
      langMap.set('current', 'cpp'); // Default to C++ for competitive programming
    }
    
    // Listen for language changes from other users
    const handleLanguageChange = () => {
      const newLang = langMap.get('current');
      if (newLang && newLang !== currentLanguage) {
        setCurrentLanguage(newLang as string);
      }
    };
    langMap.observe(handleLanguageChange);
    
    // Sync code from YJS document for execution
    const codeText = doc.getText('code');
    const handleCodeChange = () => {
      setCurrentCode(codeText.toString());
    };
    codeText.observe(handleCodeChange);
    // Initialize current code
    setCurrentCode(codeText.toString());

    // Problem sync via YJS
    const probMap = doc.getMap('problem');
    const handleProblemChange = () => {
      const raw = probMap.get('data') as string | undefined;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setProblem(parsed);
        } catch {
          // ignore parse errors
        }
      } else {
        setProblem(null);
      }
    };
    probMap.observe(handleProblemChange);
    handleProblemChange();
    
    setYContext({ doc, provider });
    return () => {
      langMap.unobserve(handleLanguageChange);
      codeText.unobserve(handleCodeChange);
      probMap.unobserve(handleProblemChange);
      provider.destroy();
      doc.destroy();
      setYContext(null);
    };
  }, [slug, joined]);

  useEffect(() => {
    if (!yContext || !user) return;
    yContext.provider.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.displayName ?? user.login,
    });
  }, [yContext, user]);

  useEffect(() => {
    if (!joined || !slug || clientRef.current) {
      return;
    }
    const client = new Client({
      brokerURL: stompUrl,
      reconnectDelay: 5000,
      debug: () => undefined,
      webSocketFactory: () => new WebSocket(stompUrl),
      onConnect: () => {
        stompConnectedRef.current = true;
        client.subscribe(`/topic/rooms/${slug}/chat`, (message) => {
          try {
            const payload = JSON.parse(message.body) as ChatMessage;
            setMessages((prev) => [...prev, payload]);
          } catch (error) {
            console.error('Invalid chat payload', error);
          }
        });
        client.subscribe(`/topic/rooms/${slug}/participants`, (message) => {
          try {
            const payload = JSON.parse(message.body) as Participant | { event: string; userId?: string };
            if ('event' in payload) {
              if (payload.event === 'LEFT' && payload.userId) {
                setParticipants((prev) => prev.filter((p) => p.userId !== payload.userId));
              }
              if (payload.event === 'ROOM_ENDED') {
                setParticipants([]);
                setJoined(false);
                clientRef.current?.deactivate();
                clientRef.current = null;
              }
              return;
            }
            setParticipants((prev) => {
              const idx = prev.findIndex((p) => p.userId === payload.userId);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = payload;
                return next;
              }
              return [...prev, payload];
            });
          } catch (error) {
            console.error('Invalid participant payload', error);
          }
        });
        client.subscribe(`/topic/rooms/${slug}/whiteboard`, (message) => {
          try {
            const payload = JSON.parse(message.body) as { imageData: string; updatedBy?: string; updatedAtMs?: number };
            if (payload.imageData) {
              const incomingAt = payload.updatedAtMs ?? 0;
              if (incomingAt && incomingAt < whiteboardUpdatedAtRef.current) {
                return;
              }
              setWhiteboard(payload.imageData);
              setWhiteboardUpdatedBy(payload.updatedBy ?? null);
              if (incomingAt) {
                setWhiteboardUpdatedAt(incomingAt);
                whiteboardUpdatedAtRef.current = incomingAt;
              }
            }
          } catch (error) {
            console.error('Invalid whiteboard payload', error);
          }
        });
      },
      onWebSocketClose: () => {
        stompConnectedRef.current = false;
      },
      onDisconnect: () => {
        stompConnectedRef.current = false;
      },
    });
    client.activate();
    clientRef.current = client;
    return () => {
      client.deactivate();
      clientRef.current = null;
      stompConnectedRef.current = false;
    };
  }, [joined, slug]);

  const joinRoom = async () => {
    if (!slug) return;
    try {
      const updated = await joinRoomApi(slug, room?.passwordProtected ? password : undefined);
      setRoom(updated);
      setParticipants(updated.participants ?? []);
      setJoined(true);
      setJoinError(null);
    } catch (error) {
      console.error(error);
      setJoinError('Unable to join room. Check password and try again.');
    }
  };

  useEffect(() => {
    if (room && !room.passwordProtected && !joined && user) {
      joinRoom().catch(console.error);
    }
  }, [room, joined, user]);

  const leaveRoom = async () => {
    if (!slug) return;
    try {
      await leaveRoomApi(slug);
      setJoined(false);
      clientRef.current?.deactivate();
      clientRef.current = null;
      router.push('/rooms');
    } catch (error) {
      console.error(error);
    }
  };

  const deleteRoom = async () => {
    if (!slug) return;
    if (!confirm('Are you sure you want to delete this room? This will end the session for all participants.')) {
      return;
    }
    try {
      await deleteRoomApi(slug);
      setJoined(false);
      clientRef.current?.deactivate();
      clientRef.current = null;
      router.push('/rooms');
    } catch (error) {
      console.error('Failed to delete room:', error);
      alert('Failed to delete room. You must be the host to delete.');
    }
  };

  const sendMessage = () => {
    const body = messageDraft.trim();
    if (!body || !clientRef.current || !slug || !stompConnectedRef.current) return;
    clientRef.current.publish({
      destination: `/app/rooms/${slug}/chat`,
      body: JSON.stringify({ body }),
    });
    setMessageDraft('');
  };

  const sendMediaUpdate = useMemo(() => {
    const fn = throttle((update: { audioEnabled?: boolean; videoEnabled?: boolean }) => {
      if (!clientRef.current || !slug || !stompConnectedRef.current) return;
      clientRef.current.publish({
        destination: `/app/rooms/${slug}/media`,
        body: JSON.stringify(update),
      });
    }, 400);
    return fn;
  }, [slug]);

  const sendWhiteboardUpdate = useMemo(() => {
    const fn = throttle((image: string) => {
      if (!clientRef.current || !slug || !stompConnectedRef.current) return;
      clientRef.current.publish({
        destination: `/app/rooms/${slug}/whiteboard`,
        body: JSON.stringify({ imageData: image }),
      });
    }, 800);
    return fn;
  }, [slug]);

  useEffect(() => () => sendMediaUpdate.cancel(), [sendMediaUpdate]);
  useEffect(() => () => sendWhiteboardUpdate.cancel(), [sendWhiteboardUpdate]);

  const applyProblem = (p: any) => {
    setProblem(p);
    if (yContext) {
      const probMap = yContext.doc.getMap('problem');
      probMap.set('data', JSON.stringify(p));
    }
    setShowProblemSelector(false);
  };

  const bringToFront = (id: 'video' | 'chat' | 'whiteboard') => {
    setActiveWindow(id);
    setWindows((prev) => {
      if (!prev[id].open) {
        return prev;
      }
      const maxZ = Math.max(prev.video.z, prev.chat.z, prev.whiteboard.z) + 1;
      return {
        ...prev,
        [id]: { ...prev[id], z: maxZ },
      };
    });
  };

  const closeWindow = (id: 'video' | 'chat' | 'whiteboard') => {
    setWindows((prev) => {
      const next = {
        ...prev,
        [id]: { ...prev[id], open: false },
      };
      if (activeWindow === id) {
        const fallback = (['video', 'chat', 'whiteboard'] as const).find(
          (key) => key !== id && next[key].open
        );
        setActiveWindow(fallback ?? null);
      }
      return next;
    });
  };

  const toggleWindow = (id: 'video' | 'chat' | 'whiteboard') => {
    setWindows((prev) => {
      const isOpen = !prev[id].open;
      const maxZ = Math.max(prev.video.z, prev.chat.z, prev.whiteboard.z) + 1;
      if (isOpen) {
        setActiveWindow(id);
      }
      return {
        ...prev,
        [id]: { ...prev[id], open: isOpen, z: isOpen ? maxZ : prev[id].z },
      };
    });
  };

  const startDrag = (
    event: React.PointerEvent,
    id: 'video' | 'chat' | 'whiteboard',
    mode: 'move' | 'resize'
  ) => {
    event.preventDefault();
    bringToFront(id);
    const target = event.currentTarget as HTMLElement;
    const rect = target.closest('[data-window]')?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      mode,
    };
  };

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      const { id, offsetX, offsetY, mode } = dragRef.current;
      const workspaceRect = workspaceRef.current?.getBoundingClientRect();
      if (!workspaceRect) return;
      setWindows((prev) => {
        const current = prev[id];
        if (mode === 'move') {
          const nextX = event.clientX - workspaceRect.left - offsetX;
          const nextY = event.clientY - workspaceRect.top - offsetY;
          return {
            ...prev,
            [id]: {
              ...current,
              x: Math.max(12, nextX),
              y: Math.max(12, nextY),
            },
          };
        }
        const width = Math.max(240, event.clientX - workspaceRect.left - current.x);
        const height = Math.max(200, event.clientY - workspaceRect.top - current.y);
        return {
          ...prev,
          [id]: {
            ...current,
            width,
            height,
          },
        };
      });
    };
    const handleUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, []);

  const renderChat = () => (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-4 py-2 text-sm font-semibold text-slate-200">Chat</div>
      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="space-y-3 overflow-y-auto px-4 py-3 text-sm">
          {messages.length === 0 ? (
            <p className="text-slate-500">No messages yet.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-1 rounded bg-black/30 p-2">
                <div className="text-xs text-slate-400">
                  {message.authorUsername ?? 'system'} · {new Date(message.createdAt).toLocaleTimeString()}
                </div>
                <div className="text-slate-200">{message.body}</div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-slate-800 p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <input
              className="flex-1 rounded border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              placeholder="Send a message"
              disabled={!joined}
            />
            <button
              type="submit"
              disabled={!joined}
              className="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  if (!room) {
    return <div className="text-slate-400">Loading room…</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-100">{room.name}</h1>
          <p className="text-sm text-slate-500">
            Host: {participants.find((p) => p.userId === room.hostId)?.displayName ?? 'unknown'} · {room.type}
          </p>
          {room.description ? <p className="text-sm text-slate-300">{room.description}</p> : null}
          {joinError ? <p className="text-sm text-rose-400">{joinError}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {joined ? (
            <>
              <button
                onClick={leaveRoom}
                className="rounded border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
              >
                Leave Room
              </button>
              {user?.id === room.hostId && (
                <button
                  onClick={deleteRoom}
                  className="rounded border border-rose-500 px-3 py-1 text-sm text-rose-300 hover:bg-rose-500/10"
                >
                  Delete Room
                </button>
              )}
            </>
          ) : (
            <>
              {room.passwordProtected ? (
                <input
                  type="password"
                  placeholder="Room password"
                  className="rounded border border-slate-700 bg-black/40 px-3 py-1 text-sm text-slate-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              ) : null}
              <button
                onClick={joinRoom}
                disabled={!user}
                className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {user ? 'Join room' : 'Sign in required'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-hidden lg:flex-row lg:items-stretch">
        <section className="flex min-h-0 flex-col gap-4 lg:w-[320px] lg:shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Problem</h2>
              <p className="text-xs text-slate-500">Select a LeetCode problem to solve together</p>
            </div>
            <button
              onClick={() => setShowProblemSelector(true)}
              className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              disabled={!joined}
            >
              {problem ? 'Change Problem' : 'Choose Problem'}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {problem ? (
              <div className="space-y-4">
                <ProblemPanel problem={problem} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-slate-400">
                No problem selected yet.
              </div>
            )}
          </div>

          {showProblemSelector && (
            <ProblemSelector onSelect={applyProblem} onClose={() => setShowProblemSelector(false)} />
          )}
        </section>

        <section className="flex-1 min-h-0 overflow-hidden">
          <div
            ref={workspaceRef}
            className="relative h-full min-h-0 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl"
          >
            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2">
                <span className="text-sm text-slate-300">Editor Mode</span>
                <button
                  onClick={() => setUseMultiTab(!useMultiTab)}
                  className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-emerald-500"
                >
                  {useMultiTab ? 'Multi-Tab' : 'Single Tab'}
                </button>
              </div>

              <div className="flex-1 min-h-0 rounded-xl border border-slate-800 bg-slate-900/40">
                {yContext ? (
                  useMultiTab ? (
                    <MultiTabCodeEditor doc={yContext.doc} provider={yContext.provider} readOnly={!joined} />
                  ) : (
                    <CodeEditor
                      doc={yContext.doc}
                      provider={yContext.provider}
                      language={currentLanguage}
                      readOnly={!joined}
                      onLanguageChange={(lang) => {
                        setCurrentLanguage(lang);
                        const langMap = yContext.doc.getMap('language');
                        langMap.set('current', lang);
                      }}
                    />
                  )
                ) : null}
              </div>

              <div className="grid h-[320px] gap-4 lg:grid-cols-2">
                <div className="h-full min-h-0 overflow-hidden">
                  <CodeExecutor code={currentCode} language={currentLanguage} />
                </div>
                <div className="h-full min-h-0 overflow-hidden">
                  {problem ? (
                    <TestCaseRunner
                      problem={problem}
                      roomSlug={slug ?? ''}
                      code={currentCode}
                      language={currentLanguage}
                      disabled={!joined}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                      Select a problem to manage testcases.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              {(['video', 'chat', 'whiteboard'] as const).map((id) => {
                const win = windows[id];
                if (!win.open) {
                  return null;
                }
                return (
                  <div
                    key={id}
                    data-window
                    style={{
                      left: win.x,
                      top: win.y,
                      width: win.width,
                      height: win.height,
                      zIndex: win.z,
                    }}
                    className="absolute rounded-2xl border border-slate-700 bg-slate-900/80 shadow-xl backdrop-blur"
                    onPointerDown={() => bringToFront(id)}
                  >
                    <div
                      className={`flex items-center justify-between rounded-t-2xl border-b border-slate-800 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-400 ${
                        activeWindow === id ? 'bg-slate-800/60' : 'bg-slate-900/60'
                      }`}
                      onPointerDown={(event) => startDrag(event, id, 'move')}
                    >
                      <span>{id === 'video' ? 'Video' : id === 'chat' ? 'Chat' : 'Whiteboard'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">drag</span>
                        <button
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            closeWindow(id);
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-200"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="h-[calc(100%-36px)] p-2">
                      {id === 'video' ? (
                        <VideoGrid
                          roomSlug={slug}
                          userId={selfIdRef.current}
                          joined={joined}
                          onMediaChange={(state: { audioEnabled: boolean; videoEnabled: boolean }) =>
                            sendMediaUpdate({ audioEnabled: state.audioEnabled, videoEnabled: state.videoEnabled })
                          }
                        />
                      ) : id === 'chat' ? (
                        renderChat()
                      ) : (
                        <WhiteboardCanvas
                          imageData={whiteboard}
                          lastUpdatedBy={whiteboardUpdatedBy ?? undefined}
                          localUser={user?.login ?? undefined}
                          disabled={!joined}
                          onChange={(image) => {
                            const now = Date.now();
                            setWhiteboard(image);
                            setWhiteboardUpdatedBy(user?.login ?? null);
                            setWhiteboardUpdatedAt(now);
                            whiteboardUpdatedAtRef.current = now;
                            sendWhiteboardUpdate(image);
                          }}
                        />
                      )}
                    </div>
                    <div
                      className="absolute bottom-2 right-2 h-3 w-3 cursor-se-resize rounded-full border border-slate-600 bg-slate-700"
                      onPointerDown={(event) => startDrag(event, id, 'resize')}
                    />
                  </div>
                );
              })}
            </div>

            <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 lg:block">
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 shadow-xl">
                {(['video', 'chat', 'whiteboard'] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => toggleWindow(id)}
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                      windows[id].open
                        ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-200'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:hidden">
            <VideoGrid
              roomSlug={slug}
              userId={selfIdRef.current}
              joined={joined}
              onMediaChange={(state: { audioEnabled: boolean; videoEnabled: boolean }) =>
                sendMediaUpdate({ audioEnabled: state.audioEnabled, videoEnabled: state.videoEnabled })
              }
            />
            {renderChat()}
            <WhiteboardCanvas
              imageData={whiteboard}
              lastUpdatedBy={whiteboardUpdatedBy ?? undefined}
              localUser={user?.login ?? undefined}
              disabled={!joined}
              onChange={(image) => {
                const now = Date.now();
                setWhiteboard(image);
                setWhiteboardUpdatedBy(user?.login ?? null);
                setWhiteboardUpdatedAt(now);
                whiteboardUpdatedAtRef.current = now;
                sendWhiteboardUpdate(image);
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
