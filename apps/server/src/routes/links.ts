import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { z } from 'zod';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { createLink, getLinks, getLinkById, revokeLink, recordView, recordDownload } from '../services/link.service.js';
import { uploadToS3, downloadFromS3, generateS3Key } from '../services/storage.service.js';
import { scanFile } from '../services/scan.service.js';
import { downloadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `link-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
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

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 * 1024 }, fileFilter });

/* ── Create cloud link (upload file) ────────────────────────── */
router.post('/', requireAuth, upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  // Malware scan
  const scanResult = await scanFile(req.file.path);
  if (!scanResult.clean) {
    const fs = await import('node:fs');
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(422).json({
      error: 'File rejected: malware detected',
      threat: scanResult.threat,
    });
  }

  // Upload to S3
  let s3Key: string | undefined;
  try {
    const key = generateS3Key(req.file.originalname, 'links');
    await uploadToS3(req.file.path, key, req.file.mimetype);
    s3Key = key;
  } catch (err) {
    console.warn('[Links] S3 upload failed, keeping local file:', (err as Error).message);
  }

  const link = await createLink({
    userId: req.userId!,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    storagePath: s3Key ? req.file.path : req.file.path,
    s3Key,
    password: req.body?.password,
    expiresInDays: req.body?.expiresInDays ? Number(req.body.expiresInDays) : 7,
  });

  res.status(201).json(link);
}));

/* ── List my links ──────────────────────────────────────────── */
router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const links = await getLinks(req.userId!);
  res.json(links);
}));

/* ── Get link info (public — for sharing) ───────────────────── */
router.get('/:id', asyncHandler(async (req, res) => {
  const link = await getLinkById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  await recordView(link.id);
  // Don't expose password or storagePath to public
  const { password, storagePath, s3Key, ...publicLink } = link;
  res.json({ ...publicLink, hasPassword: !!password });
}));

/* ── Download file from link (public with optional password) ── */
router.get('/:id/download', downloadLimiter, asyncHandler(async (req, res) => {
  const link = await getLinkById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (!link.active) return res.status(410).json({ error: 'Link has been revoked' });
  if (new Date(link.expiresAt) < new Date()) return res.status(410).json({ error: 'Link has expired' });

  // Check password if set
  if (link.password && req.query.password !== link.password) {
    return res.status(403).json({ error: 'Password required or incorrect' });
  }

  await recordDownload(link.id);

  // Try S3 first, then local file
  if (link.s3Key) {
    try {
      const { stream, contentLength, contentType } = await downloadFromS3(link.s3Key);
      res.setHeader('Content-Disposition', `attachment; filename="${link.fileName}"`);
      res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      (stream as any).pipe(res);
      return;
    } catch (err) {
      console.warn('[Links] S3 download failed, trying local:', (err as Error).message);
    }
  }

  // Fallback to local file
  const fs = await import('node:fs');
  if (!link.storagePath || !fs.existsSync(link.storagePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(link.storagePath, link.fileName, { headers: { 'Content-Type': 'application/octet-stream' } });
}));

/* ── Revoke link (requires auth + ownership) ────────────────── */
router.delete('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const link = await getLinkById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (link.userId !== req.userId) return res.status(403).json({ error: 'Access denied' });

  const revoked = await revokeLink(req.params.id);
  if (!revoked) return res.status(404).json({ error: 'Link not found' });
  res.json(revoked);
}));

export default router;
