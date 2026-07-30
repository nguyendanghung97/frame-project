import { atom } from 'nanostores'

/** Active Zoom call identity for GlobalZoomPlayer (survives route changes). */
export interface TelecomConferenceActiveCall {
  signature: string
  sessionName: string
  userName: string
  sessionId?: string
  sessionDisplay?: string
  /** Path to return to when leaving PiP (maximize). */
  originPath?: string
}

export const $telecomConferenceActiveCall = atom<TelecomConferenceActiveCall | null>(null)

/** PiP vs inline overlay for GlobalZoomPlayer. */
export const $telecomConferencePipEnabled = atom(false)

/** Host sets true when `#telecom-inline-target` (or custom id) is mounted. */
export const $telecomConferenceInlineTargetReady = atom(false)

export function setTelecomConferenceActiveCall(call: TelecomConferenceActiveCall | null) {
  $telecomConferenceActiveCall.set(call)
  if (!call) {
    $telecomConferencePipEnabled.set(false)
    $telecomConferenceInlineTargetReady.set(false)
  }
}

export function setTelecomConferencePipEnabled(enabled: boolean) {
  $telecomConferencePipEnabled.set(enabled)
}

export function setTelecomConferenceInlineTargetReady(ready: boolean) {
  $telecomConferenceInlineTargetReady.set(ready)
}

/** Reset layout flags only (keeps active call). */
export function resetTelecomConferenceLayout() {
  $telecomConferencePipEnabled.set(false)
  $telecomConferenceInlineTargetReady.set(false)
}

/** End call + clear layout. */
export function clearTelecomConference() {
  setTelecomConferenceActiveCall(null)
}
