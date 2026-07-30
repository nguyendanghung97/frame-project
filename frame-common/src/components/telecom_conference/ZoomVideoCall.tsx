import { useState, useRef, useEffect, useCallback } from 'react'
import ZoomVideo from '@zoom/videosdk'
import VideoCall from './VideoCall'
import Transcript, { type TranscriptEleType } from './Transcript'
import { type ChatRecord } from './Chat'
import { cn, formatCreatedDate } from '../../utils'

import { Loader2, ArrowLeft } from 'lucide-react'
import type { PrepareZoomSessionResult } from '../../types/telecomConference'

export interface ZoomVideoCallProps {
  sessionName: string
  sessionDisplay?: string
  userName: string
  onClose: () => void
  headerMode?: 'full' | 'minimal' | 'none'
  headerTitle?: string
  onCallStartedAtChange?: (startedAt: Date) => void
  isInteracting?: boolean
  sidebarPosition?: 'inside' | 'outside'
  onParticipantCountChange?: (count: number) => void
  onInCallChange?: (inCall: boolean) => void
  signature?: string
  sessionId?: string
  showSecureGuestInvite?: boolean
  showLegacyGuestCallLink?: boolean
  showModeSwitch?: boolean
  /** Fetch JWT when signature prop is empty. */
  prepareSession?: () => Promise<PrepareZoomSessionResult>
}

const zoomClient = ZoomVideo.createClient()

export default function ZoomVideoCall({
  sessionName,
  sessionDisplay,
  userName,
  onClose,
  headerMode = 'full',
  headerTitle,
  onCallStartedAtChange,
  isInteracting = false,
  sidebarPosition,
  onParticipantCountChange,
  onInCallChange,
  signature: initialSignature,
  sessionId: initialSessionId,
  showSecureGuestInvite = true,
  showLegacyGuestCallLink = false,
  showModeSwitch = true,
  prepareSession,
}: ZoomVideoCallProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'idle'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState('')
  const [sessionId, setSessionId] = useState(initialSessionId || '')
  const [inCall, setInCall] = useState(false)
  const [callStartedAt, setCallStartedAt] = useState<Date | null>(null)
  const [records, setRecords] = useState<ChatRecord[]>([])
  const [transcriptionSubtitle, setTranscriptionSubtitle] = useState<TranscriptEleType>({})
  const clientRef = useRef(zoomClient)

  const handleCallStartedAtChange = useCallback(
    (startedAt: Date) => {
      setCallStartedAt(startedAt)
      onCallStartedAtChange?.(startedAt)
    },
    [onCallStartedAtChange],
  )

  useEffect(() => {
    let isCanceled = false

    if (initialSignature && initialSignature.trim() !== '') {
      setSignature(initialSignature)
      if (initialSessionId) setSessionId(initialSessionId)
      setStatus('ready')
      return
    }

    if (!prepareSession) {
      setError('No signature provided and prepareSession callback is missing')
      setStatus('error')
      return
    }

    const run = async () => {
      try {
        const res = await prepareSession()
        if (isCanceled) return
        setSignature(res.signature)
        if (res.sessionId) setSessionId(res.sessionId)
        setStatus('ready')
      } catch (e) {
        if (isCanceled) return
        setError(e instanceof Error ? e.message : 'Unknown error')
        setStatus('error')
      }
    }

    void run()
    return () => {
      isCanceled = true
    }
  }, [initialSignature, initialSessionId, prepareSession])

  const exitingRef = useRef(false)
  const handleExit = useCallback(async () => {
    if (exitingRef.current) return
    exitingRef.current = true

    try {
      const sessionInfo = clientRef.current.getSessionInfo()
      const mediaStream = clientRef.current.getMediaStream()

      if (sessionInfo && sessionInfo.isInMeeting && mediaStream) {
        await mediaStream.stopVideo().catch((e) => console.warn('stopVideo failed', e))
        await mediaStream.stopAudio().catch((e) => console.warn('stopAudio failed', e))
      }

      if (sessionInfo && sessionInfo.isInMeeting) {
        await clientRef.current.leave()
      }
    } catch (e) {
      console.warn('Error leaving Zoom session', e)
    } finally {
      setInCall(false)
      onClose()
      exitingRef.current = false
    }
  }, [onClose])

  useEffect(() => {
    const handleUnload = () => {
      const sessionInfo = clientRef.current.getSessionInfo()
      if (sessionInfo && sessionInfo.isInMeeting) {
        void clientRef.current.leave().catch((e) => console.warn('Leave failed on unload', e))
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      handleUnload()
    }
  }, [])

  useEffect(() => {
    onInCallChange?.(inCall)
  }, [inCall, onInCallChange])

  if (status === 'loading') {
    return (
      <div className="bg-black h-full flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-white">Preparing Zoom Session...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 gap-4">
        <p className="text-red-500 font-bold">Error: {error}</p>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col w-full h-full bg-[#090E1A] overflow-hidden">
      {headerMode !== 'none' && (
        <div
          className={cn(
            'flex flex-row px-4 py-2 items-center shrink-0 z-10',
            headerMode === 'full'
              ? 'bg-primary-soft shadow border-b border-border justify-between text-[#12141a]'
              : 'bg-transparent absolute top-0 right-0 justify-end',
          )}
        >
          {headerMode === 'full' && (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => void handleExit()}
                title="Back to setup"
                className="shrink-0 p-2 rounded-lg border border-black/10 bg-white/70 text-black/70 hover:bg-white hover:text-black transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col gap-0.5 min-w-0">
                <h2 className="text-base font-bold text-black/70 tracking-tight truncate">
                  {sessionDisplay || headerTitle || sessionName}
                </h2>
                <div className="items-center gap-2 flex">
                  <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <span className="text-[0.625rem] uppercase tracking-wider font-bold text-green-700/80">
                    Zoom Video Active
                  </span>
                  {callStartedAt ? (
                    <>
                      <span className="text-[0.625rem] uppercase tracking-wider font-bold text-black/50">
                        |
                      </span>
                      <span className="text-[0.625rem] tracking-wider font-bold text-black/60">
                        Joined: {formatCreatedDate(callStartedAt.toISOString())}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-row relative">
        <div className="flex-1 flex flex-col relative min-w-0">
          <VideoCall
            controlBarPosition="right"
            jwt={signature}
            session={sessionName}
            sessionId={sessionId || initialSessionId}
            userName={userName}
            client={clientRef}
            inCall={inCall}
            setInCall={setInCall}
            records={records}
            setRecords={setRecords}
            setTranscriptionSubtitle={setTranscriptionSubtitle}
            onCallStartedAtChange={handleCallStartedAtChange}
            isInteracting={isInteracting}
            sidebarPosition={sidebarPosition}
            onExit={handleExit}
            onParticipantCountChange={onParticipantCountChange}
            showSecureGuestInvite={showSecureGuestInvite}
            showLegacyGuestCallLink={showLegacyGuestCallLink}
            showModeSwitch={showModeSwitch}
          />

          <div className="hidden absolute top-4 right-4 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <Transcript transcriptionSubtitle={transcriptionSubtitle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
