# Triển khai `frame-common`

`frame-common` là **shared React library** trong `frame-project`. App (ví dụ `project/`) import từ package này; không chạy như SPA độc lập.

Tham chiếu cấu trúc tương tự: `ncs-common` trong NCS frontend (Vite library mode + peer React).

## Tài liệu liên quan

| Doc | Nội dung |
|-----|----------|
| [`frame_layout.md`](./frame_layout.md) | Primitive layout (`PageFrame`, `PageLayout`, sections) + layouts sẵn có |
| [`app_state.md`](./app_state.md) | `updatePageParams` / `updateModuleState`, URL hash/query, đọc qua `usePageContext` |
| [`app_state_flow.md`](./app_state_flow.md) | Luồng kết nối store ↔ `PageFrame` ↔ pages |
| [`zoom.md`](./zoom.md) | Zoom UI + `telecomConferenceStore` (nanostores cho GlobalZoomPlayer) |
| [`convention/001.naming_convention.md`](./convention/001.naming_convention.md) | Naming (từ rjs-frame) |

## Vai trò

| | |
|---|---|
| **Loại** | Vite library (`build.lib`), output ES module |
| **Entry** | `src/index.ts` → `dist/index.js` + `dist/index.d.ts` |
| **Peer deps** | `react`, `react-dom`, `react-router-dom` (app cung cấp) |
| **Alias nội bộ** | `@common/*` → `src/*` |

## Cấu trúc hiện tại

```
frame-common/
├── justfile
├── package.json          # exports: "."
├── vite.config.ts        # lib mode + vite-plugin-dts
├── tsconfig.json
└── src/
    ├── index.ts          # public API: frame_layout + layouts
    ├── frame_layout/     # PageFrame, store, urlUtils, contexts
    ├── layouts/          # ThreeColumns, TwoColumns*, ReportsPageLayout
    ├── styles/           # layouts.css, resize.css — app import từ src
    └── vite-env.d.ts
```

Public API chỉ export những gì re-export từ `src/index.ts` (qua `frame_layout` + `layouts`).

## Build & phát triển

```bash
cd frame-common
npm install

npm run build    # tsc --noEmit && vite build → dist/
npm run watch    # rebuild khi sửa nguồn
npm run lint     # oxlint

# hoặc just
just install
just build
just watch
```

`files` trong `package.json` chỉ publish/pack `dist/`. App `project/` **không** phụ thuộc `dist` khi dev — Vite alias vào `src` (xem dưới).

## Dùng từ app (`project/`)

### 1. Khai báo dependency

Trong `project/package.json`:

```json
{
  "dependencies": {
    "frame-common": "file:../frame-common"
  }
}
```

```bash
cd project && npm install
```

Đảm bảo `react` / `react-dom` thỏa peer (`^19`).

### 2. Dev: alias vào `src` (không cần rebuild `dist`)

Giống `ncs-common` trong NCS: app resolve thẳng source qua Vite alias. Sửa `frame-common` → HMR ngay, **không** chạy `npm run build` mỗi lần.

`project/vite.config.ts` đã cấu hình:

```ts
alias: {
  'frame-common': path.resolve(rootDir, '../frame-common/src'),
  '@common': path.resolve(rootDir, '../frame-common/src'),
}
```

CSS (như ncs-common): import relative tới `src/styles`, không qua package export / `dist`:

```css
/* project/src/styles/index.css */
@import '../../../frame-common/src/styles/index.css';
```

`npm run build` trong `frame-common` chỉ để **check type / emit `dist`** (CI, publish), không phải bước bắt buộc trước `project` dev.

### 3. Import JS

```ts
import {
  PageFrame,
  ThreeColumns,
  PageModule,
  updatePageParams,
  usePageContext,
} from 'frame-common'
```

### 4. Pattern state (tóm tắt)

- **Ghi:** `updatePageParams` / `updateModuleState` (store).
- **Đọc UI:** `usePageContext().pageParams` (và `moduleState`).
- Chi tiết + URL hash: [`app_state.md`](./app_state.md).

### 5. Khi nào cần `frame-common` build?

| Việc | Cần `npm run build`? |
|------|----------------------|
| `project` `npm run dev` / Vite build app (có alias) | Không |
| Check lỗi TypeScript / emit `dist` | Có |
| Consumer không alias (chỉ `file:` → `dist`) | Có |

```bash
cd frame-common && npm run build   # check + dist
cd ../project && npm run dev       # dùng src qua alias
```

## Thêm code vào lib

1. Tạo module dưới `src/` (ví dụ layout mới trong `src/layouts/`).
2. Re-export từ barrel (`layouts/index.ts` hoặc `frame_layout/index.ts`) — đã được `src/index.ts` export.
3. App `project` (alias) nhận thay đổi qua HMR — không cần build lib.
4. Tuỳ chọn: `npm run build` trong `frame-common` để check type / emit `dist`.

### External dependencies

Mọi package mà **app cũng phải cung cấp** (không bundle vào `dist`) cần:

1. Khai báo `peerDependencies` (và thường cả `devDependencies` để build lib).
2. Thêm vào `rollupOptions.external` trong `vite.config.ts`.

Hiện external sẵn: `react`, `react-dom`, `react/jsx-runtime`, `react-router`, `react-router-dom`.

## `tsconfig` notes (TS 6)

- Không dùng `baseUrl` (deprecated trong TypeScript 6).
- Alias dùng `paths` với đường dẫn đầy đủ, ví dụ `"@common/*": ["./src/*"]`.
- Không thêm `ignoreDeprecations: "6.0"` nếu IDE vẫn dùng TypeScript &lt; 6.

## Checklist triển khai nhanh

- [ ] `cd frame-common && npm install` (build chỉ khi cần check / `dist`)
- [ ] App: `"frame-common": "file:../frame-common"` + Vite alias → `../frame-common/src`
- [ ] App import CSS từ `../../../frame-common/src/styles/index.css`
- [ ] App cung cấp `react` / `react-dom` / `react-router-dom`
- [ ] Route cha dùng `PageFrame`; page fill layout bằng `PageModule`
- [ ] State lên URL → `updatePageParams` ([`app_state.md`](./app_state.md))
