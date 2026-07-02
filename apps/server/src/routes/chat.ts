import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { getRooms, getMessages, addMessage, getOrCreateRoom } from '../services/chat.service.js';

const router = Router();

/* ── List rooms ─────────────────────────────────────────────── */
router.get('/rooms', asyncHandler(async (_req, res) => {
  const rooms = getRooms();
  res.json(rooms);
}));

/* ── Create room ────────────────────────────────────────────── */
router.post('/rooms', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({ name: z.string().min(1) });
  const { name } = schema.parse(req.body);
  const room = getOrCreateRoom(name.toLowerCase().replace(/\s+/g, '-'), name);
  res.status(201).json(room);
}));

/* ── Get messages ───────────────────────────────────────────── */
router.get('/rooms/:roomId/messages', asyncHandler(async (req, res) => {
  const msgs = getMessages(req.params.roomId);
  res.json(msgs);
}));

/* ── Send message via REST ──────────────────────────────────── */
router.post('/rooms/:roomId/messages', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({ text: z.string().min(1) });
  const { text } = schema.parse(req.body);
  const msg = addMessage({
    roomId: req.params.roomId as string,
    senderUserId: req.userId!,
    senderName: req.userName || 'Anonymous',
    text,
  });
  res.status(201).json(msg);
}));

export default router;
