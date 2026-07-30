import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  $telecomConferenceActiveCall,
  setTelecomConferenceActiveCall,
  setTelecomConferenceInlineTargetReady,
  setTelecomConferencePipEnabled,
  updatePageParams,
  usePageContext,
} from 'frame-common'

const CONFERENCE_PATH = '/app/conference'

/** Read Zoom Video SDK topic (`tpc`) from JWT payload. */
function sessionNameFromJwt(jwt: string): string | null {
  try {
    const segment = jwt.split('.')[1]
    if (!segment) return null
    const json = JSON.parse(
      atob(segment.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { tpc?: unknown }
    return typeof json.tpc === 'string' && json.tpc.trim() ? json.tpc.trim() : null
  } catch {
    return null
  }
}

function signatureFromParams(pageParams: Record<string, unknown>): string {
  const raw = pageParams.signature
  return typeof raw === 'string' ? raw : ''
}

/**
 * Setup form + `#telecom-inline-target`.
 * Live Zoom is owned by GlobalZoomPlayer in MainFrame (survives tab switches).
 */
export function ConferencePage() {
  const { pageParams } = usePageContext()
  const signature = signatureFromParams(pageParams)
  const activeCall = useStore($telecomConferenceActiveCall)

  const [userName, setUserName] = useState(activeCall?.userName ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeCall) {
      setTelecomConferenceInlineTargetReady(false)
      return
    }
    setTelecomConferenceInlineTargetReady(true)
    return () => {
      setTelecomConferenceInlineTargetReady(false)
    }
  }, [activeCall])

  const canStart = useMemo(() => {
    return userName.trim().length > 0 && signature.trim().length > 0
  }, [userName, signature])

  const onUserNameChange = (value: string) => {
    setUserName(value)
    setError(null)
  }

  const onSignatureChange = (value: string) => {
    setError(null)
    if (value.trim()) {
      updatePageParams({ signature: value })
    } else {
      updatePageParams({}, ['signature'])
    }
  }

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault()
    const name = userName.trim()
    const jwt = signature.trim()
    if (!name || !jwt) {
      setError('Display name and Zoom JWT are required.')
      return
    }
    const sessionName = sessionNameFromJwt(jwt)
    if (!sessionName) {
      setError('Could not read session topic (tpc) from the JWT. Paste a valid Video SDK token.')
      return
    }
    updatePageParams({ signature: jwt })
    setTelecomConferencePipEnabled(false)
    setTelecomConferenceActiveCall({
      signature: jwt,
      sessionName,
      userName: name,
      originPath: CONFERENCE_PATH,
    })
    setTelecomConferenceInlineTargetReady(true)
  }

  if (activeCall) {
    return (
      <div className="conference-call">
        <div id="telecom-inline-target" className="conference-inline-target" />
      </div>
    )
  }

  return (
    <div className="conference-setup">
      <header className="conference-setup-header">
        <h1 className="conference-setup-title">Zoom conference</h1>
        <p className="conference-setup-lead">
          Enter your name and Video SDK JWT (or open with <code>#signature:…</code>). Leaving this
          page moves the call to picture-in-picture; return here for the full inline player.
        </p>
      </header>

      <form className="conference-form conference-form-simple" onSubmit={handleStart}>
        <label className="conference-field conference-field-wide">
          <span className="conference-label">Your display name</span>
          <input
            className="conference-input"
            name="userName"
            autoComplete="name"
            placeholder="e.g. Dr. A"
            value={userName}
            onChange={(e) => onUserNameChange(e.target.value)}
            required
          />
        </label>

        <label className="conference-field conference-field-wide">
          <span className="conference-label">Zoom JWT (signature)</span>
          <textarea
            className="conference-textarea"
            name="signature"
            rows={5}
            spellCheck={false}
            placeholder="Paste Video SDK JWT here"
            value={signature}
            onChange={(e) => onSignatureChange(e.target.value)}
            required
          />
        </label>

        {error ? <p className="conference-error">{error}</p> : null}

        <div className="conference-actions">
          <button type="submit" className="conference-submit" disabled={!canStart}>
            Open preview &amp; join
          </button>
        </div>
      </form>
    </div>
  )
}
