import { type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction, useState } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { cn } from "../../utils";

const SmallButton = ({ children, onClick, title }: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) => (
  <button 
    onClick={onClick} 
    title={title}
    className="flex items-center justify-center p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
  >
    {children}
  </button>
);

const MicButton = ({ client, isAudioMuted, setIsAudioMuted, onAudioStateChange } : {
    client: MutableRefObject<ReturnType<typeof import("@zoom/videosdk").default.createClient>>;
    isAudioMuted: boolean;
    setIsAudioMuted: Dispatch<SetStateAction<boolean>>;
    onAudioStateChange?: () => void;
  }) => {

  const onMicrophoneClick = async () => {
    if (!client?.current) return;
    const mediaStream = client.current.getMediaStream();
    if (!mediaStream) return;

    try {
      if (isAudioMuted) {
        await mediaStream.unmuteAudio();
      } else {
        await mediaStream.muteAudio();
      }
    } catch (error: any) {
        console.warn("[ZoomSDK] Mic toggle failed:", error);
        // Error 6015: "no audio joined" -> Try to start audio and retry
        if (error?.reason === 'no audio joined' || error?.errorCode === 6015) {
            console.log("[ZoomSDK] Audio not joined. Attempting to start audio...");
            try {
                await mediaStream.startAudio();
                // Retry the original action
                if (isAudioMuted) await mediaStream.unmuteAudio();
                else await mediaStream.muteAudio();
            } catch (startError) {
                console.error("[ZoomSDK] Failed to auto-recover audio:", startError);
            }
        }
    }

    const userInfo = client.current.getCurrentUserInfo();
    if (userInfo) {
      setIsAudioMuted(userInfo.muted ?? true);
      // Trigger badge update
      if (onAudioStateChange) {
        onAudioStateChange();
      }
    }
  };
  return (
    <SmallButton onClick={onMicrophoneClick} title="Microphone">
      {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </SmallButton>
  );
};

const CameraButton = ({ client, isVideoMuted, setIsVideoMuted, renderVideo, currentBackground }: {
  client: MutableRefObject<ReturnType<typeof import("@zoom/videosdk").default.createClient>>;
  isVideoMuted: boolean;
  setIsVideoMuted: Dispatch<SetStateAction<boolean>>;
  renderVideo: (event: { action: "Start" | "Stop"; userId: number }) => Promise<void>;
  currentBackground: string;
}) => {
  /* import { Loader2 } from "lucide-react";  <-- Ensure this is imported at top or used inline */
  // Fix imports at top first
  
  const [isLoading, setIsLoading] = useState(false);

  const onCameraClick = async () => {
    if (!client?.current || isLoading) return; // Prevent double click
    const mediaStream = client.current.getMediaStream();
    if (!mediaStream) return;

    const userInfo = client.current.getCurrentUserInfo();
    if (!userInfo) return;

    setIsLoading(true); // Start Loading
    try {
        if (isVideoMuted) {
            await mediaStream.startVideo({ virtualBackground: { imageUrl: currentBackground } });
            setIsVideoMuted(false);
            await renderVideo({ action: "Start", userId: userInfo.userId });
        } else {
            await mediaStream.stopVideo();
            setIsVideoMuted(true);
            await renderVideo({ action: "Stop", userId: userInfo.userId });
        }
    } catch (error: any) {
        console.warn("[ZoomSDK] Camera toggle failed:", error);
        // Error 6109: "camera is closed" -> Video is already stopped, just update UI
        if (error?.reason === 'camera is closed' || error?.errorCode === 6109) {
             setIsVideoMuted(true);
             await renderVideo({ action: "Stop", userId: userInfo.userId });
        }
    } finally {
        setIsLoading(false); // Stop Loading
    }
  };

  return (
    <button 
        onClick={onCameraClick} 
        title={isLoading ? "Starting Camera..." : "Camera"}
        disabled={isLoading}
        className={cn(
          'flex items-center justify-center p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors',
          isLoading && 'opacity-70 cursor-not-allowed',
        )}
    >
      {isLoading ? (
          <div className="w-5 h-5 animate-spin border-2 border-gray-400 border-t-transparent rounded-full" />
      ) : (
          isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />
      )}
    </button>
  );
};

export { MicButton, CameraButton };
