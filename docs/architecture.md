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

## Cross-Platform Signaling Protocol Spec (`packages/shared`)
To prevent protocol drift between Flutter (Dart) and Desktop/Web (JS) clients, signaling uses a standardized, framework-agnostic JSON message envelope (`SignalingMessage<T>`):
- `SignalingMessageType.PRESENCE_ANNOUNCE` (`presence:announce`)
- `SignalingMessageType.PRESENCE_UPDATE` (`presence:update`)
- `SignalingMessageType.PRESENCE_LIST` (`presence:list`)
- `SignalingMessageType.PRESENCE_OFFLINE` (`presence:offline`)
- `SignalingMessageType.WEBRTC_SIGNAL` (`webrtc:signal`)
- `SignalingMessageType.WEBRTC_REJECT` (`webrtc:reject`)
- `SignalingMessageType.TRANSFER_PROGRESS` (`transfer:progress`)
- `SignalingMessageType.TRANSFER_COMPLETE` (`transfer:complete`)

Both Dart and JS clients serialize and deserialize against this shared spec over standard WebSocket framing, eliminating version mismatch bugs.

## Large file strategy
- Default chunk size: 8MB to 32MB adaptive.
- Merkle-tree or rolling checksum verification for chunk recovery.
- Resume token persisted in Redis and MongoDB.
- Background workers handle cloud multipart uploads and retries.
- Delta sync compares folder manifests and only resends changed blocks.
