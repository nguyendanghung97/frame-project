# App state (`updatePageParams` / `updateModuleState`)

Store trong `frame-common` (port từ `rjs-frame`, **không** nanostores). Quản lý `pageParams`, `pageSearch`, `moduleState` và đồng bộ URL.

Nguồn: `frame-common/src/frame_layout/stores/appStateStore.ts` + `utils/urlUtils.ts`.

**Luồng kết nối store ↔ pages:** [`app_state_flow.md`](./app_state_flow.md) (`PageFrame` là cầu nối React).

## Nguyên tắc: ghi store / đọc context

| Việc | Cách |
|------|------|
| **Ghi** | Import hàm store từ `frame-common` (`updatePageParams`, `updateModuleState`, …) |
| **Đọc (UI)** | `usePageContext()` — snapshot `pageParams` / `pageSearch` / `moduleState` (PageFrame subscribe store → re-render) |
| **Đọc (imperative)** | `getAppState()`, `getModuleState(name)` |

**Không** đặt mutation trên `usePageContext`. Context chỉ đọc + helpers layout (`matchPageParams`, loading, param switcher).

```tsx
import {
  updatePageParams,
  updateModuleState,
  getModuleState,
  usePageContext,
} from 'frame-common'

// Ghi — luôn qua store
updatePageParams({ patient: 'Jane Doe' })
updatePageParams({}, ['patient']) // unset
updateModuleState('patients-list', { scrollTop: 120 })

// Đọc reactive trong component
const { pageParams, moduleState } = usePageContext()
const patient = pageParams.patient as string | undefined
const scrollTop = moduleState['patients-list']?.scrollTop

// Đọc imperative (event handler / ngoài React)
getModuleState('patients-list')
```

## URL sync

Khi `pageParams` / `pageSearch` đổi, store gọi `updateBrowserLocation`:

| State | URL |
|-------|-----|
| `pageParams` | **Hash** fragments (kiểu rjs-frame) |
| `pageSearch` | **Query** `?key=value` |
| `moduleState` | **Không** lên URL (chỉ memory) |

### Hash format

| `pageParams` | Hash |
|--------------|------|
| `{ sidebar: true }` | `#sidebar` |
| `{ sidebar: false }` | `#sidebar:` |
| `{ patient: "Jane Doe" }` | `#patient:Jane%20Doe` (string được `encodeURIComponent`) |
| `{ id: 42 }` | `#id:42` |

Parse ngược khi load / back-forward (`syncFromBrowserLocation` trên `popstate` / `hashchange`).

**State cần sống sau reload** → đưa vào `pageParams` (hoặc `pageSearch`), không để trong `moduleState`.

## API

| API | Vai trò |
|-----|---------|
| `updatePageParams(updates, unsetKeys?)` | Merge `pageParams`; sync hash. `unsetKeys`: `string \| RegExp[]` xóa key trước merge. Value `null` / `undefined` / `''` bị bỏ. |
| `updatePageSearch(updates, unsetKeys?)` | Merge query string. |
| `updateModuleState(moduleName, updates)` | Merge bag UI theo tên module; **giữ** module khác. Không sync URL. |
| `getModuleState(moduleName)` | Đọc bag một module. |
| `getAppState()` | Toàn bộ `{ pageParams, pageSearch, moduleState }`. |
| `subscribeToAppState(listener)` | Subscribe thấp tầng (PageFrame dùng nội bộ). |
| `syncFromBrowserLocation()` | Hash/search → store, không `pushState`. |
| `resetAppState()` | Reset (test / HMR); xóa hash/search tương ứng. |
| `parseBrowserLocation` / `updateBrowserLocation` / `buildUrlFragments` / `parseUrlFragments` | Helpers URL (export công khai). |

## `PageContext` (read-only)

`PageFrame` hydrate từ URL lúc mount, subscribe store, expose:

- `pageParams`, `pageSearch`, `moduleState`
- `matchPageParams`, `setLoading` / `getLoading`
- `registerParamSwitcher` / `unregisterParamSwitcher` / `getParamSwitcher`

Dùng cho `SectionWrapper` `condition={{ key: true }}` — khớp `pageParams.key`.

## `updateModuleState` — dùng khi nào?

Bag UI **theo tên module**, **không** ghi URL. Dùng cho state tạm / nội bộ panel mà reload mất cũng được.

| | `updatePageParams` | `updateModuleState` |
|--|--------------------|---------------------|
| Mục đích | Điều hướng / layout / deep-link | UI nội bộ một widget / panel |
| URL | Có (hash) | Không |
| Reload | Giữ | Mất |
| Ví dụ | patient đang mở, sidebar mở/đóng | scrollTop, refreshTrigger, panel RTC mở, draft form |

Trong NCS (`rjs-frame`) thường thấy:

- `updateModuleState('shift', { refreshTrigger })` — bảo list tự refetch
- `updateModuleState('ringCentral', { isOpenPanel: true })` — mở panel gọi điện (không cần deep-link)
- `updateModuleState('appointment', { refreshAt })` — báo widget appointment refresh

```tsx
import { updateModuleState, usePageContext } from 'frame-common'

const MODULE = 'patients-filters'

updateModuleState(MODULE, { sort: 'name-asc' })

const { moduleState } = usePageContext()
const sort = moduleState[MODULE]?.sort as string | undefined
```

`updateModuleState('a', …)` **không** xóa state của module `'b'` (frame-common merge toàn bộ map; khác bug cũ ở một số bản rjs-frame).

## Demo trong `project/`

`PatientsPage`:

- Chọn patient → `updatePageParams({ patient })` → URL `#patient:…` (reload giữ).
- Sort ở sidebar → `updateModuleState('patients-filters', { sort })` — **không** đổi URL; reload về mặc định.

## Checklist

- [ ] Ghi bằng store import, không qua context
- [ ] State reload-safe → `pageParams` / `pageSearch`
- [ ] Transient UI (scroll, draft, refreshTrigger) → `moduleState`
- [ ] App nằm trong `PageFrame` để context sync + back/forward
- [ ] `npm run build` trong `frame-common` chỉ khi cần check type / emit `dist` (`project` dùng alias `src`)
