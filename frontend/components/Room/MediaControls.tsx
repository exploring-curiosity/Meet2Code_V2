import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface MediaControlsProps {
  audioEnabled: boolean
  videoEnabled: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
}

export default function MediaControls({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo
}: MediaControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
      <button
        onClick={onToggleAudio}
        className={`p-3 rounded-full ${
          audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-400'
        }`}
      >
        {audioEnabled ? (
          <Mic className="w-6 h-6 text-white" />
        ) : (
          <MicOff className="w-6 h-6 text-white" />
        )}
      </button>

      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-full ${
          videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-400'
        }`}
      >
        {videoEnabled ? (
          <Video className="w-6 h-6 text-white" />
        ) : (
          <VideoOff className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  )
}