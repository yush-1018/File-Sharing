import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'node:http';
import fs from 'node:fs';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import transferRoutes from './routes/transfers.js';
import discoveryRoutes from './routes/discovery.js';
import chatRoutes from './routes/chat.js';
import linkRoutes from './routes/links.js';
import { registerSocketHandlers } from './sockets/index.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

/* ── Ensure upload directory exists ─────────────────────────── */
if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const app = express();

/* ── Global middleware ──────────────────────────────────────── */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.corsOrigin || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);

/* ── Health check ───────────────────────────────────────────── */
app.get('/health', (_req, res) => res.json({
  ok: true,
  service: 'linkdrop-server',
  mode: 'in-memory',
  uptime: process.uptime(),
}));

/* ── Routes ─────────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/links', linkRoutes);

/* ── Serve uploaded files statically ────────────────────────── */
app.use('/uploads', express.static(env.uploadDir));

/* ── Error handler (must be last) ───────────────────────────── */
app.use(errorHandler);

/* ── Create HTTP + Socket.IO server ─────────────────────────── */
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.corsOrigin || '*', credentials: true },
  maxHttpBufferSize: 100 * 1024 * 1024, // 100MB for large payloads
});

registerSocketHandlers(io);

/* ── Start server (no MongoDB required) ─────────────────────── */
server.listen(env.port, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║           LinkDrop Server Started             ║');
  console.log('  ╠═══════════════════════════════════════════════╣');
  console.log(`  ║  API:       http://localhost:${env.port}            ║`);
  console.log(`  ║  Socket.IO: ws://localhost:${env.port}              ║`);
  console.log('  ║  Storage:   In-memory (no DB required)        ║');
  console.log(`  ║  Uploads:   ./${env.uploadDir}/                      ║`);
  console.log('  ╚═══════════════════════════════════════════════╝');
  console.log('');
});
