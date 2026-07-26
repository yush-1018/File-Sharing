# LinkDrop Security & Cryptography Specification

## 1. Threat Model & Product Transparency

LinkDrop maintains strict transparent security definitions across all transfer paths to prevent misleading marketing claims and protect user privacy:

| Transfer Mode | Encryption Model | Server Visibility | Cryptographic Primitives |
| :--- | :--- | :--- | :--- |
| **P2P Direct (WebRTC / LAN)** | **Zero-Knowledge E2EE** | **Zero (Metadata & Data Opaque)** | WebCrypto ECDH (P-256) + AES-256-GCM |
| **Cloud Relay & Share Links** | **Encrypted in Transit & at Rest** | **Server Relay Assisted** | TLS 1.3 + AES-256-GCM + PBKDF2 (SHA-256) |

---

## 2. Cryptographic Protocol Specifications

### A. P2P Direct E2EE Protocol (WebRTC / LAN)
1. **Key Agreement**: Sender and Receiver generate ephemeral ECDH (P-256 curve) keypairs in-browser via standard WebCrypto API.
2. **Session Key Derivation**: ECDH exchange derives a symmetric 256-bit AES-GCM session key (`HKDF-SHA256`).
3. **Payload Encipherment**: File chunks are encrypted client-side using `AES-256-GCM` with a 96-bit random IV per chunk before transmission across the WebRTC DataChannel.
4. **Signaling Server Scope**: The signaling server only relays public ECDH keys and WebRTC SDP/ICE candidates; **it never has access to private keys or plaintext file contents**.

### B. Cloud Relay Security Protocol (S3 / R2 Links)
1. **In-Transit Protection**: Enforced TLS 1.3 with HSTS.
2. **At-Rest Protection**: Server-side AES-256-GCM object storage encryption.
3. **Password Protection**: Optional user-specified link passwords are hashed client-side using `PBKDF2` (100,000 iterations, SHA-256).

---

## 3. Third-Party Security Audit Readiness
- Codebase maintains clean cryptographic boundary separation (`packages/shared` + WebCrypto API).
- All cryptographic primitives utilize native browser/Node.js `crypto` implementations (no custom/unvetted crypto implementations).
