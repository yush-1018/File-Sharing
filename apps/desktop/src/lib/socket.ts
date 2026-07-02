import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8080';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

/* ── Convenience emitters ───────────────────────────────────── */
export function announcePresence(info: {
  name: string;
  platform: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userId?: string;
}) {
  socket?.emit('presence:announce', info);
}

export function joinRoom(roomId: string) {
  socket?.emit('room:join', roomId);
}

export function leaveRoom(roomId: string) {
  socket?.emit('room:leave', roomId);
}

export function sendChatViaSocket(payload: {
  roomId: string;
  text: string;
  senderUserId: string;
  senderName: string;
}) {
  socket?.emit('chat:send', payload);
}

export function emitTyping(roomId: string, userName: string, typing: boolean) {
  socket?.emit('chat:typing', { roomId, userName, typing });
}

export function emitTransferProgress(payload: {
  transferId: string;
  progress: number;
  speed: string;
  eta: string;
  status: string;
}) {
  socket?.emit('transfer:progress', payload);
}
