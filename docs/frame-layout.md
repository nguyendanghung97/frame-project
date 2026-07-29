# Page layout system (`frame-layout`)

Hệ thống bố cục trang của `frame-common`, tách từ `rjs-admin` **không phụ thuộc** `rjs-admin` / `rjs-frame`.

Layouts sẵn có (`ThreeColumns`, `TwoColumnsWithRightPanel`, …) nằm ở `frame-common/src/layouts/` và **build trên** các primitive trong `frame-common/src/frame-layout/`.

App state / URL (`updatePageParams`, …): [`docs/app-state.md`](./app-state.md).  
Luồng store ↔ `PageFrame` ↔ pages: [`docs/app-state-flow.md`](./app-state-flow.md).

## Ý tưởng

1. **Layout** khai báo *khung* (cột / vùng) bằng `SectionWrapper` + `PageSection`.
2. **Page** truyền *nội dung* qua children có `sectionName` khớp tên section.
3. `PageLayout` gom children theo `sectionName` → đưa vào `LayoutContext` → `PageSection` render đúng chỗ.

```
PageFrame (PageContext — đọc pageParams / moduleState)
  └─ YourLayout extends PageLayout
        ├─ SectionWrapper + PageSection name="sidebar"
        ├─ SectionWrapper + PageSection name="main"
        └─ SectionWrapper + PageSection name="rightPanel"
              ▲
              │ children từ page:
              │   <PageModule sectionName="sidebar">…</PageModule>
              │   <PageModule sectionName="main">…</PageModule>
              │   <PageModule sectionName="rightPanel">…</PageModule>
```

## Các primitive

| Component | Vai trò |
|-----------|---------|
| **`PageFrame`** | App chrome provider. Cung cấp `PageContext` (bắt buộc nếu dùng `condition` / một số API). Subscribe app store + sync URL back/forward. Subclass và implement `renderContent()` (thường là header + `<Outlet />`). |
| **`PageLayout`** | Base class cho layout. Gom children theo `sectionName`, cung cấp `LayoutContext`. Subclass implement `renderContent()`. |
| **`PageSection`** | Slot đích trong layout. `name` phải khớp `sectionName` của module. |
| **`SectionWrapper`** | Wrapper cột (optional resize, `condition` theo `pageParams`). |
| **`PageModule`** | Nội dung page gắn vào một section (`sectionName` bắt buộc). |

Helpers: `cn`, `matchPageParams`, `usePageContext` (đọc), `useLayoutContext`.  
Mutations / URL: xem [`app-state.md`](./app-state.md) — **không** gắn lên `usePageContext`.

## Cách build một layout mới

### 1. Extend `PageLayout`

```tsx
// src/layouts/MyTwoCol.tsx
import {
  cn,
  PageLayout,
  PageSection,
  SectionWrapper,
  type PageLayoutProps,
} from '../frame-layout'

export interface MyTwoColProps extends PageLayoutProps {
  minSidebarWidth?: number
}

export class MyTwoCol extends PageLayout<MyTwoColProps> {
  renderContent() {
    const { className, minSidebarWidth = 240 } = this.props as MyTwoColProps

    return (
      <div className={cn('frame-layout-row', className)}>
        <SectionWrapper
          tag="aside"
          className="frame-layout-col"
          minWidth={minSidebarWidth}
          resizable="right"
        >
          <PageSection name="sidebar" className="frame-section frame-section--sidebar" />
        </SectionWrapper>

        <SectionWrapper tag="main" className="frame-layout-col frame-layout-col--main">
          <PageSection name="main" className="frame-section" />
        </SectionWrapper>
      </div>
    )
  }
}
```

### 2. Export layout

Trong `src/layouts/index.ts`:

```ts
export { MyTwoCol } from './MyTwoCol'
```

### 3. Style cấu trúc

Dùng class trong `src/styles/` (không phụ thuộc Tailwind):

- `layouts.css` — `.frame-layout-row`, `.frame-layout-col`, `.frame-section`, …
- `resize.css` — handle khi `resizable="left"|"right"`
- Entry: `src/styles/index.css` — app import relative (không ship trong `dist`, giống ncs-common)

App import:

```css
/* project/src/styles/index.css */
@import '../../../frame-common/src/styles/index.css';
```

### 4. Check lib (không bắt buộc cho `project` dev)

`project` alias vào `frame-common/src` — sửa lib là HMR, không cần rebuild `dist`.

```bash
cd frame-common
npm run build   # chỉ để tsc check + emit dist (CI / publish)
```

### Gợi ý khi design layout

