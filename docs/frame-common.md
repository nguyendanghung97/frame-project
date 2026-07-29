# Triển khai `frame-common`

`frame-common` là **shared React library** trong `frame-project`. App (ví dụ `project/`) import từ package này; không chạy như SPA độc lập.

Tham chiếu cấu trúc tương tự: `ncs-common` trong NCS frontend (Vite library mode + peer React).

- Page layout system: [`docs/frame-layout.md`](./frame-layout.md)

## Vai trò

| | |
|---|---|
| **Loại** | Vite library (`build.lib`), output ES module |
| **Entry** | `src/index.ts` → `dist/index.js` + `dist/index.d.ts` |
| **Peer deps** | `react`, `react-dom`, `react-router-dom` (app cung cấp) |
| **Alias nội bộ** | `@common/*` → `src/*` |

## Khởi tạo ban đầu (đã làm)

1. Scaffold app bằng create-vite:

```bash
npm create vite@latest frame-common -- --template react-ts
cd frame-common
npm install
```

2. Chuyển sang **library mode**:

- `vite.config.ts`: `build.lib`, `rollupOptions.external`, `vite-plugin-dts`
- `package.json`: `main` / `module` / `types` / `exports` trỏ `dist/`; React thành `peerDependencies`
- Xóa phần app: `index.html`, `public/`, `src/main.tsx`, `src/App.tsx`, …
- Entry công khai: `src/index.ts`

## Cấu trúc hiện tại

```
frame-common/
├── justfile              # install / build / watch
├── package.json
├── vite.config.ts        # lib mode
├── tsconfig.json         # paths: @common/*
├── tsconfig.node.json
└── src/
    ├── index.ts          # public API
    └── vite-env.d.ts
```

Public API chỉ export những gì re-export từ `src/index.ts`. Phần còn lại trong `src/` là nội bộ (có thể import qua `@common/...` trong chính lib).

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

`files` trong `package.json` chỉ publish/pack `dist/` — consumer resolve từ bản build, không phải `src/` (trừ khi app tự alias vào `src`).

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

Rồi:

```bash
cd project
npm install
```

Đảm bảo `react` / `react-dom` của app thỏa peer range của `frame-common` (`^19`).

### 2. Build lib trước khi chạy app

```bash
cd frame-common && npm run build
# hoặc npm run watch song song với npm run dev của app
```

### 3. Import

```ts
import { /* exports */ } from 'frame-common'
```

Chỉ dùng được symbol đã export từ `src/index.ts`.

### 4. (Tuỳ chọn) Alias thẳng vào `src` khi dev

Nếu muốn HMR / không cần rebuild `dist` mỗi lần sửa lib, trong `project/vite.config.ts`:

```ts
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'frame-common': path.resolve(__dirname, '../frame-common/src/index.ts'),
      '@common': path.resolve(__dirname, '../frame-common/src'),
    },
  },
})
```

Và trong `project` tsconfig (nếu cần IDE resolve):

```json
{
  "compilerOptions": {
    "paths": {
      "frame-common": ["../frame-common/src/index.ts"],
      "@common/*": ["../frame-common/src/*"]
    }
  }
}
```

Production vẫn nên build `frame-common` → `dist/` và resolve qua `file:` dependency bình thường.

## Thêm code vào lib

1. Tạo module dưới `src/` (ví dụ `src/components/Button.tsx`).
2. Re-export từ `src/index.ts` (hoặc barrel trung gian rồi export ở `index.ts`).
3. `npm run build` (hoặc `watch`).
4. Import từ app: `import { Button } from 'frame-common'`.

### External dependencies

Mọi package mà **app cũng phải cung cấp** (không bundle vào `dist`) cần:

1. Khai báo `peerDependencies` (và thường cả `devDependencies` để build lib).
2. Thêm vào `rollupOptions.external` trong `vite.config.ts`.

Hiện external sẵn: `react`, `react-dom`, `react/jsx-runtime`, `react-router`, `react-router-dom`.

## `tsconfig` notes (TS 6)

- Không dùng `baseUrl` (deprecated trong TypeScript 6).
- Alias dùng `paths` với đường dẫn đầy đủ, ví dụ `"@common/*": ["./src/*"]`.
- Không thêm `ignoreDeprecations: "6.0"` nếu IDE vẫn dùng TypeScript &lt; 6 (sẽ báo *Invalid value*).

## Checklist triển khai nhanh

- [ ] `cd frame-common && npm install && npm run build`
- [ ] App: `"frame-common": "file:../frame-common"` + `npm install`
- [ ] App cung cấp `react` / `react-dom` (và `react-router-dom` nếu lib dùng)
- [ ] Export API qua `src/index.ts`
- [ ] Dependency mới của lib: peer + `external` nếu không muốn bundle
