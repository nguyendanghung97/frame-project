import React, { useCallback, useState, useRef, useLayoutEffect, type MutableRefObject } from 'react';
import { type VideoClient } from '@zoom/videosdk';

import { X } from 'lucide-react';
import { cn } from '../../utils';

const Chat = (props: { client: MutableRefObject<typeof VideoClient>; records: ChatRecord[]; onClose: () => void }) => {
  const zmClient = props.client.current;
  const records = props.records;
  const chatClient = zmClient.getChatClient();
  const [chatDraft, setChatDraft] = useState<string>('');
  const chatWrapRef = useRef<HTMLDivElement | null>(null);

  const onChatPressEnter = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      if (chatDraft) {
        void chatClient.sendToAll(chatDraft);
        setChatDraft('');
      }
    },
    [chatDraft, chatClient],
  );

  useLayoutEffect(() => {
    if (chatWrapRef.current) {
      chatWrapRef.current.scrollTo(0, chatWrapRef.current.scrollHeight);
    }
  }, [records]);

  return (
    <div className="flex h-full w-full flex-col bg-transparent">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h3 className="text-white font-bold text-sm tracking-tight">Meeting Chat</h3>
        <button 
          onClick={props.onClose}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* MESSAGES LIST */}
      <div 
        ref={chatWrapRef} 
        className="p-3.5 flex-1 flex flex-col gap-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-chat-scrollbar"
      >
        {records.map((record, idx) => (
          <ChatMessageItem 
            record={record} 
            currentUserId={zmClient.getSessionInfo().userId} 
            key={`${record.timestamp}-${idx}`} 
          />
        ))}
      </div>

      {/* INPUT AREA */}
      <div className="relative p-2 pt-0 bg-transparent">
        <textarea
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="w-full bg-white/5 z-20 border border-white/10 rounded-xl px-4 py-3 pr-6 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none shadow-none custom-chat-scrollbar"
          style={{ minHeight: '80px', maxHeight: '150px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              onChatPressEnter(event);
            }
          }}
          onChange={(event) => setChatDraft(event.target.value)}
          value={chatDraft}
          placeholder="Type a message..."
        />
        <div className="absolute right-4 bottom-4 flex items-center pointer-events-none opacity-40">
             <span className="text-lg text-white font-mono tracking-tighter">⏎</span>
        </div>
      </div>
      
      <style>{`
        .custom-chat-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-chat-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        
        /* Specific override for the textarea to hide ALL scrollbar parts */
        textarea.custom-chat-scrollbar::-webkit-scrollbar { 
          display: none !important;
          width: 0 !important;
          background: transparent !important;
          visibility: hidden !important;
        }
        textarea.custom-chat-scrollbar { 
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `}</style>
    </div>
  );
};

const ChatMessageItem = (props: { record: ChatRecord; currentUserId: number }) => {
  const { record, currentUserId } = props;
  const { message, sender, timestamp } = record;
  const isCurrentUser = currentUserId === sender.userId;

  return (
    <div className={cn('flex flex-col', isCurrentUser ? 'items-end' : 'items-start')}>
      {!isCurrentUser && (
        <span className="text-[10px] font-bold text-gray-500 mb-1 ml-1 tracking-wider">
          {sender.name}
        </span>
      )}
      <div
        className={cn(
          'relative max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
          isCurrentUser
            ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10'
            : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5 backdrop-blur-sm',
        )}
      >
        <p className="break-words">{message}</p>
        <div className={cn('mt-1 text-[9px] opacity-40 font-mono', isCurrentUser ? 'text-right' : 'text-left')}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export interface ChatRecord {
  message?: string;
  id?: string;
  sender: {
    name: string;
    userId: number;
  };
  receiver: {
    name: string;
    userId: number;
  };
  timestamp: number;
}

export default Chat;
