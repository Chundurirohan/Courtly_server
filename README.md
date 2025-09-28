# Courtly Server (Node + Express + TypeScript)

A production-ready backend for deposition audio → text.

## Features
- File uploads (multer) with SHA-256 hashing
- Optional audio enhancement/transcode to WAV mono 16k (ffmpeg)
- Pluggable ASR providers:
  - `whisper.cpp` CLI (local) if `WHISPER_CPP_BIN` is set
  - Deepgram API if `DEEPGRAM_API_KEY` is set
  - Fallback mock for development
- Chain-of-custody JSON record per job
- TXT/DOCX export endpoints
- CORS for local dev (`Vite` front-end)

## Quick Start
```bash
cp .env.example .env
# Optionally set FFMPEG_PATH, WHISPER_CPP_BIN, WHISPER_CPP_MODEL or DEEPGRAM_API_KEY
npm i
npm run dev
# Server: http://localhost:$PORT (default 5050)
```

### Endpoints
- `POST /api/transcribe` (multipart form)
  - fields: `speakers`, `timestamps`, `confidence`, `enhanceAudio`, `notes`
  - files: one or more `files` (audio)
- `POST /api/export` (JSON) → `{ format: 'txt'|'docx', transcriptText, title }`
- `GET /exports/<file>` static exports

