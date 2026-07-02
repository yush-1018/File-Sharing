import { announceDevice, setDeviceOffline, getNearbyDevices } from '../services/discovery.service.js';
import { addMessage, getMessages } from '../services/chat.service.js';
export function registerSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket] connected: ${socket.id}`);
        /* ── Device presence ──────────────────────────────────────── */
        socket.on('presence:announce', (payload) => {
            const device = announceDevice({ ...payload, socketId: socket.id });
            socket.broadcast.emit('presence:update', device);
            // Send current device list back to the announcer
            socket.emit('presence:list', getNearbyDevices());
        });
        /* ── Room management ──────────────────────────────────────── */
        socket.on('room:join', (roomId) => {
            socket.join(roomId);
            console.log(`[Socket] ${socket.id} joined room ${roomId}`);
            // Send room history
            const history = getMessages(roomId);
            socket.emit('chat:history', { roomId, messages: history });
        });
        socket.on('room:leave', (roomId) => {
            socket.leave(roomId);
        });
        /* ── Chat ─────────────────────────────────────────────────── */
        socket.on('chat:send', (payload) => {
            const msg = addMessage({
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
        socket.on('chat:typing', (payload) => {
            socket.to(payload.roomId).emit('chat:typing', payload);
        });
        /* ── WebRTC signaling ─────────────────────────────────────── */
        socket.on('webrtc:signal', ({ to, signal }) => {
            io.to(to).emit('webrtc:signal', { from: socket.id, signal });
        });
        /* ── Transfer progress (real-time broadcast) ──────────────── */
        socket.on('transfer:progress', (payload) => {
            io.emit('transfer:progress', payload);
        });
        socket.on('transfer:complete', (payload) => {
            io.emit('transfer:complete', payload);
        });
        /* ── Disconnect ───────────────────────────────────────────── */
        socket.on('disconnect', () => {
            console.log(`[Socket] disconnected: ${socket.id}`);
            setDeviceOffline(socket.id);
            io.emit('presence:offline', { socketId: socket.id });
        });
    });
}
