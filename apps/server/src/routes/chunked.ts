import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import {
  initiateChunkedUpload, uploadChunk, getChunksStatus, finalizeUpload,
} from '../services/chunked-upload.service.js';

const router = Router();

/* ── Initialize chunked upload ──────────────────────────────── */
router.post('/:id/chunks/init', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    totalChunks: z.number().min(1),
    chunkSize: z.number().min(1),
  });
  const body = schema.parse(req.body);
  const result = await initiateChunkedUpload(req.params.id, body.totalChunks, body.chunkSize);
  res.json(result);
}));

/* ── Upload a single chunk ──────────────────────────────────── */
router.put('/:id/chunks/:index', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const chunkIndex = parseInt(req.params.index, 10);
  if (isNaN(chunkIndex) || chunkIndex < 0) {
    return res.status(400).json({ error: 'Invalid chunk index' });
  }

  // Collect raw body
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const data = Buffer.concat(chunks);

  const result = await uploadChunk(req.params.id, chunkIndex, data);
  res.json(result);
}));

/* ── Get chunk status (for resume) ──────────────────────────── */
router.get('/:id/chunks/status', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const totalChunks = parseInt(req.query.totalChunks as string, 10);
  if (isNaN(totalChunks) || totalChunks < 1) {
    return res.status(400).json({ error: 'totalChunks query parameter required' });
  }
  const status = await getChunksStatus(req.params.id, totalChunks);
  res.json(status);
}));

/* ── Finalize (merge chunks + upload to S3) ─────────────────── */
router.post('/:id/chunks/finalize', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await finalizeUpload(req.params.id);
  res.json(result);
}));

export default router;
