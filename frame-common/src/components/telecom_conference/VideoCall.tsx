/** Zoom VideoCall — telecom conference in-call UI. */
import { type MutableRefObject, useState, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { RecordingStatus, VideoQuality, type VideoPlayer, type ChatMessage, type Participant } from '@zoom/videosdk';
import { PhoneOff, MessageCircle, Settings as SettingsIcon, Loader2, Link2, Check, UserPlus, ExternalLink, Monitor, PictureInPicture2 } from "lucide-react";
import { useStore } from "@nanostores/react";
import { type ChatRecord } from './Chat';
import SettingsPanel from "./SettingsPanel";
import { type setTranscriptionType } from "./Transcript";
import RecordingButton from "./RecordingButton";
import { CameraButton, MicButton } from "./MuteButton";
import Preview from "./Preview";
import Chat from "./Chat";
import AvatarPlaceholder from "./AvatarPlaceholder";
import { cn } from "../../utils";
import ParticipantLabel from "./ParticipantLabel";
import {
  $telecomConferencePipEnabled,
  setTelecomConferencePipEnabled,
} from "../../stores/telecomConferenceStore";

interface ParticipantContainer extends HTMLDivElement {
  _avatarRoot?: any;
  _labelRoot?: any;
  _lastIsInteracting?: boolean;
}

// Zoom Gallery View style
const videoCallStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(17.5rem, 1fr))',
  gap: '0px',
  width: '100%',
  minHeight: '100%',
  height: 'auto',
  backgroundColor: '#000', // Match solo background to avoid initial flash
  padding: '0px',
  overflow: 'hidden',
  alignContent: 'stretch',
  justifyContent: 'stretch'
};

