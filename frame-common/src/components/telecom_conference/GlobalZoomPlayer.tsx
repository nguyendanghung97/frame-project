import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@nanostores/react'
import { useNavigate } from 'react-router-dom'
import { GripHorizontal, Maximize2 } from 'lucide-react'
import ZoomVideoCall from './ZoomVideoCall'
import {
  $telecomConferenceInlineTargetReady,
  $telecomConferencePipEnabled,
  resetTelecomConferenceLayout,
  setTelecomConferencePipEnabled,
} from '../../stores/telecomConferenceStore'

const INLINE_TARGET_ID = 'telecom-inline-target'

export interface GlobalZoomPlayerProps {
  signature: string
  sessionName: string
  userName: string
  sessionId?: string
  sessionDisplay?: string
  /** Navigate here when leaving PiP (maximize). */
  originPath?: string
  /** Popup owns the call — player stays hidden. */
  isPopup?: boolean
  /** DOM id of the inline mount target. Default: `telecom-inline-target`. */
  inlineTargetId?: string
  onClose?: () => void
}

/**
 * Global Zoom shell: portals the call, positions over the inline target, or
 * shows a draggable PiP. Layout mode comes from `telecomConferenceStore`;
 * call identity comes from props.
 */
export function GlobalZoomPlayer({
  signature,
  sessionName,
  userName,
  sessionId,
  sessionDisplay,
  originPath,
  isPopup = false,
  inlineTargetId = INLINE_TARGET_ID,
  onClose,
}: GlobalZoomPlayerProps) {
  const isInlineReady = useStore($telecomConferenceInlineTargetReady)
  const isPipMode = useStore($telecomConferencePipEnabled)
  const navigate = useNavigate()

  const [inlineRect, setInlineRect] = useState<DOMRect | null>(null)
  const [pipPosition, setPipPosition] = useState({ x: 24, y: 24 })
  const [pipSize, setPipSize] = useState({ width: 360, height: 420 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<null | 'top' | 'left' | 'top-left'>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const initialPipPos = useRef({ x: 24, y: 24 })
  const initialPipSize = useRef({ width: 360, height: 420 })

  useEffect(() => {
    if (!isInlineReady) {
      setInlineRect(null)
      return
    }

    let ro: ResizeObserver | null = null
    let target: HTMLElement | null = null

    const updateRect = () => {
      if (target) setInlineRect(target.getBoundingClientRect())
    }

    const bindTarget = () => {
      target = document.getElementById(inlineTargetId)
      if (!target) return false
      updateRect()
      ro = new ResizeObserver(updateRect)
      ro.observe(target)
      window.addEventListener('resize', updateRect)
      window.addEventListener('scroll', updateRect, true)
      return true
    }

    const cleanup = () => {
      ro?.disconnect()
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }

    if (bindTarget()) return cleanup

    const interval = window.setInterval(() => {
      if (bindTarget()) window.clearInterval(interval)
    }, 50)

    return () => {
      window.clearInterval(interval)
      cleanup()
    }
  }, [isInlineReady, inlineTargetId])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPipMode) return
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStartPos.current = { x: clientX, y: clientY }
    initialPipPos.current = { ...pipPosition }
    initialPipSize.current = { ...pipSize }
    e.preventDefault()
  }

  const handleResizeStart = (
    e: React.MouseEvent | React.TouchEvent,
    direction: 'top' | 'left' | 'top-left',
  ) => {
    if (!isPipMode) return
    setIsResizing(direction)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStartPos.current = { x: clientX, y: clientY }
    initialPipPos.current = { ...pipPosition }
    initialPipSize.current = { ...pipSize }
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
      const deltaX = clientX - dragStartPos.current.x
      const deltaY = clientY - dragStartPos.current.y

      if (isDragging && isPipMode) {
        const nextX = initialPipPos.current.x - deltaX
        const nextY = initialPipPos.current.y - deltaY
        const minX = 10
        const maxX = window.innerWidth - pipSize.width - 10
        const minY = 10
        const maxY = window.innerHeight - pipSize.height - 10

        setPipPosition({
          x: Math.max(minX, Math.min(maxX, nextX)),
          y: Math.max(minY, Math.min(maxY, nextY)),
        })
      }

      if (isResizing && isPipMode) {
        const newSize = { ...initialPipSize.current }
        const minWidth = 320
        const minHeight = 360

        if (isResizing === 'left' || isResizing === 'top-left') {
          const maxWidth = Math.min(
            window.innerWidth * 0.6,
            window.innerWidth - initialPipPos.current.x - 40,
          )
          newSize.width = Math.min(
            maxWidth,
            Math.max(minWidth, initialPipSize.current.width - deltaX),
          )
        }

        if (isResizing === 'top' || isResizing === 'top-left') {
          const maxHeight = window.innerHeight - initialPipPos.current.y - 80
          newSize.height = Math.min(
            maxHeight,
            Math.max(minHeight, initialPipSize.current.height - deltaY),
          )
        }

        setPipSize(newSize)
      }
    }

    const handleEnd = () => {
      setIsDragging(false)
      setIsResizing(null)
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleMove, { passive: false })
      window.addEventListener('touchend', handleEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, isResizing, isPipMode, pipSize.width, pipSize.height])

  const handleClose = () => {
    resetTelecomConferenceLayout()
    onClose?.()
  }

  const handleMaximize = () => {
    setTelecomConferencePipEnabled(false)
    if (originPath) {
      navigate(originPath)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('focus-zoom-tab'))
      }, 100)
    }
  }

  if (!signature?.trim() || isPopup) return null

  const isInlineVisible = !isPipMode && Boolean(isInlineReady && inlineRect)

  const playerContent = (
    <>
      {(isDragging || isResizing !== null) && isPipMode && (
        <div className="fixed inset-0 z-99999 bg-transparent cursor-default pointer-events-auto" />
      )}
      <div
        className="bg-[#3b3c3e] overflow-hidden flex flex-col fixed rounded-none"
        style={{
          top: isPipMode ? 'auto' : isInlineVisible ? `${inlineRect!.top}px` : '-624.9375rem',
          left: isPipMode ? 'auto' : isInlineVisible ? `${inlineRect!.left}px` : '-624.9375rem',
          right: isPipMode ? `${pipPosition.x}px` : 'auto',
          bottom: isPipMode ? `${pipPosition.y}px` : 'auto',
          width: isPipMode ? `${pipSize.width}px` : isInlineVisible ? `${inlineRect!.width}px` : '1px',
          height: isPipMode
            ? `${pipSize.height}px`
            : isInlineVisible
              ? `${inlineRect!.height}px`
              : '1px',
          borderRadius: isPipMode ? '0.75rem' : isInlineVisible ? '0 0 0 0.5rem' : '0px',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          boxShadow: isPipMode ? '0 1.25rem 2.8125rem rgba(0,0,0,0.45)' : 'none',
          zIndex: isPipMode ? 100000 : 40,
          opacity: isPipMode || isInlineVisible ? 1 : 0,
          pointerEvents: isPipMode || isInlineVisible ? 'auto' : 'none',
        }}
      >
        {isPipMode && (
          <div className="py-2 bg-[#3b3c3e] border-b border-white/10 shrink-0 z-50 flex items-center justify-between px-4">
            <div
              className="flex items-center gap-2 h-full flex-1 cursor-move"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <GripHorizontal className="text-white/70 w-4 h-4" />
              <span className="text-[0.6875rem] font-bold text-white/90 uppercase tracking-widest leading-none mt-0.5">
                Zoom PiP
              </span>
            </div>
            <div className="flex items-center gap-2 relative z-60">
              <button
                type="button"
                onClick={handleMaximize}
                className="p-1 px-2 bg-white/20 hover:bg-white/30 text-white rounded-md transition-all border border-white/30"
                title="Back to inline"
              >
                <Maximize2 size="0.75rem" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
                className="p-1 px-2.5 bg-red-600/80 hover:bg-red-700 text-white rounded-md transition-all text-[0.625rem] font-black uppercase border border-red-400/30"
                title="End Video Call"
              >
                Exit
              </button>
            </div>
          </div>
        )}
        {isPipMode && (
          <>
            <div
              className="absolute top-0 left-0 right-0 h-1 z-60 cursor-ns-resize transition-all"
              onMouseDown={(e) => handleResizeStart(e, 'top')}
              onTouchStart={(e) => handleResizeStart(e, 'top')}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[0.125rem] rounded-full bg-white/30" />
            </div>
            <div
              className="absolute top-0 left-0 bottom-0 w-1 z-60 cursor-ew-resize transition-all"
              onMouseDown={(e) => handleResizeStart(e, 'left')}
              onTouchStart={(e) => handleResizeStart(e, 'left')}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[0.125rem] rounded-full bg-white/30" />
            </div>
            <div
              className="absolute top-0 left-0 size-8 z-70 cursor-nwse-resize transition-all"
              onMouseDown={(e) => handleResizeStart(e, 'top-left')}
              onTouchStart={(e) => handleResizeStart(e, 'top-left')}
            />
          </>
        )}
        <div className="flex-1 min-h-0 relative">
          <ZoomVideoCall
            key={signature}
            headerMode={isPipMode ? 'none' : 'full'}
            sessionName={sessionName}
            sessionDisplay={sessionDisplay}
            userName={userName}
            onClose={handleClose}
            signature={signature}
            sessionId={sessionId}
            isInteracting={isDragging || isResizing !== null}
            showSecureGuestInvite={true}
            showLegacyGuestCallLink={false}
            showModeSwitch={false}
          />
        </div>
      </div>
    </>
  )

  return createPortal(playerContent, document.body)
}

export default GlobalZoomPlayer
