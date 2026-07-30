import React from "react";
import { VideoOff } from "lucide-react";
import { cn } from "../../utils";

interface ParticipantLabelProps {
  displayName: string;
  isVideoOn: boolean;
  isMe?: boolean;
  className?: string;
}

const ParticipantLabel: React.FC<ParticipantLabelProps> = ({ 
  displayName, 
  isVideoOn, 
  isMe = false,
  className = "" 
}) => {
  return (
    <div 
      className={cn(
        'flex items-center px-3 py-1.5 rounded-lg bg-[#2a2d32]/95 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 w-fit max-w-full',
        className,
      )}
    >
      <span title={displayName} className="text-white text-[11.5px] font-bold tracking-tight truncate min-w-0 flex-1">
        {displayName}{isMe ? " (You)" : ""}
      </span>
      {!isVideoOn && (
        <VideoOff size="1.5rem" 
          className="ml-2 w-3.5 h-3.5 text-red-500 shrink-0" 
          strokeWidth={3}
        />
      )}
    </div>
  );
};

export default ParticipantLabel;
