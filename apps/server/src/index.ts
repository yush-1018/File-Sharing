import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'node:http';
import fs from 'node:fs';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { ensureBucket } from './services/storage.service.js';
import { seedDefaults } from './models/index.js';
import authRoutes from './routes/auth.js';
import transferRoutes from './routes/transfers.js';
import chunkedRoutes from './routes/chunked.js';
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
const corsOptions = {
  origin: env.nodeEnv === 'production'
    ? (env.corsOrigin && env.corsOrigin !== '*' ? env.corsOrigin : false)
    : (env.corsOrigin || '*'),
  credentials: true,
};
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);

/* ── Health check ───────────────────────────────────────────── */
app.get('/health', (_req, res) => res.json({
  ok: true,
  service: 'linkdrop-server',
  mode: 'mongodb',
  uptime: process.uptime(),
}));

/* ── Routes ─────────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/transfers', chunkedRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/links', linkRoutes);

/* ── Error handler (must be last) ───────────────────────────── */
app.use(errorHandler);

/* ── Create HTTP + Socket.IO server ─────────────────────────── */
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 100 * 1024 * 1024, // 100MB for large payloads
});

registerSocketHandlers(io);

/* ── Start server with MongoDB + Redis + S3 ─────────────────── */
async function start() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    await seedDefaults();
    console.log('[Startup] MongoDB ready');
  } catch (err) {
    console.warn('[Startup] MongoDB connection failed:', (err as Error).message);
    console.warn('[Startup] Server will start but data operations will fail');
  }

  try {
    // Connect to Redis
    await connectRedis();
    console.log('[Startup] Redis ready');
  } catch (err) {
    console.warn('[Startup] Redis connection failed:', (err as Error).message);
    console.warn('[Startup] Resume tokens and caching will be unavailable');
  }

  try {
    // Ensure S3 bucket exists
    await ensureBucket();
    console.log('[Startup] S3 ready');
  } catch (err) {
    console.warn('[Startup] S3/MinIO not available:', (err as Error).message);
    console.warn('[Startup] Uploads will use local storage');
  }

  server.listen(env.port, () => {
    console.log('');
    console.log('  ╔═══════════════════════════════════════════════╗');
    console.log('  ║           LinkDrop Server Started             ║');
    console.log('  ╠═══════════════════════════════════════════════╣');
    console.log(`  ║  API:       http://localhost:${env.port}            ║`);
    console.log(`  ║  Socket.IO: ws://localhost:${env.port}              ║`);
    console.log('  ║  Storage:   MongoDB + S3/MinIO + Redis        ║');
    console.log(`  ║  Uploads:   ./${env.uploadDir}/                      ║`);
    console.log('  ╚═══════════════════════════════════════════════╝');
    console.log('');
  });
}

/* ── Graceful shutdown ──────────────────────────────────────── */
async function shutdown() {
  console.log('\n[Shutdown] Gracefully shutting down...');
  server.close();
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
