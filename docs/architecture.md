# LinkDrop architecture

## Discovery & Transport Strategy

### MVP Discovery (Production Core)
1. **Zero-Permission IP/LAN Probing**: UDP broadcast & mDNS network queries.
2. **WebSocket Presence Signaling**: High-reliability real-time peer discovery for web, desktop, and mobile without native permission prompts.

### Phase 2 Native Platform Adapters (Epic Breakdown)
- **Android Epic**: Kotlin plugin for Nearby Connections API & BLE (requires Android 12+ `BLUETOOTH_SCAN`/`CONNECT` runtime permissions & Google API quota approval).
- **iOS Epic**: Swift plugin for `NSBonjourServices` in `Info.plist` with iOS 14+ Local Network permission handling.
- **Desktop Epic**: Rust mDNS/SSDP plugin for Tauri background scanning.

### Transport Decision Engine
1. Score reachability candidates by throughput, latency, and NAT complexity.
2. Prefer direct LAN or hotspot socket streams.
3. Use WebRTC DataChannels for online remote peers with TURN fallback.
4. Fall back to chunked cloud relay for offline or huge file transfers.

## REST API surface
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/guest
- GET /api/discovery/nearby
- POST /api/transfers/plan
- POST /api/transfers
- PATCH /api/transfers/:id/progress
- POST /api/transfers/:id/pause
- POST /api/transfers/:id/resume
- POST /api/transfers/:id/cancel

## Socket events
- presence:announce
- presence:update
- room:join
- chat:send
- chat:message
- webrtc:signal
- transfer:progress

## Large file strategy
- Default chunk size: 8MB to 32MB adaptive.
- Merkle-tree or rolling checksum verification for chunk recovery.
- Resume token persisted in Redis and MongoDB.
- Background workers handle cloud multipart uploads and retries.
- Delta sync compares folder manifests and only resends changed blocks.
