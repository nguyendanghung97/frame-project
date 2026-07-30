import React, { type MutableRefObject, useRef, useState } from "react";
import { RecordingStatus } from "@zoom/videosdk";
import { CircleDotIcon, CircleSlash2 } from "lucide-react";
import { cn } from "../../utils";

const SmallButton = ({ children, onClick, title, isRecording }: { 
  children: React.ReactNode; 
  onClick: () => void; 
  title: string;
  isRecording?: boolean;
}) => (
  <button 
    onClick={onClick} 
    title={title}
    className={cn(
      'flex items-center justify-center p-2 rounded-md border transition-colors',
      isRecording
        ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    )}
  >
    {children}
  </button>
);

const RecordingButton = (props: { 
  client: MutableRefObject<ReturnType<typeof import("@zoom/videosdk").default.createClient>>;
  onStatusChange?: (status: RecordingStatus) => void;
}) => {
  const { client, onStatusChange } = props;
  const [isRecording, setIsRecording] = useState(RecordingStatus.Stopped);
  const recordingClient = useRef(client.current.getRecordingClient());

  const onRecordingClick = async () => {
    if (recordingClient.current === undefined) return;
    if (recordingClient.current?.getCloudRecordingStatus() === RecordingStatus.Recording) {
      await recordingClient.current.stopCloudRecording();
    } else {
      await recordingClient.current.startCloudRecording();
    }
    const currentStatus = recordingClient.current.getCloudRecordingStatus();
    setIsRecording(currentStatus);
    onStatusChange?.(currentStatus);
  };

  return (
    <SmallButton onClick={onRecordingClick} isRecording={isRecording === RecordingStatus.Recording} title="Cloud Recording">
      {isRecording === RecordingStatus.Recording ? <CircleSlash2 className="w-5 h-5" /> : <CircleDotIcon className="w-5 h-5" />}
    </SmallButton>
  );
};

export default RecordingButton;
