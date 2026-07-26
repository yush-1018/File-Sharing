import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'node:path';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import {
  chooseTransferMethod, createTransfer, getTransfersByUser,
  getTransferById, updateTransferStatus, updateTransferProgress,
} from '../services/transfer.service.js';
import { uploadToS3, generateS3Key } from '../services/storage.service.js';
import { scanFile } from '../services/scan.service.js';

import { sharedMulterUpload } from '../utils/upload.js';

const router = Router();

/* ── Plan best method ───────────────────────────────────────── */
router.post('/plan', requireAuth, asyncHandler(async (req, res) => {
  const schema = z.object({
    sameLan: z.boolean().optional().default(false),
    hotspotReachable: z.boolean().optional().default(false),
    bluetoothAvailable: z.boolean().optional().default(false),
    estimatedBytes: z.number().optional().default(0),
    onlineRemote: z.boolean().optional().default(true),
  });
  const method = chooseTransferMethod(schema.parse(req.body));
  res.json({ method });
}));

/* ── Upload file (create transfer) ──────────────────────────── */
router.post('/', requireAuth, sharedMulterUpload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  // Malware scan
  const scanResult = await scanFile(req.file.path);
  if (!scanResult.clean) {
    // Delete the infected file
    const fs = await import('node:fs');
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(422).json({
      error: 'File rejected: malware detected',
      threat: scanResult.threat,
    });
  }

  // Determine transfer method based on context
  const method = chooseTransferMethod({
    sameLan: req.body?.sameLan === 'true',
    hotspotReachable: req.body?.hotspotReachable === 'true',
    bluetoothAvailable: req.body?.bluetoothAvailable === 'true',
    estimatedBytes: req.file.size,
    onlineRemote: req.body?.onlineRemote !== 'false',
  });

  // Upload to S3
  let s3Key: string | undefined;
  try {
    const key = generateS3Key(req.file.originalname);
    await uploadToS3(req.file.path, key, req.file.mimetype);
    s3Key = key;
  } catch (err) {
    console.warn('[Transfer] S3 upload failed, keeping local file:', (err as Error).message);
  }

  const transfer = await createTransfer({
    senderUserId: req.userId!,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    storagePath: s3Key ? undefined : req.file.path,
    s3Key,
    peer: req.body?.peer || 'Cloud',
    transferMethod: method,
    encrypted: req.body?.encrypted === 'true',
  });

  res.status(201).json(transfer);
}));

/* ── List my transfers ──────────────────────────────────────── */
router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const list = await getTransfersByUser(req.userId!);
  res.json(list);
}));

/* ── Get one transfer ───────────────────────────────────────── */
router.get('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const transferId = req.params.id as string;
  const t = await getTransferById(transferId);
  if (!t) return res.status(404).json({ error: 'Transfer not found' });
  if (t.senderUserId !== req.userId && t.receiverUserId !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(t);
}));

/* ── Update progress ────────────────────────────────────────── */
router.patch('/:id/progress', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const transferId = req.params.id as string;
  const existing = await getTransferById(transferId);
  if (!existing) return res.status(404).json({ error: 'Transfer not found' });
  if (existing.senderUserId !== req.userId && existing.receiverUserId !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const schema = z.object({ transferredBytes: z.number(), speed: z.string().optional() });
  const body = schema.parse(req.body);
  const t = await updateTransferProgress(transferId, body.transferredBytes, body.speed);
  res.json(t);
}));

/* ── Pause / Resume / Cancel ────────────────────────────────── */
router.post('/:id/pause', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const transferId = req.params.id as string;
  const existing = await getTransferById(transferId);
  if (!existing) return res.status(404).json({ error: 'Transfer not found' });
  if (existing.senderUserId !== req.userId && existing.receiverUserId !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const t = await updateTransferStatus(transferId, 'paused');
  res.json(t);
}));

router.post('/:id/resume', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const transferId = req.params.id as string;
  const existing = await getTransferById(transferId);
  if (!existing) return res.status(404).json({ error: 'Transfer not found' });
  if (existing.senderUserId !== req.userId && existing.receiverUserId !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const t = await updateTransferStatus(transferId, 'in_progress');
  res.json(t);
}));

router.post('/:id/cancel', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const transferId = req.params.id as string;
  const existing = await getTransferById(transferId);
  if (!existing) return res.status(404).json({ error: 'Transfer not found' });
  if (existing.senderUserId !== req.userId && existing.receiverUserId !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const t = await updateTransferStatus(transferId, 'cancelled');
  res.json(t);
}));

export default router;
