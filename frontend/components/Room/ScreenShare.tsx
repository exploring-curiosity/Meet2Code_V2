'use client';

import { useEffect, useRef, useState } from 'react';
import { Monitor, MonitorOff } from 'lucide-react';

type ScreenShareProps = {
  roomSlug: string;
  userId: string;
  joined: boolean;
  onScreenShare?: (sharing: boolean) => void;
};

export function ScreenShare({ roomSlug, userId, joined, onScreenShare }: ScreenShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const basePeerUrl = process.env.NEXT_PUBLIC_PEER_URL ?? 'ws://localhost:8080/ws';

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
        audio: false,
      });

      setScreenStream(stream);
      setIsSharing(true);
      onScreenShare?.(true);

      // Listen for when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

      // Notify other participants via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'screen-share-start',
            userId,
            roomSlug,
          })
        );
      }
    } catch (error) {
      console.error('Failed to start screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
    setIsSharing(false);
    onScreenShare?.(false);

    // Notify other participants
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'screen-share-stop',
          userId,
          roomSlug,
        })
      );
    }
  };

  useEffect(() => {
    const videoElement = screenVideoRef.current;
    if (videoElement && screenStream) {
      videoElement.srcObject = screenStream;
    }
  }, [screenStream]);

  useEffect(() => {
    if (!joined) return;

    // Connect to WebSocket for screen share signaling
    const normalized = basePeerUrl.replace(/^https?:\/\//u, 'ws://').replace(/\/+$/u, '');
    const ws = new WebSocket(`${normalized}/screen/${roomSlug}?userId=${encodeURIComponent(userId)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Screen share WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Screen share message:', message);
        // Handle incoming screen share events from other participants
      } catch (error) {
        console.error('Invalid screen share message', error);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
      stopScreenShare();
    };
  }, [joined, roomSlug, userId, basePeerUrl]);

  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [screenStream]);

  if (!joined) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="border-b border-slate-800 px-4 py-2 text-sm font-semibold text-slate-200">
        Screen Sharing
      </div>
      <div className="p-4">
        {isSharing ? (
          <div className="space-y-3">
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              className="h-64 w-full rounded bg-slate-950 object-contain"
            />
            <button
              onClick={stopScreenShare}
              className="flex w-full items-center justify-center gap-2 rounded bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
            >
              <MonitorOff className="h-4 w-4" />
              Stop Sharing
            </button>
          </div>
        ) : (
          <button
            onClick={startScreenShare}
            className="flex w-full items-center justify-center gap-2 rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            <Monitor className="h-4 w-4" />
            Share Screen
          </button>
        )}
      </div>
    </div>
  );
}
