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

## MVP Transport & Discovery Architecture
- **Primary Discovery**: IP/LAN Probing (UDP broadcast / mDNS) + WebSocket Presence signaling. Zero runtime permission friction (no Android 12+ Bluetooth background scan prompts or iOS Local Network blocks).
- **Primary Data Transports**: Direct LAN Socket Streams + WebRTC DataChannels with STUN/TURN traversal.
- **Fallback Transport**: Resumable Chunked Cloud Relay via S3/R2 object storage.

## Multi-Phase Roadmap (Platform Epics)

### Phase 1: MVP (Active Core)
- High-speed LAN discovery & WebRTC P2P direct transfers.
- Resumable 8MB chunked uploads with cloud link generation.
- Universal Web & Desktop React client + Flutter mobile base.

### Phase 2: Native Platform Adapters (Dedicated Epic)
- **Android Native Epic**: Implement Kotlin plugin for Google Nearby Connections API (handling Android 12+ `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT` runtime permissions & Google API quota approval).
- **iOS Native Epic**: Implement Swift plugin for `NSBonjourServices` in `Info.plist` with iOS 14+ Local Network permission prompts and background BLE scanning compliance.
- **Desktop Adapter Epic**: Implement native mDNS / SSDP Rust plugin for Tauri background LAN discovery.