- Mỗi `PageSection name="…"` = một slot public mà page phải fill.
- `SectionWrapper` + `resizable` cho cột kéo được.
- `condition={{ key: true }}` — chỉ hiện khi `pageParams.key === true` (ghi bằng `updatePageParams({ key: true })` từ store). Điều kiện rỗng / không có → luôn hiện.
- Prefer class semantic (`frame-layout-*`) thay vì utility Tailwind (lib không ship Tailwind).

## Cách sử dụng trong app

### Bước 0 — `PageFrame` ở route cha

Layout cần `PageContext` từ `PageFrame` (đặc biệt khi có resize / condition / đọc `pageParams`):

```tsx
// frame.tsx
import { PageFrame } from 'frame-common'
import { Outlet } from 'react-router-dom'

class MainFrameInner extends PageFrame {
  renderContent() {
    return (
      <div className="app-frame">
        <header>…</header>
        <div className="app-frame__body">
          <Outlet />
        </div>
      </div>
    )
  }
}

export function MainFrame() {
  return <MainFrameInner />
}
```

Gắn vào router:

```tsx
{ path: 'app', element: <MainFrame />, children: [ /* pages */ ] }
```

### Bước 1 — Page fill các section

**Cách A — `PageModule` (khuyến nghị):**

```tsx
import { PageModule, ThreeColumns, updatePageParams, usePageContext } from 'frame-common'

function PatientsMain() {
  const { pageParams } = usePageContext()
  const selected = pageParams.patient as string | undefined

  return (
    <button
      type="button"
      onClick={() => updatePageParams({ patient: 'Jane Doe' })}
    >
      {selected ?? 'Pick'}
    </button>
  )
}

export function PatientsPage() {
  return (
    <ThreeColumns title="Patients" minSidebarWidth={240} minRightPanelWidth={280}>
      <PageModule sectionName="sidebar">…filters…</PageModule>
      <PageModule sectionName="main">
        <PatientsMain />
      </PageModule>
      <PageModule sectionName="rightPanel">…detail…</PageModule>
    </ThreeColumns>
  )
}
```

**Cách B — function component với `sectionName`:**

```tsx
import type { PageModuleProps } from 'frame-common'
import { TwoColumnsWithRightPanel } from 'frame-common'

function HomeMain(props: PageModuleProps) {
  return <div className={props.className}>…</div>
}

export function HomePage() {
  return (
    <TwoColumnsWithRightPanel title="Home" minRightPanelWidth={280}>
      <HomeMain sectionName="main" />
      <HomeAside sectionName="rightPanel" />
    </TwoColumnsWithRightPanel>
  )
}
```

`sectionName` **bắt buộc** khớp `PageSection name` trong layout.

### Props layout thường dùng

| Prop | Ý nghĩa |
|------|---------|
| `title` | Đặt `document.title` |
| `className` | Class thêm vào root layout |
| `sectionClasses` | `{ [sectionName]: className }` merge vào `PageSection` tương ứng |

## Slot của layout sẵn có

| Layout | Sections |
|--------|----------|
| `ThreeColumns` | `sidebar`, `main`, `rightPanel` |
| `TwoColumnsWithRightPanel` | `main`, `rightPanel` |
| `TwoColumnsWithSideBar` | `sidebar` *(có thể có `condition`)*, `main` |
| `TwoColumnsWithHeader` | `header`, `sidebar`, `main` |
| `ReportsPageLayout` | `mainHeader` *(nếu `showHeader`)*, `main`, `filterPanel` *(nếu `showFilterPanel` + page param)* |

## Checklist debug

- [ ] App đã import CSS từ `frame-common/src/styles`?
- [ ] Route page nằm **trong** `PageFrame`?
- [ ] Vite alias `frame-common` → `../frame-common/src` (không cần rebuild dist khi dev)?
- [ ] Mọi child có `sectionName` khớp slot?
- [ ] Cột xếp dọc? → thiếu CSS flex (`frame-layout-row`) — kiểm tra import CSS.
- [ ] Sidebar / filter không hiện? → kiểm tra `condition` và `pageParams` ([`app-state.md`](./app-state.md)).
- [ ] Reload mất selection? → state đó phải nằm trong `pageParams` / hash, không phải `moduleState`.

## Cấu trúc folder

```
frame-common/src/frame-layout/
  components/
    PageFrame.tsx
    PageLayout.tsx
    PageSection.tsx
    SectionWrapper.tsx
    PageModule.tsx
    index.ts
  stores/
    appStateStore.ts
  utils/
    urlUtils.ts
  contexts.tsx
  matchPageParams.ts
  cn.ts / types.ts
  index.ts
```

Tài liệu liên quan: [`frame-common.md`](./frame-common.md) · [`app-state.md`](./app-state.md) · [`app-state-flow.md`](./app-state-flow.md).
