import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { announceDevice, setDeviceOffline, getNearbyDevices } from '../services/discovery.service.js';
import { addMessage, getMessages } from '../services/chat.service.js';

/** Extract IP address from socket handshake */
function getSocketIP(socket: Socket): string {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
  }
  return socket.handshake.address || '';
}

/** Authenticate socket via JWT token in handshake auth */
function authenticateSocket(socket: Socket): { userId?: string; userName?: string } {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return {};
    const payload = jwt.verify(token, env.jwtSecret) as { sub: string };
    return { userId: payload.sub };
  } catch {
    return {};
  }
}

export function registerSocketHandlers(io: Server) {
  // Measure ping latency per socket
  const pingLatencies = new Map<string, number>();

  io.on('connection', (socket) => {
    const { userId } = authenticateSocket(socket);
    const clientIP = getSocketIP(socket);

    console.log(`[Socket] connected: ${socket.id} (IP: ${clientIP}, user: ${userId || 'anon'})`);

    // Periodic heartbeat to measure latency
    const pingInterval = setInterval(() => {
      const start = Date.now();
      socket.emit('ping:check', {}, () => {
        pingLatencies.set(socket.id, Date.now() - start);
      });
    }, 10000);

    /* ── Device presence ──────────────────────────────────────── */
    socket.on('presence:announce', async (rawPayload: unknown) => {
      const schema = z.object({
        name: z.string().min(1),
        platform: z.string(),
        deviceType: z.enum(['desktop', 'mobile', 'tablet']),
        userId: z.string().optional(),
      });
      const parsed = schema.safeParse(rawPayload);
      if (!parsed.success) return socket.emit('error', { message: 'Invalid presence payload' });

      const latencyMs = pingLatencies.get(socket.id);
      const device = await announceDevice({
        name: parsed.data.name,
        platform: parsed.data.platform,
        deviceType: parsed.data.deviceType,
        userId: parsed.data.userId || userId,
        socketId: socket.id,
        ipAddress: clientIP,
        latencyMs,
      });
      socket.broadcast.emit('presence:update', device);
      const devices = await getNearbyDevices();
      socket.emit('presence:list', devices);
    });

    /* ── Room management ──────────────────────────────────────── */
    socket.on('room:join', async (roomId: string) => {
      if (typeof roomId !== 'string' || !roomId) return;
      socket.join(roomId);
      const history = await getMessages(roomId);
      socket.emit('chat:history', { roomId, messages: history });
    });

    socket.on('room:leave', (roomId: string) => {
      if (typeof roomId === 'string') socket.leave(roomId);
    });

    /* ── Chat ─────────────────────────────────────────────────── */
    socket.on('chat:send', async (rawPayload: unknown) => {
      const schema = z.object({
        roomId: z.string().min(1),
        text: z.string().min(1).max(5000),
        senderUserId: z.string(),
        senderName: z.string(),
      });
      const parsed = schema.safeParse(rawPayload);
      if (!parsed.success) return socket.emit('error', { message: 'Invalid chat payload' });

      const msg = await addMessage({
        roomId: parsed.data.roomId,
        senderUserId: parsed.data.senderUserId,
        senderName: parsed.data.senderName,
        text: parsed.data.text,
      });
      io.to(parsed.data.roomId).emit('chat:message', msg);
    });

    /* ── WebRTC signaling (requires auth) ────────────────────────── */
    socket.on('webrtc:signal', (rawPayload: unknown) => {
      if (!userId) return socket.emit('error', { message: 'Authentication required for WebRTC signaling' });
      const schema = z.object({
        to: z.string().min(1),
        signal: z.any(),
        metadata: z.object({ fileName: z.string().optional(), fileSize: z.number().optional(), encryptionKey: z.string().optional() }).optional(),
      });
      const parsed = schema.safeParse(rawPayload);
      if (!parsed.success) return socket.emit('error', { message: 'Invalid signaling payload' });

      io.to(parsed.data.to).emit('webrtc:signal', { from: socket.id, signal: parsed.data.signal, metadata: parsed.data.metadata });
    });

    socket.on('webrtc:accept', (rawPayload: unknown) => {
      if (!userId) return socket.emit('error', { message: 'Authentication required' });
      const schema = z.object({ to: z.string().min(1) });
      const parsed = schema.safeParse(rawPayload);
      if (!parsed.success) return;
      io.to(parsed.data.to).emit('webrtc:accepted', { from: socket.id });
    });

    socket.on('webrtc:reject', (rawPayload: unknown) => {
      if (!userId) return socket.emit('error', { message: 'Authentication required' });
      const schema = z.object({ to: z.string().min(1), reason: z.string().optional() });
      const parsed = schema.safeParse(rawPayload);
      if (!parsed.success) return;
      io.to(parsed.data.to).emit('webrtc:rejected', { from: socket.id, reason: parsed.data.reason });
    });

    /* ── ICE configuration request (TURN credentials restricted to auth users) ─ */
    socket.on('ice:config', () => {
      const iceServers: any[] = [{ urls: env.stunServer }];
      if (userId) {
        iceServers.push({
          urls: env.turnServer,
          username: env.turnUser,
          credential: env.turnPassword,
        });
      }
      socket.emit('ice:config', { iceServers });
    });

    /* ── Transfer progress (targeted emission to peer) ────────── */
    socket.on('transfer:progress', (rawPayload: unknown) => {
      const schema = z.object({
        transferId: z.string(),
        toSocketId: z.string().optional(),
        progress: z.number(),
        speed: z.string(),
        eta: z.string(),
        status: z.string(),
      });
      const parsed = schema.safeParse(rawPayload);
      if (!parsed.success) return;

      if (parsed.data.toSocketId) {
        io.to(parsed.data.toSocketId).emit('transfer:progress', parsed.data);
      } else {
        socket.emit('transfer:progress', parsed.data);
      }
    });

    /* ── Disconnect ───────────────────────────────────────────── */
    socket.on('disconnect', async () => {
      console.log(`[Socket] disconnected: ${socket.id}`);
      clearInterval(pingInterval);
      pingLatencies.delete(socket.id);
      await setDeviceOffline(socket.id);
      io.emit('presence:offline', { socketId: socket.id });
    });
  });
}
