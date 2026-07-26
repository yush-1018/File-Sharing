# LinkDrop REST & Socket.IO API Specification

## 1. Authentication APIs (`/api/auth`)
- `POST /api/auth/register` — Email registration (`email`, `password`, `name`)
- `POST /api/auth/login` — Email login (`email`, `password`)
- `POST /api/auth/guest` — Anonymous guest session creation (`name`)
- `GET /api/auth/me` — Current user profile

---

## 2. File & Transfer APIs (`/api/transfers`)
- `POST /api/transfers/plan` — Optimal transport selection (`sameLan`, `onlineRemote`, `estimatedBytes`)
- `POST /api/transfers` — Create file transfer record
- `GET /api/transfers` — List user transfers with pagination (`page`, `limit`)
- `GET /api/transfers/:id` — Get transfer metadata (strips internal S3 keys)
- `PATCH /api/transfers/:id/progress` — Update progress (`transferredBytes`, `speed`)
- `POST /api/transfers/:id/pause` — Pause active transfer
- `POST /api/transfers/:id/resume` — Resume transfer
- `POST /api/transfers/:id/cancel` — Cancel transfer

---

## 3. Chunked Resumable Upload APIs (`/api/transfers/:id/chunks`)
- `POST /api/transfers/:id/chunks/init` — Initialize chunk upload session
- `PUT /api/transfers/:id/chunks/:index` — Upload individual 8MB chunk
- `GET /api/transfers/:id/chunks/status` — Get chunk bitmap for resume
- `POST /api/transfers/:id/chunks/finalize` — Merge chunks & push to S3/R2

---

## 4. Cloud Share Links APIs (`/api/links`)
- `POST /api/links` — Create share link with optional password & expiry
- `GET /api/links` — List my share links (`page`, `limit`)
- `GET /api/links/:id` — Public link info (`hasPassword`, `views`, `downloads`)
- `GET /api/links/:id/download` — Download link file (requires `X-Link-Password` if protected; on-the-fly decryption)
- `DELETE /api/links/:id` — Revoke share link
- `POST /api/links/:id/report` — Report DMCA / malware abuse (auto-quarantine)

---

## 5. Folder & Organization APIs (`/api/folders`)
- `POST /api/folders` — Create folder (supports nested parent folders)
- `GET /api/folders` — List folders
- `PUT /api/folders/:id` — Rename / move folder
- `DELETE /api/folders/:id` — Delete folder & contents

---

## 6. Socket.IO Events
- `presence:announce` — Announce local presence & platform
- `presence:list` — Receive nearby device presence
- `webrtc:signal` — Relay WebRTC SDP/ICE signaling (requires auth)
- `chat:send` — Send room chat message (sanitized & length-capped)
- `ice:config` — Get STUN & authenticated TURN credentials