const CONTROL_BAR_STYLES = {
  right: {
    wrapper: 'flex-row',
    videoContainer: 'h-full',
    barSection: 'pr-5 h-full self-center',
    pill: 'flex-col',
    divider: 'h-px w-8 my-1'
  },
  bottom: {
    wrapper: 'flex-col',
    videoContainer: 'w-full',
    barSection: 'pb-4 px-6 w-full',
    pill: 'flex-row',
    divider: 'w-px h-8 mx-1'
  }
};
const SidebarPortal = ({
  showChat,
  showSettings,
  rootRef,
  client,
  records,
  setShowChat,
  setShowSettings,
  inCall,
  sidebarPosition = 'inside'
}: {
  showChat: boolean;
  showSettings: boolean;
  rootRef: React.RefObject<HTMLDivElement | null>;
  client: any;
  records: ChatRecord[];
  setShowChat: (val: boolean) => void;
  setShowSettings: (val: boolean) => void;
  inCall: boolean;
  sidebarPosition?: 'inside' | 'outside';
}) => {
  const [containerRect, setContainerRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    let rafId: number;
    const updateRect = () => {
      if (rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();

        setContainerRect((prev) => {
          if (
            prev &&
            prev.top === rect.top &&
            prev.left === rect.left &&
            prev.width === rect.width &&
            prev.height === rect.height
          ) {
            return prev;
          }
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          };
        });
      }

      if (showChat || showSettings) {
        rafId = requestAnimationFrame(updateRect);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);

    if (showChat || showSettings) {
      rafId = requestAnimationFrame(updateRect);
    }

    return () => {
      window.removeEventListener('resize', updateRect);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [showChat, showSettings, inCall, rootRef]);

  if (!(showChat || showSettings)) return null;
  const isPortalEnabled = sidebarPosition === 'outside';
  if (isPortalEnabled && !containerRect) return null;

  const content = (
    <div
      style={{
        position: isPortalEnabled ? 'fixed' : 'absolute',
        top: isPortalEnabled ? containerRect!.top : 0,
        left: isPortalEnabled ? containerRect!.left : 0,
        height: isPortalEnabled ? containerRect!.height : '100%',
        width: isPortalEnabled ? containerRect!.width : '100%',
        pointerEvents: 'none',
        opacity: (isPortalEnabled && sidebarPosition === 'outside' && containerRect!.left > window.innerWidth - 100) ? 0 : 1,
        transition: 'opacity 0.2s ease-in-out',
        visibility: (isPortalEnabled && sidebarPosition === 'outside' && containerRect!.left > window.innerWidth - 5) ? 'hidden' : 'visible',
        zIndex: 200
      }}
    >
      <div
        className={cn(
          "absolute top-0 flex flex-col pointer-events-auto overflow-hidden",
          "w-85 border-r border-white/10 shadow-2xl transition-all duration-300",
          "animate-in slide-in-from-left duration-300",
          "h-full",
          // Position relative to video container - match parent rounding when inside
          sidebarPosition === 'outside'
            ? "left-[-21.25rem] bg-[#1a1b1e]"
            : "left-0 bg-[#1a1b1e]/90 backdrop-blur-xl"
        )}
      >
        <div className="flex-1 overflow-hidden">
          {showChat ? (
            <Chat client={client as any} records={records} onClose={() => setShowChat(false)} />
          ) : (
            <SettingsPanel
              client={client}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (!isPortalEnabled) return content;

  return createPortal(
    content,
    document.body
  );
};

type VideoCallProps = {
  jwt: string;
  session: string;
  /** Backend communication_session id for guest invite leave/deactivate. */
  sessionId?: string;
  userName: string;
  setTranscriptionSubtitle: setTranscriptionType;
  records: ChatRecord[];
  setRecords: (records: ChatRecord[] | ((prev: ChatRecord[]) => ChatRecord[])) => void;
  client: MutableRefObject<ReturnType<typeof import("@zoom/videosdk").default.createClient>>;
  inCall: boolean;
  setInCall: (inCall: boolean | ((prev: boolean) => boolean)) => void;
  onCallStartedAtChange?: (startedAt: Date) => void;
  isInteracting?: boolean;
  controlBarPosition?: 'bottom' | 'right';
  sidebarPosition?: 'inside' | 'outside';
  onExit?: () => void;
  onParticipantCountChange?: (count: number) => void;
  /** Show UserPlus secure guest invite. */
  showSecureGuestInvite?: boolean;
  /** Show Link2 legacy guest-call copy. */
  showLegacyGuestCallLink?: boolean;
  /** Show popup / return-to-inline buttons. */
  showModeSwitch?: boolean;
  /** Toggle GlobalZoomPlayer PiP via telecomConferenceStore. */
  showPipControl?: boolean;
};

const VideoCall = (props: VideoCallProps) => {
  const {
    jwt,
    session,
    sessionId,
    client,
    inCall,
    setInCall,
    userName,
    records,
    isInteracting,
    controlBarPosition = 'bottom',
    sidebarPosition = 'inside',
    onExit,
    setTranscriptionSubtitle,
    showSecureGuestInvite = true,
    showLegacyGuestCallLink = false,
    showModeSwitch = true,
    showPipControl = true,
  } = props;

  const isPipMode = useStore($telecomConferencePipEnabled);
  const initialUserInfo = client.current ? (client.current.getCurrentUserInfo() as Participant | null) : null;
  const [isVideoMuted, setIsVideoMuted] = useState(!initialUserInfo?.bVideoOn);
  const [isAudioMuted, setIsAudioMuted] = useState(initialUserInfo?.muted ?? true);
  const [currentBackground, setCurrentBackground] = useState<string>('');

  const [previewDeviceIds, setPreviewDeviceIds] = useState<{
    cameraId: string;
    micId: string;
    speakerId: string;
  }>({
    cameraId: '',
    micId: '',
    speakerId: '',
  });

  const onPreviewDeviceIdsChange = useCallback((next: Partial<typeof previewDeviceIds>) => {
    setPreviewDeviceIds((prev) => ({ ...prev, ...next }));
  }, []);

  // Recording & Timer States
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.Stopped);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Format time HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v, i) => v !== "00" || i > 0) // Keep minutes and seconds even if 00
      .join(":");
  };

  useEffect(() => {
    if (recordingStatus === RecordingStatus.Recording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingStatus]);
  const [isJoining, setIsJoining] = useState(false);
  const [hasAudio, setHasAudio] = useState(false); // Start as false to wait for Preview
  const [hasVideo, setHasVideo] = useState(false); // Start as false to wait for Preview
  const [permissionDenied, setPermissionDenied] = useState(false);
  // REMOVED: previewKey - was causing unnecessary Preview remount
  const [participantCount, setParticipantCount] = useState(1);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const callContainerRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const setRecords = props.setRecords;
  const processedSignatures = useRef<Map<string, number>>(new Map());

  const onChatMessage = useCallback((payload: ChatMessage) => {
    // Robust Deduplication: Key by Sender + Content (Ignore timestamp in key)
    const distinctKey = `${payload.sender.userId}-${payload.message}`;
    const currentTimestamp = payload.timestamp;

    // Check local cache first (Synchronous, prevents race conditions)
    const lastTimestamp = processedSignatures.current.get(distinctKey);
    if (lastTimestamp) {
      const timeDiff = Math.abs(currentTimestamp - lastTimestamp);
      // If same message from same person within 2 seconds, treat as duplicate/echo
      if (timeDiff < 2000) {
        return;
      }
    }

    // Update Cache
    processedSignatures.current.set(distinctKey, currentTimestamp);

    // Cleanup Cache (keep size manageable)
    if (processedSignatures.current.size > 100) {
      const firstKey = processedSignatures.current.keys().next().value;
      if (firstKey !== undefined) processedSignatures.current.delete(firstKey);
    }

    setRecords((previous: ChatRecord[]) => {
      // Fallback: State-based check for older duplicates not in cache
      const isDuplicate = previous.some(r => {
        if (payload.id && r.id) return r.id === payload.id;
        const timeDiff = Math.abs(r.timestamp - payload.timestamp);
        return r.message === payload.message &&
          timeDiff < 2000 &&
          r.sender?.userId === payload.sender?.userId;
      });

      if (isDuplicate) return previous;

      return [...previous, payload];
    });
  }, [setRecords]);

  // Auto-activate Live Transcription when call starts
  useEffect(() => {
    let activeHandler: ((payload: any) => void) | null = null;

    if (inCall && client.current) {
      const startTranscription = async () => {
        try {
          const transcriptionClient = client.current.getLiveTranscriptionClient();
          if (!transcriptionClient) return;

          activeHandler = (payload: any) => {
            setTranscriptionSubtitle((prev) => ({
              ...prev,
              [payload.msgId]: {
                name: payload.displayName,
                text: payload.text,
                isSelf: payload.userId === client.current.getCurrentUserInfo().userId,
              },
            }));
          };

          client.current.on('caption-message', activeHandler);
          await transcriptionClient.startLiveTranscription();
          console.log("[Zoom] ✅ Live Transcription activated successfully");
        } catch (e) {
          console.error("[Zoom] ❌ Failed to auto-start transcription", e);
        }
      };

      void startTranscription();
    }

    return () => {
      if (activeHandler && client.current) {
        client.current.off('caption-message', activeHandler);
      }
    };
  }, [inCall, setTranscriptionSubtitle]); 

  // Auto-activate Cloud Recording when call starts
  useEffect(() => {
    if (inCall && client.current) {
      const startRecording = async () => {
        try {
          const recordingClient = client.current.getRecordingClient();
          if (!recordingClient) return;
          
          if (recordingClient.getCloudRecordingStatus() !== RecordingStatus.Recording) {
            await recordingClient.startCloudRecording();
            console.log("[Zoom] ✅ Cloud Recording auto-started successfully");
            setRecordingStatus(RecordingStatus.Recording);
          }
        } catch (e) {
          console.error("[Zoom] ❌ Failed to auto-start recording", e);
        }
      };

      // Delay slightly to ensure session is fully established before sending recording command
      const timer = setTimeout(() => {
        void startRecording();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [inCall, client]);

  // DYNAMIC STYLE UPDATE: Applies Solo vs Group appearance
  const updateLayoutStyles = useCallback((count: number) => {
    const videoContainer = callContainerRef.current;
    if (!videoContainer) return;

    const isSolo = count <= 1;

    // 1. Update Main Container Grid
    videoContainer.style.setProperty('display', 'grid', 'important');
    videoContainer.style.setProperty('gap', isSolo ? '0px' : '1.25rem', 'important');
    videoContainer.style.setProperty('padding', isSolo ? '0px' : '1.25rem', 'important');
    videoContainer.style.setProperty('background-color', isSolo ? '#000' : '#080808', 'important');
    videoContainer.style.setProperty('place-content', 'center', 'important');
    videoContainer.style.setProperty('place-items', 'center', 'important');
    videoContainer.style.setProperty('width', '100%', 'important');
    videoContainer.style.setProperty('height', '100%', 'important');
    videoContainer.style.setProperty('overflow', 'hidden', 'important');
    videoContainer.style.setProperty('margin', '0 auto', 'important');

    if (isSolo) {
      videoContainer.style.setProperty('grid-template-columns', '1fr', 'important');
      videoContainer.style.setProperty('grid-template-rows', '1fr', 'important');
      videoContainer.style.setProperty('max-width', '100%', 'important');
      videoContainer.style.setProperty('margin', '0', 'important');
    } else if (count === 2) {
      // VERTICAL STACK FOR 2 PARTICIPANTS
      videoContainer.style.setProperty('grid-template-columns', '1fr', 'important');
      videoContainer.style.setProperty('grid-template-rows', '1fr 1fr', 'important');
      videoContainer.style.setProperty('grid-auto-rows', 'minmax(0, 1fr)', 'important');
      videoContainer.style.setProperty('max-width', '62.5rem', 'important'); // Limit width to keep focus
      videoContainer.style.setProperty('margin', '0 auto', 'important');
      videoContainer.style.setProperty('gap', '0.75rem', 'important');
    } else {
      // INTELLIGENT GRID SCALING (3+)
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);

      videoContainer.style.setProperty('grid-template-columns', `repeat(${cols}, minmax(0, 1fr))`, 'important');
      videoContainer.style.setProperty('grid-template-rows', `repeat(${rows}, auto)`, 'important');
      videoContainer.style.setProperty('grid-auto-rows', 'auto', 'important');

      // Limit max width but allow full flexibility
      videoContainer.style.setProperty('max-width', '100rem', 'important');
      videoContainer.style.setProperty('margin', '0 auto', 'important');
    }

    // 2. Update All User Frames
    const userContainers = videoContainer.querySelectorAll('[data-user-id]');
    userContainers.forEach(container => {
      const el = container as HTMLElement;

      // Remove ALL possible layout classes to start fresh
      el.className = 'relative overflow-hidden transition-all duration-300 flex items-center justify-center';

      if (isSolo) {
        el.classList.add('w-full', 'h-full', 'rounded-none', 'border-0', 'bg-black');
        el.style.setProperty('width', '100%', 'important');
        el.style.setProperty('height', '100%', 'important');
        el.style.setProperty('aspect-ratio', 'auto', 'important');
      } else {
        // Card mode for Group Call - must fit within grid cell
        el.classList.add('rounded-xl', 'border-2', 'border-white/20', 'shadow-2xl', 'bg-[#0a0a0b]');

        // Allow cards to shrink to fit cells while maintaining center
        el.style.setProperty('aspect-ratio', '16/9', 'important');
        if (count === 2) {
          // For 2 participants vertical stack, balance width by height
          el.style.setProperty('height', '100%', 'important');
          el.style.setProperty('width', 'auto', 'important');
          el.style.setProperty('max-width', '100%', 'important');
          el.style.setProperty('max-height', '100%', 'important');
        } else {
          el.style.setProperty('width', '100%', 'important');
          el.style.setProperty('height', 'auto', 'important');
          el.style.setProperty('max-width', '100%', 'important');
          el.style.setProperty('max-height', '100%', 'important');
        }
      }

      // Update Label Position
      const labelRootDiv = container.querySelector('.participant-label-root');
      if (labelRootDiv) {
        if (isSolo) {
          // Top left in solo mode (like Preview)
          labelRootDiv.className = 'participant-label-root absolute top-3 left-3 right-3 z-40 transition-all duration-300';
        } else {
          // Bottom left in group mode
          labelRootDiv.className = 'participant-label-root absolute bottom-3 left-3 z-40 right-3 transition-all duration-300';
        }
      }
    });
  }, []);

  const renderVideo = useCallback(async (event: { action: "Start" | "Stop"; userId: number }) => {
    const mediaStream = client.current.getMediaStream();
    console.log('[Zoom] mediaStream', mediaStream);

    const videoContainer = callContainerRef.current;
    if (!videoContainer) return;

    const users = client.current.getAllUser();
    const user = users.find((u: Participant) => u.userId === event.userId);
    if (!user) return;

    const userContainer = videoContainer.querySelector(`[data-user-id="${event.userId}"]`) as ParticipantContainer;
    if (!userContainer) return;

    const placeholder = userContainer.querySelector('.placeholder-avatar') as HTMLElement;
    const isVideoOn = event.action === "Start" && user.bVideoOn;
    const currentUser = client.current.getCurrentUserInfo();

    // 1. Show Avatar if stopping video
    if (placeholder && !isVideoOn) {
      placeholder.style.opacity = '1';
    }

    // 2. Re-render Label with current state (handles camera-off icon without gaps)
    if (userContainer._labelRoot) {
      userContainer._labelRoot.render(
        <ParticipantLabel
          displayName={user.displayName}
          isVideoOn={isVideoOn}
          isMe={user.userId === currentUser?.userId}
        />
      );
    }

    if (!isVideoOn) {
      try {
        const element = await mediaStream.detachVideo(event.userId);
        if (element) {
          if (Array.isArray(element)) {
            element.forEach((el) => el.remove());
          } else if (element && typeof element.remove === 'function') {
            element.remove();
          }
        }
        // Fallback cleanup
        const residuals = userContainer.querySelectorAll('video, canvas, video-player');
        residuals.forEach(el => el.remove());
      } catch (e) {
        console.error("detachVideo failed", e);
      }
    } else if (event.action === "Start" && user.bVideoOn) {
      try {
        // Clean existing before attaching
        const existing = userContainer.querySelectorAll('video-player, canvas, video');
        existing.forEach(el => el.remove());

        const userVideo = await mediaStream.attachVideo(event.userId, VideoQuality.Video_720P);
        if (userVideo) {
          (userVideo as HTMLElement).style.width = '100%';
          (userVideo as HTMLElement).style.height = '100%';
          (userVideo as HTMLElement).style.objectFit = 'cover';
          userContainer.insertBefore(userVideo as VideoPlayer, userContainer.firstChild);

          // Hide avatar only AFTER successful attach to prevent black screen transition
          if (placeholder) {
            placeholder.style.opacity = '0';
          }
        }
      } catch (e) {
        console.error("attachVideo failed", e);
      }
    }
  }, [client]);

  // Ensure all participants have a container and remove ghosts
  const syncDOMWithParticipants = useCallback(() => {
    const videoContainer = callContainerRef.current;
    if (!videoContainer) return;

    let currentUsers = client.current.getAllUser();
    const currentUser = client.current.getCurrentUserInfo();
    
    // LỌC VÀ TIÊU DIỆT BÓNG MA (GHOST PARTICIPANTS)
    if (currentUser) {
      currentUsers = currentUsers.filter((user: Participant) => {
        if (user.userId === currentUser.userId) return true; // Giữ lại bản thân hiện tại
        
        if (user.displayName === currentUser.displayName) {
           // Cố gắng đá cái xác cũ ra khỏi Zoom Server (Nếu user có quyền Host/Manager)
           if (client.current.isHost() || client.current.isManager()) {
              console.log(`[Zoom] Kicking ghost participant ${user.userId} from server...`);
              client.current.removeUser(user.userId).catch((e: any) => console.warn('[Zoom] Failed to kick ghost', e));
           }
           return false; // Ẩn khỏi UI
        }
        return true;
      });
    }

    const currentUserIds = new Set(currentUsers.map((u: Participant) => u.userId));
    setParticipantCount(currentUsers.length);

    // 1. Remove ghost elements (users who left)
    const videoElements = videoContainer.querySelectorAll('[data-user-id]');
    videoElements.forEach(el => {
      const container = el as ParticipantContainer;
      const userIdStr = container.getAttribute('data-user-id');
      if (userIdStr) {
        const userId = parseInt(userIdStr, 10);
        if (!currentUserIds.has(userId)) {
          // CRITICAL: Cleanup React roots before removal
          try {
            if (container._avatarRoot) container._avatarRoot.unmount();
            if (container._labelRoot) container._labelRoot.unmount();
          } catch (e) {
            console.warn("Unmount failed for ghost element", e);
          }
          container.remove();
        }
      }
    });

    // 2. Ensure every participant has a container (Create if not exists)
    currentUsers.forEach((user: Participant) => {
      let userContainer = videoContainer.querySelector(`[data-user-id="${user.userId}"]`) as ParticipantContainer;
      if (!userContainer) {
        userContainer = document.createElement('div') as ParticipantContainer;
        userContainer.setAttribute('data-user-id', user.userId.toString());
        userContainer.className = 'relative w-full h-full overflow-hidden bg-black transition-all duration-300';

        // 2a. Avatar Root
        const avatarRootDiv = document.createElement('div');
        avatarRootDiv.className = 'absolute inset-0 z-0 placeholder-avatar transition-opacity duration-500';
        avatarRootDiv.style.opacity = '1'; // Show avatar initially until video is attached
        userContainer.appendChild(avatarRootDiv);
        userContainer._avatarRoot = createRoot(avatarRootDiv);
        userContainer._avatarRoot.render(<AvatarPlaceholder displayName={user.displayName} />);

        // 2b. Label Root
        const labelRootDiv = document.createElement('div');
        // Thêm class participant-label-root để dễ query ở trên
        labelRootDiv.className = 'participant-label-root';
        userContainer.appendChild(labelRootDiv);
        userContainer._labelRoot = createRoot(labelRootDiv);

        const currentUser = client.current.getCurrentUserInfo();
        userContainer._labelRoot.render(
          <ParticipantLabel
            displayName={user.displayName}
            isVideoOn={user.bVideoOn}
            isMe={user.userId === currentUser?.userId}
          />
        );

        videoContainer.appendChild(userContainer);
      }

      // Toggle visibility based on isInteracting
      const placeholder = userContainer.querySelector('.placeholder-avatar') as HTMLElement;
      const videoElement = userContainer.querySelector('video-player, canvas, video') as HTMLElement;

      // Use a more aggressive approach: CSS classes or direct style with !important
      if (isInteracting) {
        if (placeholder) {
          placeholder.style.setProperty('opacity', '1', 'important');
          placeholder.style.setProperty('visibility', 'visible', 'important');
          placeholder.style.setProperty('z-index', '10', 'important');
        }
        if (videoElement) {
          videoElement.style.setProperty('opacity', '0', 'important');
          videoElement.style.setProperty('visibility', 'hidden', 'important');
        }
      } else {
        // Restore actual state if not interacting
        const isVideoOn = user.bVideoOn;
        if (placeholder) {
          placeholder.style.setProperty('opacity', isVideoOn ? '0' : '1', 'important');
          placeholder.style.setProperty('visibility', isVideoOn ? 'hidden' : 'visible', 'important');
          placeholder.style.setProperty('z-index', '0', 'important');
        }
        if (videoElement) {
          videoElement.style.setProperty('opacity', isVideoOn ? '1' : '0', 'important');
          videoElement.style.setProperty('visibility', isVideoOn ? 'visible' : 'hidden', 'important');
        }
      }
    });

    // Force immediate layout refresh after sync
    updateLayoutStyles(currentUserIds.size);
    props.onParticipantCountChange?.(currentUserIds.size);
  }, [client, updateLayoutStyles, isInteracting, props]);

  useEffect(() => {
    // Immediate sync when interacting status changes
    syncDOMWithParticipants();
  }, [isInteracting, syncDOMWithParticipants]);

  // useEffect(() => {
  //   updateLayoutStyles(participantCount);
  // }, [participantCount, updateLayoutStyles])



  useEffect(() => {
    const c = client.current;
    if (inCall) {
      // 1. CRITICAL: Immediate sync to avoid black container flash on mount
      syncDOMWithParticipants();

      const onVideoStateChange = (payload: { action: "Start" | "Stop"; userId: number }) => {
        void renderVideo(payload);
      };

      const onVideoActiveChange = (payload: any) => {
        if (payload && typeof payload === 'object') {
          const userId = payload.userId || payload.user_id;
          const state = payload.state || payload.action;
          if (userId !== undefined) {
            const action = (state === 'Active' || state === 'Start' || payload.state === true) ? 'Start' : 'Stop';
            void renderVideo({ action, userId });
          }
        }
      };

      const onChatMessageListener = (payload: ChatMessage) => onChatMessage(payload);
      const onUserJoin = () => syncDOMWithParticipants();
      const onUserLeave = () => syncDOMWithParticipants();

      c.on("peer-video-state-change", onVideoStateChange);
      c.on("video-active-change", onVideoActiveChange);
      c.on("chat-on-message", onChatMessageListener);
      c.on("user-added", onUserJoin);
      c.on("user-removed", onUserLeave);

      const syncInterval = setInterval(syncDOMWithParticipants, 3000);

      return () => {
        c.off("peer-video-state-change", onVideoStateChange);
        c.off("video-active-change", onVideoActiveChange);
        c.off("chat-on-message", onChatMessageListener);
        c.off("user-added", onUserJoin);
        c.off("user-removed", onUserLeave);
        clearInterval(syncInterval);
        // REMOVED: currentContainer.innerHTML = '';
        // Clearing here was causing flicker on every effect re-run (e.g. switch mode)
      };
    }
  }, [inCall, renderVideo, onChatMessage, client, syncDOMWithParticipants]);

  useEffect(() => {
    if (!inCall) setIsJoining(false);
    // const currentClient = client.current;
    return () => {
      // DISABLED: Parent (ZoomVideoCall) handles cleanup in handleExit
      // Calling stopVideo/stopAudio here causes race condition and camera lock
      // const media = currentClient?.getMediaStream();
      // if (media) {
      //     void media.stopVideo().catch(() => {});
      //     void media.stopAudio().catch(() => {});
      // }
    };
  }, [inCall, client]);

  useEffect(() => {
    props.onParticipantCountChange?.(participantCount);
  }, [participantCount, props.onParticipantCountChange]);

  const isInitialized = useRef(false);

  const init = useCallback(async () => {
    // If we're using a singleton, it might already be initialized.
    // Check internal ref first (for this component instance), then try-catch the SDK call.
    if (isInitialized.current) return;

    try {
      await client.current.init("en-US", "Global", { patchJsMedia: true });
    } catch (error: any) {
      // If client is already initialized (singleton reuse), strictly ignore that specific error
      if (error?.reason === 'already initialized' || error?.type === 'INVALID_OPERATION') {
        console.log("[ZoomSDK] Client already initialized (Singleton reuse). Safe to proceed.");
      } else {
        console.error("[ZoomSDK] Init failed", error);
      }
    }
    isInitialized.current = true;
  }, [client]);

  const startCall = async () => {
    setIsJoining(true);
    try {
      const name = userName ?? "Guest";

      // CRITICAL FIX: Smart Join
      // We know we didn't leave the session (to keep camera alive).
      // So we check strict state before joining.
      const sessionInfo = client.current.getSessionInfo();
      const isAlreadyInMeeting = sessionInfo && sessionInfo.isInMeeting;
      const isSameSession = isAlreadyInMeeting && sessionInfo.topic === session;

      if (!isSameSession) {
        if (isAlreadyInMeeting) {
          console.log("[VideoCall] In different meeting. Leaving before join...");
          await client.current.leave().catch(() => {});
        }
        console.log("[VideoCall] Joining session:", session);
        try {
          await client.current.join(session, jwt, name);
        } catch (e: any) {
          if (e?.errorCode === 5012 || e?.reason === 'duplicated operation') {
            console.log("[VideoCall] Join failed with 5012 (Already joining/joined). Proceeding.");
          } else {
            throw e;
          }
        }
      } else {
        console.log("[VideoCall] Already in the correct meeting. Skipping join.");
        await new Promise(r => setTimeout(r, 800));
      }

      props.onCallStartedAtChange?.(new Date());

      const currentUser = client.current.getCurrentUserInfo();
      const mediaStream = client.current.getMediaStream();

      setInCall(true);

      if (currentUser) {
        setTimeout(() => renderVideo({ action: "Stop", userId: currentUser.userId }), 0); // Setup container
      }

      if (mediaStream) {
        try {
          if (previewDeviceIds.speakerId) {
            await mediaStream.switchSpeaker(previewDeviceIds.speakerId);
          }
          if (previewDeviceIds.micId) {
            await mediaStream.switchMicrophone(previewDeviceIds.micId);
          }
          if (previewDeviceIds.cameraId) {
            await mediaStream.switchCamera(previewDeviceIds.cameraId);
          }
        } catch (e) {
          void e;
        }

        await mediaStream.startAudio();
        if (isAudioMuted) {
          await mediaStream.muteAudio().catch(() => { });
        } else {
          await mediaStream.unmuteAudio().catch(() => { });
        }

        // Sync mute state
        const updatedUser = client.current.getCurrentUserInfo();
        if (updatedUser) setIsAudioMuted(updatedUser.muted ?? true);

        if (!isVideoMuted) {
          // Wait for Preview tracks to release
          await new Promise(r => setTimeout(r, 500));

          await mediaStream.startVideo({ virtualBackground: { imageUrl: currentBackground } }).catch((e: any) => console.warn(e));

          // Simple retry once - REMOVED to prevent blinking
          // content observed: "Video appears then blinks" -> caused by this re-render
          // setTimeout(async () => {
          //      const u = client.current.getCurrentUserInfo();
          //      if (u?.bVideoOn) await renderVideo({ action: "Start", userId: u.userId });
          // }, 1000);
        }
      }

      // Render others
      const users = client.current.getAllUser();
      for (const user of users) {
        await renderVideo({ action: user.bVideoOn ? "Start" : "Stop", userId: user.userId });
      }

    } catch (e: any) {
      console.error("startCall failed", e);
    } finally {
      setIsJoining(false);
      syncDOMWithParticipants();
    }
  };

  const leaveCall = async () => {
    try {
      console.log('[VideoCall] Hard Leave: Ending physical session.');

      const mediaStream = client.current.getMediaStream();
      if (mediaStream) {
        if (isVideoMuted === false) {
          await mediaStream.stopVideo().catch((e: any) => console.warn('stopVideo failed', e));
        }
        await mediaStream.stopAudio().catch((e: any) => console.warn('stopAudio failed', e));
      }

        await client.current.leave();
      console.log('[VideoCall] Hard Leave complete.');

    } catch (e) {
      console.error("Leave error", e);
    }
    const videoContainer = callContainerRef.current;
    if (videoContainer) {
      videoContainer.innerHTML = '';
      console.log('[VideoCall] Cleared call video container');
    }
    setInCall(false);
  };

  const handleExitCall = useCallback(async () => {
    if (onExit) {
      await onExit();
    } else {
      await leaveCall();
    }
  }, [onExit]);

  /** Stub — wire real invite API here later. */
  const createGuestInviteUrl = useCallback(async (_sessionId: string): Promise<string> => {
    window.alert('Guest invite is not implemented yet');
    return '';
  }, []);

  /** Stub — open call in popup window. */
  const switchZoomToPopup = useCallback(() => {
    window.alert('Switch to popup is not implemented yet');
  }, []);

  /** Stub — return call to inline tab. */
  const switchZoomToInline = useCallback(() => {
    window.alert('Return to inline is not implemented yet');
  }, []);



  return (
    <div
      ref={rootRef}
      className={cn(
        'overflow-hidden flex w-full flex-col h-full bg-black',
        !inCall && 'bg-gray-50',
      )}
    >
      {!inCall ? (
        <div className="flex-1 w-full h-full mx-auto relative flex items-center justify-center">
          <Preview
            // No key - let Preview manage its own lifecycle
            init={init}
            setIsVideoMuted={setIsVideoMuted}
            setIsAudioMuted={setIsAudioMuted}
            currentBackground={currentBackground}
            setCurrentBackground={setCurrentBackground}
            setHasAudioDevice={setHasAudio}
            setHasVideoDevice={setHasVideo}
            setPermissionDenied={setPermissionDenied}
            displayName={userName}
            onDeviceIdsChange={onPreviewDeviceIdsChange}
            isInteracting={isInteracting}
          >
            <button
              disabled={isJoining || !hasAudio || permissionDenied}
              className={cn(
                'w-full py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2',
                isJoining || !hasAudio || permissionDenied
                  ? 'opacity-70 cursor-not-allowed grayscale'
                  : 'hover:scale-[1.02] active:scale-95',
              )}
              onClick={startCall}
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                permissionDenied ? (
                  "(Permission Denied)"
                ) : !hasAudio ? (
                  "(No audio device)"
                ) : !hasVideo ? (
                  "(No camera device)"
                ) : (
                  "Join Meeting"
                )
              )}
            </button>
          </Preview>

          {/* Simple Joining Overlay (matches Preview style) */}
          {!inCall && isJoining && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm z-50 text-white gap-3 transition-all">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <span className="text-sm font-bold tracking-wide uppercase">Joining Meeting...</span>
                </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'relative w-full h-full bg-[#0a0a0b] flex',
            CONTROL_BAR_STYLES[controlBarPosition].wrapper,
          )}
        >
          {/* Main Content Area (Video + Controls) */}
          <div
            className={cn(
              'relative flex-1 min-w-0 min-h-0 container-zoom-video',
              CONTROL_BAR_STYLES[controlBarPosition].videoContainer,
            )}
          >
            {/* VIDEO AREA */}
            <div className="relative w-full h-full min-h-0 min-w-0">
              {/* @ts-expect-error - zoom web component */}
              <video-player-container ref={callContainerRef} style={videoCallStyle} />

              {/* Recording Indicator & Timer Overlay */}
              {recordingStatus === RecordingStatus.Recording && (
                <div className="hidden p-2 px-3 rounded-2xl absolute top-3 left-3 z-50 flex items-center gap-3 bg-red-500/85 backdrop-blur-md text-white font-mono text-sm shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                    <span className="font-bold tracking-widest text-xs">REC</span>
                  </div>
                  <div className="w-px h-4 bg-white/30" />
                  <span className="text-sm leading-none font-medium">{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* CONTROL BAR SECTION */}
          <div
            className={cn(
              'flex items-center justify-center z-40 transition-all duration-300',
              participantCount <= 1
                ? (
                  controlBarPosition === 'right'
                    ? 'absolute right-0 top-0 h-full pr-5'
                    : 'absolute bottom-0 left-0 right-0 pb-4 px-6'
                )
                : (
                  'relative ' + CONTROL_BAR_STYLES[controlBarPosition].barSection
                ),
            )}
          >
            <div
              className={cn(
                'flex gap-3 p-3 bg-[#1a1b1e]/90 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)] transition-all hover:bg-[#1a1b1e]/95',
                CONTROL_BAR_STYLES[controlBarPosition].pill,
              )}
            >
              <CameraButton
                client={client}
                isVideoMuted={isVideoMuted}
                setIsVideoMuted={setIsVideoMuted}
                renderVideo={renderVideo}
                currentBackground={currentBackground}
              />

              <MicButton client={client} isAudioMuted={isAudioMuted} setIsAudioMuted={setIsAudioMuted} />

              <div
                className={cn(
                  'bg-white/10 self-center',
                  CONTROL_BAR_STYLES[controlBarPosition].divider,
                )}
              />

              <button
                onClick={() => {
                  setShowChat(!showChat);
                  if (!showChat) setShowSettings(false); // Close settings if opening chat
                }}
                title="Chat"
                className={cn(
                  'p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center',
                  showChat
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white',
                )}
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              <div className="hidden">
                <RecordingButton client={client} onStatusChange={(status) => setRecordingStatus(status)} />
              </div>

              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  if (!showSettings) setShowChat(false);
                }}
                title="Settings"
                className={cn(
                  'p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center',
                  showSettings
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white',
                )}
              >
                <SettingsIcon className="w-5 h-5" />
              </button>

              {/* Manual PiP: CSS-hidden while auto layout is primary; remove .telecom-pip-control rule to restore. */}
              {showPipControl && inCall && (
                <button
                  type="button"
                  onClick={() => setTelecomConferencePipEnabled(!isPipMode)}
                  title={isPipMode ? 'Exit picture-in-picture' : 'Picture-in-picture'}
                  className={cn(
                    'telecom-pip-control p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center',
                    isPipMode
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <PictureInPicture2 className="w-5 h-5" />
                </button>
              )}

              {showModeSwitch && inCall && (
                <button
                  type="button"
                  onClick={switchZoomToPopup}
                  title="Open in popup window"
                  className="p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              )}

              {showModeSwitch && inCall && (
                <button
                  type="button"
                  onClick={switchZoomToInline}
                  title="Return to tab"
                  className="p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  <Monitor className="w-5 h-5" />
                </button>
              )}

              {/* Secure guest invite */}
              {showSecureGuestInvite && (
              <button
                type="button"
                onClick={async () => {
                  if (!sessionId) {
                    window.alert('Waiting for session…');
                    return;
                  }
                  const url = await createGuestInviteUrl(sessionId);
                  if (!url) return;
                  try {
                    await navigator.clipboard.writeText(url);
                  } catch {
                    const el = document.createElement('input');
                    el.value = url;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                  }
                  window.alert('Invite copied:\n' + url);
                }}
                title="Copy secure guest invite"
                className="p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <UserPlus className="w-5 h-5" />
              </button>
              )}

              {/* Legacy guest-call link */}
              {showLegacyGuestCallLink && (
              <button
                onClick={() => {
                  if (!sessionId) return;
                  const base = window.location.origin;
                  const params = new URLSearchParams({
                    session,
                    sig: jwt,
                    display: session,
                    sessionId,
                  });
                  const url = base + '/guest-call?' + params.toString();
                  navigator.clipboard.writeText(url).then(() => {
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2500);
                  }).catch(() => {
                    const el = document.createElement('input');
                    el.value = url;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2500);
                  });
                }}
                disabled={!sessionId}
                title={sessionId ? 'Copy Guest Invite Link' : 'Waiting for session…'}
                className={cn(
                  'p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center',
                  inviteCopied
                    ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20'
                    : !sessionId
                      ? 'bg-white/5 border-white/10 text-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white',
                )}
              >
                {inviteCopied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Link2 className="w-5 h-5" />
                )}
              </button>
              )}

              <button
                  onClick={leaveCall}
                  title="Leave Session"
                  className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-300"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>

              <button
                onClick={handleExitCall}
                title="Exit Meeting"
                className={cn(
                  "flex items-center justify-center transition-all duration-300 shadow-xl shadow-red-500/30 text-center",
                  "bg-red-500 hover:bg-red-600 text-white rounded-xl active:scale-95",
                  controlBarPosition === 'right' ? "w-11 h-11" : "px-3 py-2"
                )}
              >
                <span className="text-xs font-bold leading-tight">
                  Exit Call
                </span>
              </button>
            </div>
          </div>

          <SidebarPortal
            showChat={showChat}
            showSettings={showSettings}
            rootRef={rootRef}
            client={client}
            records={records}
            setShowChat={setShowChat}
            setShowSettings={setShowSettings}
            inCall={inCall}
            sidebarPosition={sidebarPosition}
          />
        </div>
      )}
    </div>
  );
};

export default VideoCall;
