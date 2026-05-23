# FixTok

I kept exporting videos from TikTok and the audio was always slightly off. Found out it's a known ~133ms delay from TikTok's export pipeline. Instead of fixing every video manually in Premiere, I built a browser tool that does it in seconds — FFmpeg runs directly in the tab, nothing gets uploaded.

**Learned:** FFmpeg.wasm, browser File System Access API, Next.js

![FixTok screenshot](public/screenshot.png)

## How it works

1. Drop your TikTok export (`.MOV` or `.MP4`) into the tool
2. Adjust the offset slider if needed (default 133ms fixes most exports)
3. Your browser re-encodes the audio and saves the fixed file

## Features

- **100% private** — videos never touch a server; FFmpeg runs via WebAssembly in your tab
- **Instant** — no upload wait, processes as fast as your CPU
- **Precise control** — adjustable offset from 0–500ms
- **Folder support** — drop a whole folder, it scans automatically
- **Saves next to originals** — no Downloads folder mess (Chrome/Edge)

## Tech stack

- Next.js 14 · React 18 · TypeScript
- `@ffmpeg/ffmpeg` + `@ffmpeg/core` (WebAssembly)
- Tailwind CSS

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> Requires `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers for SharedArrayBuffer (already configured in `next.config.js`).
