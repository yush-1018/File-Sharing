import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { createLink, getLinks, getLinkById, revokeLink, recordView, recordDownload } from '../services/link.service.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `link-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 * 1024 } });

/* ── Create cloud link (upload file) ────────────────────────── */
router.post('/', requireAuth, upload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const link = createLink({
    userId: req.userId!,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    storagePath: req.file.path,
    password: req.body?.password,
    expiresInDays: req.body?.expiresInDays ? Number(req.body.expiresInDays) : 7,
  });

  res.status(201).json(link);
}));

/* ── List my links ──────────────────────────────────────────── */
router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const links = getLinks(req.userId!);
  res.json(links);
}));

/* ── Get link info ──────────────────────────────────────────── */
router.get('/:id', asyncHandler(async (req, res) => {
  const link = getLinkById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  recordView(link.id);
  res.json(link);
}));

/* ── Download file from link ────────────────────────────────── */
router.get('/:id/download', asyncHandler(async (req, res) => {
  const link = getLinkById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (!link.active) return res.status(410).json({ error: 'Link has been revoked' });
  if (link.expiresAt < new Date()) return res.status(410).json({ error: 'Link has expired' });

  // Check password if set
  if (link.password && req.query.password !== link.password) {
    return res.status(403).json({ error: 'Password required or incorrect' });
  }

  if (!fs.existsSync(link.storagePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }

  recordDownload(link.id);
  res.download(link.storagePath, link.fileName);
}));

/* ── Revoke link ────────────────────────────────────────────── */
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const link = revokeLink(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  res.json(link);
}));

export default router;
