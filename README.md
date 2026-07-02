# LinkDrop

LinkDrop is a cross-platform file sharing platform that combines local-first device discovery, WebRTC peer-to-peer transfer, resumable cloud relay, chat, group sharing, and link-based delivery in a single product.

## Stack
- Desktop: Tauri + React + Vite
- Mobile: Flutter
- Backend: Node.js + Express + Socket.IO + WebRTC signaling
- Data: MongoDB + Redis
- Object storage: S3 / Cloudflare R2 / MinIO
- Infra: Docker Compose + Nginx

## Monorepo layout
- `apps/server` - API, sockets, auth, transfer orchestration
- `apps/desktop` - desktop client shell and dashboard UI
- `apps/mobile` - Flutter client for Android and iOS
- `packages/shared` - shared DTOs and enums
- `infra` - local infrastructure and reverse proxy
- `docs` - architecture and API notes

## Core capabilities
- Nearby discovery on LAN / hotspot
- WebRTC peer-to-peer transfer with TURN fallback
- Chunked resumable uploads for 100GB+ files
- Cloud relay with expiring links and password protection
- Device pairing, friend graph, chat, transfer history
- End-to-end encryption metadata flow with AES-256 file encryption
- Background transfer queues, pause, resume, retry, recovery

## Quick start
```bash
pnpm install
cd infra && docker compose up -d
cd ../apps/server && cp .env.example .env && pnpm dev
cd ../desktop && pnpm dev
```

## Production roadmap
1. Finish native transport adapters for Bluetooth / mDNS / Nearby APIs.
2. Wire Flutter and Tauri to the same socket signaling protocol.
3. Add TURN autoscaling, ClamAV scanning, and telemetry.
4. Harden E2EE key exchange and delta sync for large folders.
