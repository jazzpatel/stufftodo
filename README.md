# TaskFlow PWA (scaffold)

This is a small Vite + React + TypeScript Progressive Web App scaffold implementing the spec's UI and local file saving via the File System Access API when available (with download fallback).

How to run

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

Notes

- Service worker is registered from `/public/sw.js`.
- Manifest is at `/public/manifest.webmanifest`.
- File saving uses `window.showSaveFilePicker` when available and falls back to a download.

Requirements coverage

- PWA with manifest, icons and service worker: Done
- File Handling API detection and fallback: Done (see `src/fileHandler.ts`)
- React + Vite + TypeScript: scaffolded
- Top bar with hamburger, title icon and search: Done in `src/App.tsx`
- Bottom tab bar with search and menu on right: Done in `src/App.tsx`
