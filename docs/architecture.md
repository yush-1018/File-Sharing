# LinkDrop architecture

## Discovery & Transport Strategy

### MVP Discovery (Production Core)
1. **Zero-Permission IP/LAN Probing**: UDP broadcast & mDNS network queries.
2. **WebSocket Presence Signaling**: High-reliability real-time peer discovery for web, desktop, and mobile without native permission prompts.

### Phase 2 Native Platform Adapters (Epic Breakdown)
- **Android Epic**: Kotlin plugin for Nearby Connections API & BLE (requires Android 12+ `BLUETOOTH_SCAN`/`CONNECT` runtime permissions & Google API quota approval).
- **iOS Epic**: Swift plugin for `NSBonjourServices` in `Info.plist` with iOS 14+ Local Network permission handling.
- **Desktop Epic**: Rust mDNS/SSDP plugin for Tauri background scanning.

### Transport Decision Engine & TURN Cost Protection
1. **Direct LAN / Hotspot**: Preferred path (0 external bandwidth cost).
2. **WebRTC Direct P2P (STUN)**: Preferred remote path (0 server relay bandwidth cost).
3. **TURN Relay Quota Cap**: TURN fallback (symmetric NAT) is capped at **2GB** max per transfer to prevent server bandwidth cost explosion.
4. **Cloud Relay Fallback (>2GB)**: Transfers requiring TURN relay over 2GB automatically route to Cloudflare R2 / S3 zero-egress object storage links.

### TURN Provider Cost Comparison Strategy
- **Self-Hosted Coturn** (DigitalOcean / Hetzner): ~$0.01/GB bandwidth (Recommended for MVP infra).
- **Cloudflare Calls / WebRTC TURN**: Free/Zero-Egress tier for WebRTC data channels.
- **Twilio / Xirsys Managed TURN**: $0.40/GB (Restricted due to high per-GB costs for large files).

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
