import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils";

interface AvatarPlaceholderProps {
  displayName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({ 
  displayName, 
  className = "", 
  size = 'lg',
  isLoading = false
}) => {
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const containerClasses = {
    sm: "h-[25%] min-h-[48px]",
    md: "h-[30%] min-h-[64px]",
    lg: "h-[35%] min-h-[80px]"
  };

  return (
    <div className={cn(
      'absolute inset-0 flex items-center justify-center bg-[#22252b] z-0 transition-opacity duration-500 rounded-inherit [container-type:size]',
      className,
    )}>
      <div 
        className={cn(
          containerClasses[size],
          'aspect-square rounded-full flex items-center justify-center font-bold bg-linear-to-br from-[#3a6073] to-[#3a7bd5] text-white shadow-[0_0_40px_rgba(58,123,213,0.3)] border-4 border-white/10',
        )}
        style={{ fontSize: '12cqmin' }}
      >
        {isLoading ? (
             <Loader2 className="w-[40%] h-[40%] animate-spin text-white/90" />
        ) : getInitials(displayName)}
      </div>
    </div>
  );
};

export default AvatarPlaceholder;
