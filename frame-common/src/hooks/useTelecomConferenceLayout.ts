import { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { useLocation } from 'react-router-dom'
import {
  $telecomConferenceActiveCall,
  $telecomConferencePipEnabled,
  setTelecomConferenceInlineTargetReady,
  setTelecomConferencePipEnabled,
} from '../stores/telecomConferenceStore'

const DEFAULT_CONFERENCE_PATH = '/app/conference'

export type UseTelecomConferenceLayoutOptions = {
  /** Route that hosts `#telecom-inline-target`. Default `/app/conference`. */
  conferencePath?: string
}

function isConferencePath(pathname: string, conferencePath: string): boolean {
  return (
    pathname === conferencePath ||
    pathname.endsWith(conferencePath) ||
    pathname.endsWith('/conference')
  )
}

/**
 * Auto-switch GlobalZoomPlayer layout: conference route → inline, elsewhere → PiP.
 * Mount once under the app shell (inside Router). Does not start/stop calls.
 */
export function useTelecomConferenceLayout(
  options: UseTelecomConferenceLayoutOptions = {},
) {
  const conferencePath = options.conferencePath ?? DEFAULT_CONFERENCE_PATH
  const location = useLocation()
  const activeCall = useStore($telecomConferenceActiveCall)
  const isPipEnabled = useStore($telecomConferencePipEnabled)
  const isOnConferencePage = isConferencePath(location.pathname, conferencePath)

  useEffect(() => {
    if (!activeCall) {
      setTelecomConferencePipEnabled(false)
      return
    }
    setTelecomConferencePipEnabled(!isOnConferencePage)
    if (!isOnConferencePage) {
      setTelecomConferenceInlineTargetReady(false)
    }
  }, [activeCall, isOnConferencePage])

  return {
    activeCall,
    isPipEnabled,
    isOnConferencePage,
    conferencePath,
  }
}
