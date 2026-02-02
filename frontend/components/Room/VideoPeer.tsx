import { useEffect, useRef } from 'react'
import { MicOff, VideoOff } from 'lucide-react'

interface VideoPeerProps {
  stream: MediaStream
  username: string
  muted?: boolean
  audioEnabled: boolean
  videoEnabled: boolean
}

export default function VideoPeer({ 
  stream,
  username,
  muted = false,
  audioEnabled,
  videoEnabled
}: VideoPeerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm truncate">
            {username}
          </span>
          <div className="flex items-center gap-2">
            {!audioEnabled && (
              <div className="bg-red-500 rounded-full p-1">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
            {!videoEnabled && (
              <div className="bg-red-500 rounded-full p-1">
                <VideoOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}