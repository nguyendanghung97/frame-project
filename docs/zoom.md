# Zoom / telecom conference (`frame-common`)

## Tab persistence (GlobalZoomPlayer)

Mount `GlobalZoomPlayer` once in the app shell. Call identity lives in `$telecomConferenceActiveCall`; layout uses PiP / inline flags.

### `useTelecomConferenceLayout`

Auto-switch only:

- on conference route → inline (`pip=false`; page sets `inlineTargetReady`)
- other routes + active call → PiP

```tsx
// frame.tsx shell (inside Router)
useTelecomConferenceLayout({ conferencePath: '/app/conference' })

const call = useStore($telecomConferenceActiveCall)
return call ? <GlobalZoomPlayer {...call} onClose={clearTelecomConference} /> : null
```

```tsx
// ConferencePage — start call + inline host
setTelecomConferenceActiveCall({ signature, sessionName, userName, originPath })
// render <div id="telecom-inline-target" /> and setTelecomConferenceInlineTargetReady(true)
```

## Store (`src/stores/telecomConferenceStore.ts`)

| Atom / action | Vai trò |
|---------------|---------|
| `$telecomConferenceActiveCall` | Identity call (sống qua navigate) |
| `$telecomConferencePipEnabled` | PiP vs inline |
| `$telecomConferenceInlineTargetReady` | `#telecom-inline-target` đã mount |
| `setTelecomConferenceActiveCall` / `clearTelecomConference` | Bật / tắt call |
| `setTelecomConferencePipEnabled` | Manual / auto PiP |
| `setTelecomConferenceInlineTargetReady` | Host báo target sẵn sàng |

## `ZoomVideoCall`

| Prop | Vai trò |
|------|---------|
| `sessionName`, `userName`, `onClose` | Bắt buộc |
| `signature` / `prepareSession()` | JWT |
| `showSecureGuestInvite` / `showLegacyGuestCallLink` / `showModeSwitch` | Control bar extras |

Peers: `@zoom/videosdk`, `lucide-react`, `nanostores`, `@nanostores/react`, `react-router-dom`.
