import React, { type Dispatch, type MutableRefObject, type SetStateAction, useRef, useState } from "react";
import { MessageCircleMore, MessageCircleOff } from "lucide-react";
import { cn } from "../../utils";

// Simplified button for ncs-app
const SmallButton = ({ children, onClick, title, isActive }: { 
  children: React.ReactNode; 
  onClick: () => void; 
  title: string;
  isActive?: boolean;
}) => (
  <button 
    onClick={onClick} 
    title={title}
    className={cn(
      'flex items-center justify-center p-2 rounded-md border transition-colors',
      isActive
        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    )}
  >
    {children}
  </button>
);

const TranscriptionButton = (props: { setTranscriptionSubtitle: setTranscriptionSubtitle; client: MutableRefObject<ReturnType<typeof import("@zoom/videosdk").default.createClient>> }) => {
  const { setTranscriptionSubtitle, client } = props;
  const [isStartedLiveTranscription, setIsStartedLiveTranscription] = useState(false);
  const transcriptionClient = useRef(client.current.getLiveTranscriptionClient());

  const onTranscriptionClick = async () => {
    const handleCaptions = (payload: any) => {
      setTranscriptionSubtitle(
        (prev) =>
          ({
            ...prev,
            [payload.msgId]: { 
                name: payload.displayName, 
                text: payload.text, 
                isSelf: payload.userId === client.current.getCurrentUserInfo().userId 
            },
          })
      );
    };

    if (transcriptionClient.current === undefined) return;

    if (isStartedLiveTranscription) {
      client.current.off(`caption-message`, handleCaptions);
      await transcriptionClient.current.disableCaptions(true);
      setIsStartedLiveTranscription(false);
    } else {
      console.log("[Zoom] Starting live transcription");
      client.current.on(`caption-message`, handleCaptions);
      await transcriptionClient.current.startLiveTranscription();
      setIsStartedLiveTranscription(true);
    }
  };

  return (
    <SmallButton onClick={onTranscriptionClick} isActive={isStartedLiveTranscription} title="Live Transcription">
      {isStartedLiveTranscription ? <MessageCircleOff className="w-5 h-5" /> : <MessageCircleMore className="w-5 h-5" />}
    </SmallButton>
  );
};

export default TranscriptionButton;

type setTranscriptionSubtitle = Dispatch<
  SetStateAction<
    Record<
      string,
      {
        name: string;
        text: string;
        isSelf: boolean;
      }
    >
  >
>;
