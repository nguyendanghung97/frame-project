import ZoomVideo, { type LocalAudioTrack, type LocalVideoTrack, type TestMicrophoneReturn, type TestSpeakerReturn, type VideoPlayer } from '@zoom/videosdk'
import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Volume2, StopCircle, Loader2 } from "lucide-react";
import AvatarPlaceholder from './AvatarPlaceholder';
import ParticipantLabel from './ParticipantLabel';
import { cn } from '../../utils';

interface MyLocalAudioTrack extends LocalAudioTrack {
  isAudioStarted: boolean;
  tester: { isRunning: boolean }
}

interface MyLocalVideoTrack extends LocalVideoTrack {
  isVideoStarted: boolean;
}

const Preview = ({ 
  init, 
  setIsVideoMuted, 
  setIsAudioMuted, 
  currentBackground, 
  setCurrentBackground, 
  setHasAudioDevice, 
  setHasVideoDevice,
  setPermissionDenied,
  displayName,
  onDeviceIdsChange,
  isInteracting = false,
  children 
}: {
  init: () => Promise<void>,
  setIsVideoMuted: Dispatch<SetStateAction<boolean>>,
  setIsAudioMuted: Dispatch<SetStateAction<boolean>>,
  currentBackground: string,
  setCurrentBackground: Dispatch<SetStateAction<string>>,
  setHasAudioDevice?: (has: boolean) => void,
  setHasVideoDevice?: (has: boolean) => void,
  setPermissionDenied?: (denied: boolean) => void,
  displayName: string,
  retryCount?: number,
  onDeviceIdsChange?: (next: { cameraId?: string; micId?: string; speakerId?: string }) => void,
  isInteracting?: boolean,
  children?: React.ReactNode
}) => {

  const isInitializing = useRef(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioInDevices, setAudioInDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutDevices, setAudioOutDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>('');
  const [currentMicrophone, setCurrentMicrophone] = useState<string>('');
  const [speakerPlaying, setSpeakerPlaying] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string>('');
  const audioTrackRef = useRef<MyLocalAudioTrack | null>(null);
  const videoTrackRef = useRef<MyLocalVideoTrack | null>(null);
  const [audioOnToggle, setAudioOnToggle] = useState(false);
  const [videoOnToggle, setVideoOnToggle] = useState(false);
  
  /* Removed unused animation states */
  const [testProgress, setTestProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraStarting, setIsCameraStarting] = useState(false); // New state for Avatar Loader
  
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLElement | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micTesterRef = useRef<TestMicrophoneReturn | null | undefined>(null);
  const speakerTesterRef = useRef<TestSpeakerReturn | null | undefined>(null);

  const getFilteredDevices = (devices: MediaDeviceInfo[]) => {
    // Remove duplicate devices - keep the one WITH "Default - " prefix (Zoom uses this ID)
    const uniqueDevices = devices.filter((device) => {
      const deviceLabel = device.label.replace(/^Default - /, '');
      const hasDefaultVersion = devices.some(d => d.label.startsWith('Default - ') && d.label.replace(/^Default - /, '') === deviceLabel);
      
      // If there's a default version, keep the default one, otherwise keep this one
      if (hasDefaultVersion) {
        return device.label.startsWith('Default - ');
      }
      return true;
    });
    
    return uniqueDevices.filter(device => 
        device.deviceId !== 'communications'
    );
  };
  
  const startCamera = useCallback(async (background?: string, cameraId?: string) => {
    setCameraError(null); // Reset on retry
    
    // START LOADING: Show spinner in Avatar
    setIsCameraStarting(true);
    
    try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        
        const devices = await ZoomVideo.getDevices();
        let cameraDevices = getFilteredDevices(devices.filter(d => d.kind === 'videoinput'));
        
        // Mobile fallback
        if (isMobile && cameraDevices.length === 0) {
             cameraDevices = [
                { label: 'Front Camera', deviceId: 'user', kind: 'videoinput' } as MediaDeviceInfo,
                { label: 'Back Camera', deviceId: 'environment', kind: 'videoinput' } as MediaDeviceInfo
            ];
        }
        
        setVideoDevices(cameraDevices);
        if (setHasVideoDevice) setHasVideoDevice(cameraDevices.length > 0);
        const deviceId = cameraId ?? (cameraDevices[0]?.deviceId);
        setCurrentCamera(deviceId ?? '');
        if (deviceId) onDeviceIdsChange?.({ cameraId: deviceId });

        // ALWAYS Force explicit nulling of ref to ensure fresh track creation
        // The previous track might be dead/stopped from the Zoom Session
        videoTrackRef.current = null;
        
        if (deviceId) {
            try {
                // SIMPLIFIED: Direct Zoom track creation (matches Prototype)
                const videoTrack = ZoomVideo.createLocalVideoTrack(deviceId) as MyLocalVideoTrack;
                videoTrackRef.current = videoTrack;
                
                const container = videoRef.current;
                if (container) { 
                    const startOptions = (background && background !== '') ? { imageUrl: background } : undefined;

                    await videoTrack.start(container as VideoPlayer, startOptions);
                    
                    // Mark as started for cleanup
                    videoTrack.isVideoStarted = true;
                    
                    setVideoOnToggle(true);
                    setIsVideoMuted(false);
                    setCurrentBackground(background ?? '');
                }

            } catch (e: any) {
                setCameraError(`${e.name}: ${e.message}`);
                setVideoOnToggle(false);
                setIsVideoMuted(true);
            }
        }
    } catch (error: any) {
        console.error("startCamera failed", error);
        setCameraError(error.message || "Unknown error starting camera");
        if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
            if (setPermissionDenied) setPermissionDenied(true);
        }
    } finally {
        // STOP LOADING: Hide spinner (either video is on, or error showed)
        setIsCameraStarting(false);
    }
  }, [onDeviceIdsChange, setCurrentBackground, setIsVideoMuted, setPermissionDenied, setHasVideoDevice]);

  const startSpeaker = useCallback(async (speakerId?: string) => {
    try {
        const devices = await ZoomVideo.getDevices();
        const speakerDevices = getFilteredDevices(devices.filter(d => d.kind === 'audiooutput'));
        setAudioOutDevices(speakerDevices);
        
        const deviceId = speakerId ?? speakerDevices[0]?.deviceId;
        if (deviceId) setCurrentSpeaker(deviceId);
        if (deviceId) onDeviceIdsChange?.({ speakerId: deviceId });
    } catch (error) {
        console.error("startSpeaker failed", error);
    }
  }, [onDeviceIdsChange]);

  const startMicrophone = useCallback(async (microphoneId?: string) => {
    try {
        const devices = await ZoomVideo.getDevices();
        const micDevices = getFilteredDevices(devices.filter(d => d.kind === 'audioinput'));
        setAudioInDevices(micDevices);
        
        const deviceId = microphoneId ?? micDevices[0]?.deviceId;
        setCurrentMicrophone(deviceId ?? '');
        if (deviceId) onDeviceIdsChange?.({ micId: deviceId });

        if (deviceId) {
            const audioTrack = ZoomVideo.createLocalAudioTrack(deviceId) as MyLocalAudioTrack;
            audioTrackRef.current = audioTrack;
            await audioTrack.start();
            audioTrack.isAudioStarted = true; // Set flag for cleanup
            // Start visualizer
            const bar = document.getElementById('mic-input-bar');
            const tester = audioTrack.testMicrophone({
                microphoneId: deviceId,
                onAnalyseFrequency: (v: number) => {
                    if (bar) bar.style.width = v + '%';
                },
            });
            micTesterRef.current = tester;
            
            setAudioOnToggle(true);
            setIsAudioMuted(false);
            if (setHasAudioDevice) setHasAudioDevice(true);

            // macOS Fix: Re-fetch Speakers after Microphone permission is granted
            await startSpeaker();
        } else {
             if (setHasAudioDevice) setHasAudioDevice(false);
        }
    } catch (error: any) {
        console.error("startMicrophone failed", error);
        if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
            if (setPermissionDenied) setPermissionDenied(true);
        }
    }
  }, [setIsAudioMuted, setHasAudioDevice, setPermissionDenied, startSpeaker, onDeviceIdsChange]);

  // Cn unmount
  useEffect(() => {
    return () => {
        if (micTesterRef.current) micTesterRef.current.stop();
        if (speakerTesterRef.current) speakerTesterRef.current.stop();
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        
        // Reverted: Explicit track cleanup needed to prevent 'Starting Device...' hang
        // We use void to make it fire-and-forget, allowing component to unmount
        const cleanup = async () => {
             // Stop Audio Track
             if (audioTrackRef.current?.isAudioStarted) {
                 await audioTrackRef.current.stop().catch(() => {}); 
             }
             // Stop Video Track (Fixed Reference: localVideoTrack -> videoTrackRef.current)
             if (videoTrackRef.current?.isVideoStarted) {
                 await videoTrackRef.current.stop().catch(() => {});
             }
        };
        void cleanup();
        
        isInitializing.current = false;
    }
  }, []);

  // Init sequence
  useEffect(() => {
    if (!isInitializing.current) {
        isInitializing.current = true;
        const startPreview = async () => {
             setIsLoading(true);
             try {
                 await init();
                 await startCamera();
                 await startMicrophone();
                 await startSpeaker();
             } catch (e) {
                 console.error("Preview init failed", e);
             } finally {
                 setIsLoading(false);
             }
        };
        void startPreview();
    }
  }, [init, startCamera, startMicrophone, startSpeaker]);

  const toggleCamera = async () => {
    // Prevent double clicking if already processing
    if (isCameraStarting) return;

    if (videoOnToggle) {
        // STOPPING: Manually handle loading state
        setIsCameraStarting(true);
        try {
            if (videoTrackRef.current?.isVideoStarted) await videoTrackRef.current.stop();
            setVideoOnToggle(false);
            setIsVideoMuted(true);
        } finally {
            setIsCameraStarting(false);
        }
    } else {
        // STARTING: startCamera handles isCameraStarting internally
        await startCamera(currentBackground, currentCamera);
    }
  };

  const toggleMicrophone = async () => {
    if (audioOnToggle) {
        if (micTesterRef.current) micTesterRef.current.stop(); 
        micTesterRef.current = null;
        if (audioTrackRef.current?.isAudioStarted) await audioTrackRef.current.stop();
        setAudioOnToggle(false);
        setIsAudioMuted(true);
    } else {
        await startMicrophone(currentMicrophone);
    }
  };

  const playSpeaker = async () => {
      if (speakerPlaying || !currentSpeaker) return;
      setSpeakerPlaying(true);
      
      let activeTrack = audioTrackRef.current;
      if (!activeTrack) activeTrack = ZoomVideo.createLocalAudioTrack() as MyLocalAudioTrack;
      
      const tester = activeTrack.testSpeaker({ speakerId: currentSpeaker });
      speakerTesterRef.current = tester;
      
      // Animation logic logic simplified
      const duration = 5000;
      const startTime = Date.now();
      
      progressTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setTestProgress(progress);
            if (elapsed >= duration) stopSpeaker();
      }, 50);
  };

  const stopSpeaker = () => {
      if (speakerTesterRef.current) speakerTesterRef.current.stop();
      speakerTesterRef.current = null;
      setSpeakerPlaying(false);
      setTestProgress(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  return (
    <div id="preview" className="relative w-full h-full bg-slate-950 overflow-hidden shadow-2xl ring-1 ring-gray-900/5 group">
        
      {/* Video Layer */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <div 
            className={cn(
                "absolute inset-0 z-10 transition-opacity duration-300", 
                (!videoOnToggle || isInteracting) ? "opacity-100 visible" : "opacity-0 invisible"
            )}
        >
            <AvatarPlaceholder displayName={displayName} />
        </div>
        
        {/* Name Label Overlay */}
        <div className="absolute top-3 left-3 right-3 z-40 transition-all duration-300">
            <ParticipantLabel 
                displayName={displayName} 
                isVideoOn={videoOnToggle} 
                isMe={true} 
            />
        </div>

        {/* Error Overlay */}
        {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 p-6 text-center">
                <div className="flex flex-col items-center gap-3 max-w-xs">
                    <div className="p-3 bg-red-500/20 rounded-full">
                        <VideoOff className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-red-400 font-bold text-sm">Camera Error</p>
                    <button 
                        onClick={() => startCamera(currentBackground, currentCamera)}
                        className="mt-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[0.625rem] font-bold uppercase tracking-wider rounded-lg transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )}

        <div 
            className={cn(
                'absolute inset-0 zoom-video-wrapper transition-opacity duration-300', 
                (isInteracting || cameraError || !videoOnToggle) ? 'opacity-0 invisible' : 'opacity-100 visible'
            )}
        >
          {/* @ts-expect-error - Zoom SDK custom web components */}
          <video-player-container className="block w-full h-full">
              {/* @ts-expect-error - Zoom SDK custom web components */}
              <video-player ref={videoRef} id="local-preview-video" />
          {/* @ts-expect-error - Zoom SDK custom web components */}
          </video-player-container>
        </div>
      </div>

       {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm z-30 text-white gap-3 transition-all">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <span className="text-sm font-bold tracking-wide uppercase">Starting Device...</span>
                </div>
            </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col items-center gap-6">
          
        <div className="flex flex-wrap items-start justify-center gap-5 px-4 py-2.5 rounded-2xl w-fit max-w-full mx-auto transition-all">
            
            {/* Mic */}
            <div className="flex items-center gap-2 bg-[#1a1b1e]/80 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                <button 
                    onClick={toggleMicrophone} 
                    className={cn(
                      'size-10 flex items-center justify-center rounded-full transition-all border shadow-sm shrink-0',
                      audioOnToggle ? 'bg-white text-black' : 'bg-red-500 text-white border-red-600',
                    )}
                >
                    {audioOnToggle ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                
                {audioInDevices.length > 0 && currentMicrophone && (
                    <div className="flex flex-col gap-1 w-[11.25rem]">
                        <select 
                            value={currentMicrophone} 
                            onChange={(e) => {
                                void startMicrophone(e.target.value);
                            }}
                            className="select-zoom-preview text-white text-xs rounded p-1 border border-gray-700 outline-none"
                        >
                            {audioInDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                        </select>
                        <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                            <div id="mic-input-bar" className="h-full bg-blue-500 transition-all duration-100" style={{ width: '0%' }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Camera */}
             <div className="flex items-center gap-2 bg-[#1a1b1e]/80 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                <button 
                    onClick={toggleCamera} 
                    disabled={isCameraStarting}
                    className={cn(
                      'size-10 flex items-center justify-center rounded-full transition-all border shadow-sm shrink-0',
                      isCameraStarting
                        ? 'opacity-70 cursor-not-allowed bg-gray-200 border-gray-300'
                        : videoOnToggle
                          ? 'bg-white text-black'
                          : 'bg-red-500 text-white border-red-600',
                    )}
                >
                    {isCameraStarting ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    ) : (
                        videoOnToggle ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />
                    )}
                </button>
                
                {videoDevices.length > 0 && currentCamera && (
                    <div className="flex flex-col gap-1 w-[11.25rem]">
                        <select 
                            value={currentCamera} 
                            onChange={(e) => {
                                void startCamera(undefined, e.target.value);
                            }}
                            className="select-zoom-preview text-white text-xs rounded p-1 border border-gray-700 outline-none"
                        >
                            {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Speaker */}
             <div className="flex items-center gap-2 bg-[#1a1b1e]/80 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                <div className="relative shrink-0">
                    <button 
                        onClick={speakerPlaying ? stopSpeaker : playSpeaker}
                        className={cn(
                          'size-10 flex items-center justify-center rounded-full transition-all border shadow-sm relative z-10',
                          speakerPlaying ? 'bg-white text-black' : 'bg-white text-black hover:bg-gray-200',
                        )}
                    >
                         {speakerPlaying ? <StopCircle className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    {speakerPlaying && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20 overflow-visible" viewBox="0 0 40 40">
                            <circle
                                cx="20"
                                cy="20"
                                r="22"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                className="text-blue-500/10"
                            />
                            <circle
                                cx="20"
                                cy="20"
                                r="22"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                strokeDasharray={138.2}
                                strokeDashoffset={138.2 - (138.2 * testProgress) / 100}
                                strokeLinecap="round"
                                className="text-blue-600 transition-all duration-75 ease-linear drop-shadow-[0_0_3px_rgba(37,99,235,0.6)]"
                            />
                        </svg>
                    )}
                </div>
                 {audioOutDevices.length > 0 && currentSpeaker && (
                    <div className="flex flex-col gap-1 w-[11.25rem]">
                        <select 
                            value={currentSpeaker} 
                            onChange={(e) => {
                                setCurrentSpeaker(e.target.value);
                                onDeviceIdsChange?.({ speakerId: e.target.value });
                                if (speakerPlaying) stopSpeaker();
                            }}
                            className="select-zoom-preview text-white text-xs rounded p-1 border border-gray-700 outline-none"
                        >
                            {audioOutDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                        </select>
                    </div>
                )}
            </div>

        </div>

        {/* Join Button container passed as children */}
        <div className="w-full max-w-sm z-30">
            {children}
        </div>

      </div>
    </div>
  );
}

export default Preview;
