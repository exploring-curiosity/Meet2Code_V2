import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import SimplePeer, { Instance as SimplePeerInstance, SignalData } from 'simple-peer'
import VideoPeer from './VideoPeer'
import MediaControls from './MediaControls'

type PeerMessage =
  | { type: 'introduce'; clientId: string; username?: string }
  | { type: 'signal'; from: string; to: string; signal: SignalData; responded?: boolean; username?: string }
  | { type: 'leave'; clientId: string }
  | { type: 'media-update'; clientId: string; audioEnabled: boolean; videoEnabled: boolean }

interface VideoRoomProps {
  roomId: string
  apiEndpoint: string
  peerEndpoint: string
  onMediaChange: (state: { audioEnabled: boolean; videoEnabled: boolean }) => void
}

interface RemoteStream {
  stream: MediaStream
  clientId: string
  audioEnabled: boolean
  videoEnabled: boolean
  username?: string
}

export default function VideoRoom({ roomId, apiEndpoint, peerEndpoint, onMediaChange }: VideoRoomProps) {
  const { data: session } = useSession()
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const peersRef = useRef<Map<string, SimplePeerInstance>>(new Map())

  useEffect(() => {
    if (!session?.user?.name) return

    // Connect to WebSocket signaling server
    const ws = new WebSocket(`${peerEndpoint}/ws/${roomId}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as PeerMessage
      if (message.type === 'introduce') {
        if (!localStream) return
        const peer = new SimplePeer({
          initiator: true,
          stream: localStream,
          trickle: false
        })

        peer.on('signal', (data: SignalData) => {
          ws.send(JSON.stringify({
            type: 'signal',
            from: session?.user?.name || 'Unknown',
            to: message.clientId,
            signal: data
          } as PeerMessage))
        })

        peer.on('stream', (stream) => {
          setRemoteStreams((prev) => [
            ...prev,
            {
              stream,
              clientId: message.clientId,
              audioEnabled: true,
              videoEnabled: true,
              username: message.username
            }
          ])
        })

        peersRef.current.set(message.clientId, peer)
      } else if (message.type === 'signal') {
        const peer = peersRef.current.get(message.from)
        if (peer) {
          peer.signal(message.signal)
        } else if (!message.responded && localStream) {
          const peer = new SimplePeer({
            initiator: false,
            stream: localStream,
            trickle: false
          })

          peer.on('signal', (data) => {
            ws.send(JSON.stringify({
              type: 'signal',
              from: session.user?.name || 'Unknown',
              to: message.from,
              signal: data,
              responded: true
            }))
          })

          peer.on('stream', (stream) => {
            setRemoteStreams((prev) => [
              ...prev,
              {
                stream,
                clientId: message.from,
                audioEnabled: true,
                videoEnabled: true,
                username: message.username
              }
            ])
          })

          peer.signal(message.signal)
          peersRef.current.set(message.from, peer)
        }
      } else if (message.type === 'leave') {
        const peer = peersRef.current.get(message.clientId)
        if (peer) {
          peer.destroy()
          peersRef.current.delete(message.clientId)
        }
        setRemoteStreams((prev) =>
          prev.filter((p) => p.clientId !== message.clientId)
        )
      } else if (message.type === 'media-update') {
        setRemoteStreams((prev) =>
          prev.map((p) =>
            p.clientId === message.clientId
              ? {
                  ...p,
                  audioEnabled: message.audioEnabled,
                  videoEnabled: message.videoEnabled
                }
              : p
          )
        )
      }
    }

    // Get user media
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true
      })
      .then((stream) => {
        setLocalStream(stream)
        stream.getAudioTracks()[0].enabled = audioEnabled
        stream.getVideoTracks()[0].enabled = videoEnabled

        // Announce presence to room
        ws.send(JSON.stringify({
          type: 'introduce',
          clientId: session.user?.name || 'Unknown',
          username: session.user?.name
        }))
      })
      .catch(console.error)

    // Message handling is done in the ws.onmessage event handler

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      wsRef.current?.close()
      peersRef.current.forEach((peer) => peer.destroy())
      peersRef.current.clear()
    }
  }, [session?.user?.name, peerEndpoint, roomId])

  useEffect(() => {
    onMediaChange({ audioEnabled, videoEnabled })
  }, [audioEnabled, videoEnabled, onMediaChange])

  useEffect(() => {
    // Update media tracks when audioEnabled/videoEnabled changes
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = audioEnabled;
      });
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = videoEnabled;
      });
      wsRef.current?.send(JSON.stringify({
        type: 'media-update',
        clientId: session?.user?.name || 'Unknown',
        audioEnabled,
        videoEnabled
      } as PeerMessage));
    }
  }, [audioEnabled, videoEnabled, localStream, session?.user?.name]);

  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
  }

  const toggleVideo = () => {
    setVideoEnabled((prev) => !prev);
  }

  return (
    <div className="relative w-full h-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 max-h-[calc(100%-64px)] overflow-y-auto">
        {localStream && (
          <VideoPeer
            stream={localStream}
            username={session?.user?.name || 'You'}
            muted
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
          />
        )}
        {remoteStreams.map((peer) => (
          <VideoPeer
            key={peer.clientId}
            stream={peer.stream}
            username={peer.username || 'Unknown'}
            audioEnabled={peer.audioEnabled}
            videoEnabled={peer.videoEnabled}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-slate-800/60 px-4 py-2">
        <MediaControls
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
        />
      </div>
    </div>
  )
}