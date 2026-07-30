import { type MutableRefObject, useEffect, useState } from "react";
import ZoomVideo from "@zoom/videosdk";
import { X, Loader2 } from "lucide-react";
import { cn } from "../../utils";

type Device = {
  label: string;
  deviceId: string;
};

const SettingsPanel = (props: { 
    client: MutableRefObject<ReturnType<typeof ZoomVideo.createClient>>,
    onClose: () => void 
}) => {
  const [cameraList, setCameraList] = useState<Device[]>([]);
  const [micList, setMicList] = useState<Device[]>([]);
  const [speakerList, setSpeakerList] = useState<Device[]>([]);
  const [activeTab, setActiveTab] = useState<"cameras" | "mics" | "speakers">("cameras");
  
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [activeMicId, setActiveMicId] = useState<string>("");
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>("");

  const getDevices = async () => {
    const allDevices = await ZoomVideo.getDevices();

    const cameraDevices = allDevices.filter((el) => el.kind === "videoinput");
    const micDevices = allDevices.filter(
      (el) => el.kind === "audioinput" && el.deviceId !== "communications"
    );
    const speakerDevices = allDevices.filter(
      (el) => el.kind === "audiooutput" && el.deviceId !== "communications"
    );

    // Remove duplicate mics - keep the one WITH "Default - " prefix (Zoom uses this ID)
    const uniqueMicDevices = micDevices.filter((device, _index, arr) => {
      const deviceLabel = device.label.replace(/^Default - /, '');
      const hasDefaultVersion = arr.some(d => d.label.startsWith('Default - ') && d.label.replace(/^Default - /, '') === deviceLabel);
      
      // If there's a default version, keep the default one, otherwise keep this one
      if (hasDefaultVersion) {
        return device.label.startsWith('Default - ');
      }
      return true;
    });

    // Remove duplicate speakers - keep the one WITH "Default - " prefix (Zoom uses this ID)
    const uniqueSpeakerDevices = speakerDevices.filter((device, _index, arr) => {
      const deviceLabel = device.label.replace(/^Default - /, '');
      const hasDefaultVersion = arr.some(d => d.label.startsWith('Default - ') && d.label.replace(/^Default - /, '') === deviceLabel);
      
      // If there's a default version, keep the default one, otherwise keep this one
      if (hasDefaultVersion) {
        return device.label.startsWith('Default - ');
      }
      return true;
    });

    return {
      cameras: cameraDevices.map((el) => ({ label: el.label, deviceId: el.deviceId })),
      mics: uniqueMicDevices.map((el) => ({ label: el.label, deviceId: el.deviceId })),
      speakers: uniqueSpeakerDevices.map((el) => ({ label: el.label, deviceId: el.deviceId })),
    };
  };

  useEffect(() => {
    void getDevices().then((devices) => {
        setCameraList(devices.cameras);
        setMicList(devices.mics);
        setSpeakerList(devices.speakers);
        
        // Function to get active devices with retry
        const getActiveDevices = (retryCount = 0) => {
          const mediaStream = props.client.current.getMediaStream();
          let cameraId = "";
          let micId = "";
          let speakerId = "";
          
          if (mediaStream) {
            cameraId = mediaStream.getActiveCamera() || "";
            micId = mediaStream.getActiveMicrophone() || "";
            speakerId = mediaStream.getActiveSpeaker() || "";
            
            // Fallback to first available device if no active device found
            if (!cameraId && devices.cameras.length > 0) {
              cameraId = devices.cameras[0].deviceId;
            }
            if (!micId && devices.mics.length > 0) {
              micId = devices.mics[0].deviceId;
            }
            if (!speakerId && devices.speakers.length > 0) {
              speakerId = devices.speakers[0].deviceId;
            }
            
            setActiveCameraId(cameraId);
            setActiveMicId(micId);
            setActiveSpeakerId(speakerId);
          } else if (retryCount < 3) {
            // Retry if mediaStream not ready
            setTimeout(() => getActiveDevices(retryCount + 1), 500);
          } else {
            // Use first available devices as fallback
            const fallbackCameraId = devices.cameras.length > 0 ? devices.cameras[0].deviceId : "";
            const fallbackMicId = devices.mics.length > 0 ? devices.mics[0].deviceId : "";
            const fallbackSpeakerId = devices.speakers.length > 0 ? devices.speakers[0].deviceId : "";
            
            setActiveCameraId(fallbackCameraId);
            setActiveMicId(fallbackMicId);
            setActiveSpeakerId(fallbackSpeakerId);
          }
        };
        
        getActiveDevices();
    });
  }, [props.client]);

  const setCameraDevice = async (camera: Device) => {
    setActiveCameraId(camera.deviceId);
    const mediaStream = props.client.current.getMediaStream();
    if (mediaStream) {
      await mediaStream.switchCamera(camera.deviceId);
    }
  };

  const setMicDevice = async (mic: Device) => {
    setActiveMicId(mic.deviceId);
    const mediaStream = props.client.current.getMediaStream();
    if (mediaStream) {
      await mediaStream.switchMicrophone(mic.deviceId);
    }
  };

  const setSpeakerDevice = async (speaker: Device) => {
    setActiveSpeakerId(speaker.deviceId);
    const mediaStream = props.client.current.getMediaStream();
    if (mediaStream) {
      await mediaStream.switchSpeaker(speaker.deviceId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111] animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h3 className="text-white font-bold text-sm tracking-tight">Settings</h3>
        <button 
          onClick={props.onClose}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex p-1 bg-white/5 mx-4 mt-4 rounded-lg">
        {(["cameras", "mics", "speakers"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all capitalize',
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200',
            )}
          >
            {tab}
          </button>
        ))}
      </div>


      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {/* Device options - show when active devices are set */}
        {(activeCameraId || activeMicId || activeSpeakerId) && (
          <>
            {activeTab === "cameras" && cameraList.map((device) => {
              const isChecked = device.deviceId === activeCameraId;
              return (
              <label 
                key={device.deviceId} 
                className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer',
                  isChecked
                    ? 'bg-blue-500/10 border-blue-500/40 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'bg-white/3 border-white/5 text-gray-400 hover:bg-white/6 hover:border-white/10',
                )}
              >
                <input
                  type="radio"
                  name="camera"
                  checked={isChecked}
                  onChange={() => setCameraDevice(device)}
                  className="hidden"
                />
                <div className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                  isChecked
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 group-hover:border-gray-500',
                )}>
                    {isChecked && <div className="w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.8)]" />}
                </div>
                <span className={cn('text-xs font-medium truncate', isChecked ? 'text-blue-50' : 'text-gray-400')}>
                  {device.label}
                </span>
              </label>
            );
          })}

          {activeTab === "mics" && micList.map((device) => {
            const isChecked = device.deviceId === activeMicId;
            return (
            <label 
              key={device.deviceId} 
              className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer',
                  isChecked
                    ? 'bg-blue-500/10 border-blue-500/40 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'bg-white/3 border-white/5 text-gray-400 hover:bg-white/6 hover:border-white/10',
                )}
            >
              <input
                type="radio"
                name="mic"
                checked={isChecked}
                onChange={() => setMicDevice(device)}
                className="hidden"
              />
              <div className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                  isChecked
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 group-hover:border-gray-500',
                )}>
                  {isChecked && <div className="w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.8)]" />}
              </div>
              <span className={cn('text-xs font-medium truncate', isChecked ? 'text-blue-50' : 'text-gray-400')}>
                {device.label}
              </span>
            </label>
          );
          })}

          {activeTab === "speakers" && speakerList.map((device) => {
            const isChecked = device.deviceId === activeSpeakerId;
            return (
            <label 
              key={device.deviceId} 
              className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer',
                  isChecked
                    ? 'bg-blue-500/10 border-blue-500/40 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'bg-white/3 border-white/5 text-gray-400 hover:bg-white/6 hover:border-white/10',
                )}
            >
              <input
                type="radio"
                name="speaker"
                checked={isChecked}
                onChange={() => setSpeakerDevice(device)}
                className="hidden"
              />
              <div className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                  isChecked
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 group-hover:border-gray-500',
                )}>
                  {isChecked && <div className="w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.8)]" />}
              </div>
              <span className={cn('text-xs font-medium truncate', isChecked ? 'text-blue-50' : 'text-gray-400')}>
                {device.label}
              </span>
            </label>
          );
          })}
          </>
        )}
        
        {/* Loading state when no active devices */}
        {!(activeCameraId || activeMicId || activeSpeakerId) && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Loading devices...</p>
              <p className="text-xs opacity-70">Please wait while we detect your devices</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
