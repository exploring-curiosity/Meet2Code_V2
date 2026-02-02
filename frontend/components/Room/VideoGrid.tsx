'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import SimplePeer, { Instance as SimplePeerInstance, SignalData } from 'simple-peer';
import { nanoid } from 'nanoid';

type PeerMessage =
  | { type: 'introduce'; clientId: string; responded?: boolean }
  | { type: 'signal'; from: string; to: string; signal: SignalData }
  | { type: 'leave'; clientId: string };

type RemoteStream = {
  stream: MediaStream;
  clientId: string;
};

type VideoGridProps = {
  roomSlug: string;
  userId?: string;
  joined: boolean;
  onMediaChange: (state: { audioEnabled: boolean; videoEnabled: boolean }) => void;
};

const basePeerUrl = process.env.NEXT_PUBLIC_PEER_URL ?? 'ws://localhost:8080/ws';

function normalisePeerUrl(): string {
  if (basePeerUrl.startsWith('http://')) {
    return 'ws://' + basePeerUrl.slice('http://'.length);
  }
  if (basePeerUrl.startsWith('https://')) {
    return 'wss://' + basePeerUrl.slice('https://'.length);
  }
  return basePeerUrl;
}

export function VideoGrid({ roomSlug, userId, joined, onMediaChange }: VideoGridProps) {
  const selfIdRef = useRef<string>(userId ?? nanoid());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, SimplePeerInstance>>(new Map());

  const peerUrl = useMemo(() => {
    const normalized = normalisePeerUrl().replace(/\/+$/u, '');
    return `${normalized}/${roomSlug}`;
  }, [roomSlug]);

  useEffect(() => {
    if (userId && selfIdRef.current !== userId) {
      selfIdRef.current = userId;
    }
  }, [userId]);

  const sendMessage = (message: PeerMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    if (!joined) return;
    onMediaChange({ audioEnabled, videoEnabled });
  }, [audioEnabled, videoEnabled, joined, onMediaChange]);

  useEffect(() => {
    if (!joined) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        // Start with media disabled
        stream.getAudioTracks().forEach((track) => (track.enabled = false));
        stream.getVideoTracks().forEach((track) => (track.enabled = false));
        setLocalStream(stream);
        setMediaError(null);
      })
      .catch((error) => {
        console.error('Failed to obtain media', error);
        setMediaError('Camera/microphone not available. Video features disabled.');
      });
    return () => {
      cancelled = true;
    };
  }, [joined]);

  useEffect(() => {
    const videoElement = localVideoRef.current;
    if (videoElement && localStream) {
      videoElement.srcObject = localStream;
      localStream.getAudioTracks().forEach((track) => (track.enabled = audioEnabled));
      localStream.getVideoTracks().forEach((track) => (track.enabled = videoEnabled));
    }
  }, [localStream, audioEnabled, videoEnabled]);

  const ensurePeer = (remoteId: string): SimplePeerInstance | null => {
    if (!localStream || remoteId === selfIdRef.current) {
      return null;
    }

    let peer = peersRef.current.get(remoteId);
    if (peer) {
      return peer;
    }

    const initiator = selfIdRef.current > remoteId;
    peer = new SimplePeer({ initiator, stream: localStream, trickle: true });

    peer.on('signal', (signal) => {
      sendMessage({ type: 'signal', from: selfIdRef.current, to: remoteId, signal });
    });

    peer.on('stream', (stream) => {
      setRemoteStreams((prev) => {
        const filtered = prev.filter((entry) => entry.clientId !== remoteId);
        return [...filtered, { clientId: remoteId, stream }];
      });
    });

    peer.on('close', () => {
      peersRef.current.delete(remoteId);
      setRemoteStreams((prev) => prev.filter((entry) => entry.clientId !== remoteId));
    });

    peer.on('error', (error) => {
      console.error('Peer error', error);
    });

    peersRef.current.set(remoteId, peer);
    return peer;
  };

  useEffect(() => {
    if (!joined || !localStream) {
      return () => undefined;
    }

    const ws = new WebSocket(`${peerUrl}?clientId=${encodeURIComponent(selfIdRef.current)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      sendMessage({ type: 'introduce', clientId: selfIdRef.current });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as PeerMessage;
        if (message.type === 'introduce') {
          if (message.clientId === selfIdRef.current) {
            return;
          }
          ensurePeer(message.clientId);
          if (!message.responded) {
            sendMessage({ type: 'introduce', clientId: selfIdRef.current, responded: true });
          }
          return;
        }
        if (message.type === 'signal') {
          if (message.to !== selfIdRef.current) {
            return;
          }
          const peer = ensurePeer(message.from);
          peer?.signal(message.signal);
          return;
        }
        if (message.type === 'leave') {
          const peer = peersRef.current.get(message.clientId);
          peer?.destroy();
          peersRef.current.delete(message.clientId);
          setRemoteStreams((prev) => prev.filter((entry) => entry.clientId !== message.clientId));
        }
      } catch (error) {
        console.error('Invalid peer message', error);
      }
    };

    ws.onclose = () => {
      peersRef.current.forEach((peer) => peer.destroy());
      peersRef.current.clear();
      setRemoteStreams([]);
      wsRef.current = null;
    };

    return () => {
      ws.close();
      peersRef.current.forEach((peer) => peer.destroy());
      peersRef.current.clear();
      setRemoteStreams([]);
      wsRef.current = null;
    };
  }, [joined, localStream, peerUrl]);

  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [localStream]);

  const toggleAudio = () => {
    if (!localStream || !joined) return;
    const next = !audioEnabled;
    localStream.getAudioTracks().forEach((track) => (track.enabled = next));
    setAudioEnabled(next);
  };

  const toggleVideo = () => {
    if (!localStream || !joined) return;
    const next = !videoEnabled;
    localStream.getVideoTracks().forEach((track) => (track.enabled = next));
    setVideoEnabled(next);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="border-b border-slate-800 px-4 py-2 text-sm font-semibold text-slate-200">Video collaboration</div>
      {mediaError && (
        <div className="mx-4 mt-2 rounded border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          {mediaError}
        </div>
      )}
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div className="rounded border border-slate-800 bg-black/40 p-2">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-48 w-full rounded bg-slate-950 object-cover"
          />
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>You</span>
            <div className="space-x-2">
              <button
                onClick={toggleAudio}
                disabled={!joined}
                className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-emerald-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
              >
                {audioEnabled ? 'Mute' : 'Unmute'}
              </button>
              <button
                onClick={toggleVideo}
                disabled={!joined}
                className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-emerald-500 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
              >
                {videoEnabled ? 'Stop video' : 'Start video'}
              </button>
            </div>
          </div>
        </div>
        {remoteStreams.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded border border-slate-800 bg-black/20 text-sm text-slate-500">
            Waiting for peers…
          </div>
        ) : (
          remoteStreams.map(({ clientId, stream }) => (
            <RemoteVideo key={clientId} clientId={clientId} stream={stream} />
          ))
        )}
      </div>
    </div>
  );
}

type RemoteVideoProps = {
  clientId: string;
  stream: MediaStream;
};

function RemoteVideo({ clientId, stream }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="rounded border border-slate-800 bg-black/40 p-2">
      <video ref={videoRef} autoPlay playsInline className="h-48 w-full rounded bg-slate-950 object-cover" />
      <div className="mt-2 text-xs text-slate-400">Peer: {clientId.slice(0, 8)}</div>
    </div>
  );
}
