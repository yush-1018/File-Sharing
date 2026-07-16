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

const router = Router();

/* ── Multer for file uploads ────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const dangerous = ['.html', '.htm', '.svg', '.exe', '.bat', '.cmd', '.sh', '.js', '.php', '.pl', '.py'];
  if (dangerous.includes(ext)) {
    return cb(new Error('File type not allowed'));
  }
  cb(null, true);
};

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 * 1024 }, fileFilter }); // 10GB limit

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
router.post('/', requireAuth, upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
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
  const t = await getTransferById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Transfer not found' });
  res.json(t);
}));

/* ── Update progress ────────────────────────────────────────── */
router.patch('/:id/progress', requireAuth, asyncHandler(async (req, res) => {
  const schema = z.object({ transferredBytes: z.number(), speed: z.string().optional() });
  const body = schema.parse(req.body);
  const t = await updateTransferProgress(req.params.id, body.transferredBytes, body.speed);
  if (!t) return res.status(404).json({ error: 'Transfer not found' });
  res.json(t);
}));

/* ── Pause / Resume / Cancel ────────────────────────────────── */
router.post('/:id/pause', requireAuth, asyncHandler(async (req, res) => {
  const t = await updateTransferStatus(req.params.id, 'paused');
  if (!t) return res.status(404).json({ error: 'Transfer not found' });
  res.json(t);
}));

router.post('/:id/resume', requireAuth, asyncHandler(async (req, res) => {
  const t = await updateTransferStatus(req.params.id, 'in_progress');
  if (!t) return res.status(404).json({ error: 'Transfer not found' });
  res.json(t);
}));

router.post('/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const t = await updateTransferStatus(req.params.id, 'cancelled');
  if (!t) return res.status(404).json({ error: 'Transfer not found' });
  res.json(t);
}));

export default router;
