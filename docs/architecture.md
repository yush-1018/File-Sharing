# LinkDrop architecture

## Decision engine
1. Detect peer reachability using presence, STUN/TURN, LAN probes, and optional Bluetooth adapter hooks.
2. Score transport candidates by throughput, packet loss, NAT complexity, and file size.
3. Prefer direct LAN or hotspot.
4. Use WebRTC data channels for online remote peers.
5. Fall back to encrypted cloud relay for offline or huge transfers.

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
