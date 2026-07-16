import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
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
    socket.on('presence:announce', async (payload: {
      name: string; platform: string; deviceType: 'desktop' | 'mobile' | 'tablet'; userId?: string;
    }) => {
      const latencyMs = pingLatencies.get(socket.id);
      const device = await announceDevice({
        ...payload,
        userId: payload.userId || userId,
        socketId: socket.id,
        ipAddress: clientIP,
        latencyMs,
      });
      socket.broadcast.emit('presence:update', device);
      // Send current device list back to the announcer
      const devices = await getNearbyDevices();
      socket.emit('presence:list', devices);
    });

    /* ── Room management ──────────────────────────────────────── */
    socket.on('room:join', async (roomId: string) => {
      socket.join(roomId);
      console.log(`[Socket] ${socket.id} joined room ${roomId}`);
      // Send room history
      const history = await getMessages(roomId);
      socket.emit('chat:history', { roomId, messages: history });
    });

    socket.on('room:leave', (roomId: string) => {
      socket.leave(roomId);
    });

    /* ── Chat ─────────────────────────────────────────────────── */
    socket.on('chat:send', async (payload: {
      roomId: string; text: string; senderUserId: string; senderName: string;
    }) => {
      const msg = await addMessage({
        roomId: payload.roomId,
        senderUserId: payload.senderUserId,
        senderName: payload.senderName,
        text: payload.text,
      });
      // Broadcast to everyone in the room (including sender for confirmation)
      io.to(payload.roomId).emit('chat:message', msg);
      // Also broadcast globally for sidebar updates
      io.emit('chat:new', msg);
    });

    socket.on('chat:typing', (payload: { roomId: string; userName: string; typing: boolean }) => {
      socket.to(payload.roomId).emit('chat:typing', payload);
    });

    /* ── WebRTC signaling ─────────────────────────────────────── */
    socket.on('webrtc:signal', ({ to, signal, metadata }: {
      to: string;
      signal: any;
      metadata?: { fileName?: string; fileSize?: number; encryptionKey?: string };
    }) => {
      io.to(to).emit('webrtc:signal', { from: socket.id, signal, metadata });
    });

    socket.on('webrtc:accept', ({ to }: { to: string }) => {
      io.to(to).emit('webrtc:accepted', { from: socket.id });
    });

    socket.on('webrtc:reject', ({ to, reason }: { to: string; reason?: string }) => {
      io.to(to).emit('webrtc:rejected', { from: socket.id, reason });
    });

    /* ── ICE configuration request ────────────────────────────── */
    socket.on('ice:config', () => {
      socket.emit('ice:config', {
        iceServers: [
          { urls: env.stunServer },
          {
            urls: env.turnServer,
            username: env.turnUser,
            credential: env.turnPassword,
          },
        ],
      });
    });

    /* ── Transfer progress (real-time broadcast) ──────────────── */
    socket.on('transfer:progress', (payload: {
      transferId: string; progress: number; speed: string; eta: string; status: string;
    }) => {
      io.emit('transfer:progress', payload);
    });

    socket.on('transfer:complete', (payload: { transferId: string; fileName: string }) => {
      io.emit('transfer:complete', payload);
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
