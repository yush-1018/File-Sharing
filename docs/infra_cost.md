# LinkDrop Infrastructure Cost & Financial Scaling Model

## 1. Scale Simulation (1,000 Active Users)
- **Active Monthly Users**: 1,000
- **Monthly Transport Volume**: 5 GB / user / month = **5,000 GB (5 TB) total volume**
- **Direct P2P LAN / WebRTC Ratio**: 75% (3.75 TB zero server bandwidth cost)
- **TURN Relay Ratio**: 15% (750 GB TURN bandwidth)
- **Cloud Storage Relay Ratio**: 10% (500 GB S3/R2 storage)

---

## 2. Infrastructure Cost Breakdown

| Component | Provider Choice | Pricing Model | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **API & Gateway Server** | Hetzner Cloud / DigitalOcean | 2 vCPU, 4GB RAM VPS | **$12.00 / mo** |
| **TURN Relay Server** | Coturn on Hetzner VPS | 2 TB Included Egress ($0.001/GB overage) | **$8.00 / mo** |
| **Object Storage** | Cloudflare R2 | $0.015/GB storage, **$0 Egress** | **$7.50 / mo** (500GB) |
| **Metadata Database** | MongoDB Atlas / Self-hosted | Shared M0 / Managed | **$0.00 - $10.00 / mo** |
| **State Cache & Redis** | Upstash / Redis Cloud | Free Tier (10k ops/day) | **$0.00 / mo** |
| **Total Estimated Cost** | — | — | **~$27.50 - $35.00 / mo** |

---

## 3. Enforced Free Tier & Quota Limits (Cost Bleed Protection)

To guarantee sustainable economics without unexpected cloud bill spikes:

| Resource | Free / Guest Tier Limit | System Enforcement |
| :--- | :--- | :--- |
| **Max File Upload Size** | **5 GB** per file | Express Multer limits & Zod validation |
| **TURN Relay Size Cap** | **2 GB** per transfer | Automatic fallback to Cloudflare R2 |
| **Active Cloud Link Storage** | **2 GB** max active per user | DB quota enforcement |
| **Link Auto-Expiration** | **7 Days** default | Automated TTL cleanup cron |
| **IP Download Rate Limit** | **60 requests / minute** | `express-rate-limit` middleware |

---

## 4. Observability & Telemetry Architecture
- **Correlation ID Tracking**: All HTTP requests and WebSockets emit `X-Correlation-ID` header matching `transferId`.
- **Structured JSON Logging**: Centralized JSON logs (`logEvent`) for error tracking and correlation across client/server.
- **Diagnostics API**: `GET /health` and `GET /api/discovery/nearby` emit health metrics.
