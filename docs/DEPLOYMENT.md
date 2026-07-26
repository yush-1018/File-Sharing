# LinkDrop Production Deployment Guide

## 1. Prerequisites
- Docker Engine v24.0+ & Docker Compose v2.20+
- Domain name with SSL certificates (Certbot / Let's Encrypt)
- Node.js v20 LTS

---

## 2. Docker Production Deployment
```bash
# Clone repository
git clone https://github.com/yush-1018/File-Sharing.git
cd File-Sharing

# Copy environment template & set production secrets
cp .env.example .env
nano .env

# Start full production stack
docker compose -f infra/docker-compose.yml up -d --build
```

---

## 3. Vercel & Render Setup
- **Frontend (Vercel)**: Point root to `apps/desktop` or `frontend/`. Set `VITE_API_URL=https://your-backend-api.onrender.com`.
- **Backend (Render / Hetzner)**: Point to `apps/server` or `backend/`. Set `NODE_ENV=production`, `JWT_SECRET`, `MONGODB_URI`, `REDIS_URL`.
