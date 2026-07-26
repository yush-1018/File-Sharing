import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { z } from 'zod';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { createLink, getLinks, getLinkById, revokeLink, recordView, recordDownload, reportLink, verifyLinkPassword } from '../services/link.service.js';
import { uploadToS3, downloadFromS3, generateS3Key } from '../services/storage.service.js';
import { scanFile } from '../services/scan.service.js';
import { deriveKeyFromPassword, encryptFile, decryptFile } from '../services/encryption.service.js';
import { downloadLimiter } from '../middleware/rateLimiter.js';

import { sharedMulterUpload } from '../utils/upload.js';

const router = Router();

/* ── Create cloud link (upload file) ────────────────────────── */
router.post('/', requireAuth, sharedMulterUpload.single('file'), asyncHandler(async (req: AuthRequest, res) => {
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

  // Server-side encryption at rest / password key derivation
  let finalPath = req.file.path;
  let encMetadata: { iv?: string; authTag?: string; salt?: string } = {};

  if (req.body?.password) {
    const { key, salt } = deriveKeyFromPassword(req.body.password);
    const encPath = `${req.file.path}.enc`;
    const { iv, authTag } = await encryptFile(req.file.path, encPath, key);
    // Remove unencrypted local temp file
    const fs = await import('node:fs');
    try { fs.unlinkSync(req.file.path); } catch {}
    finalPath = encPath;
    encMetadata = { iv, authTag, salt };
  }

  // Upload to S3
  let s3Key: string | undefined;
  try {
    const key = generateS3Key(req.file.originalname, 'links');
    await uploadToS3(finalPath, key, req.file.mimetype);
    s3Key = key;
  } catch (err) {
    console.warn('[Links] S3 upload failed, keeping local file:', (err as Error).message);
  }

  const link = await createLink({
    userId: req.userId!,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    storagePath: finalPath,
    s3Key,
    password: req.body?.password,
    expiresInDays: req.body?.expiresInDays ? Number(req.body.expiresInDays) : 7,
    ...encMetadata,
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
  // Don't expose passwordHash, passwordSalt, or storagePath to public
  const { passwordHash, passwordSalt, storagePath, s3Key, iv, authTag, ...publicLink } = link;
  res.json({ ...publicLink, hasPassword: !!passwordHash });
}));

/* ── Download file from link (public with optional password) ── */
router.get('/:id/download', downloadLimiter, asyncHandler(async (req, res) => {
  const link = await getLinkById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (!link.active) return res.status(410).json({ error: 'Link has been revoked' });
  if (new Date(link.expiresAt) < new Date()) return res.status(410).json({ error: 'Link has expired' });

  // Read password from header or query string (header preferred to prevent URL logging)
  const providedPassword = (req.headers['x-link-password'] as string) || (req.query.password as string);

  // Check password if set using salted PBKDF2 hash verification
  if (link.hasPassword && !verifyLinkPassword(link, providedPassword)) {
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

  // Decrypt on-the-fly if file was encrypted at rest with password
  if (link.iv && link.authTag && providedPassword) {
    const tempDecryptedPath = `${link.storagePath}.tmp.dec`;
    try {
      const { key } = deriveKeyFromPassword(providedPassword, link.passwordSalt);
      await decryptFile(link.storagePath, tempDecryptedPath, key, link.iv, link.authTag);
      return res.download(tempDecryptedPath, link.fileName, { headers: { 'Content-Type': 'application/octet-stream' } }, () => {
        try { fs.unlinkSync(tempDecryptedPath); } catch {}
      });
    } catch (err) {
      try { fs.unlinkSync(tempDecryptedPath); } catch {}
      return res.status(500).json({ error: 'Decryption failed' });
    }
  }

  res.download(link.storagePath, link.fileName, { headers: { 'Content-Type': 'application/octet-stream' } });
}));

/* ── Revoke link (requires auth + ownership) ────────────────── */
router.delete('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const linkId = req.params.id as string;
  const link = await getLinkById(linkId);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (link.userId !== req.userId) return res.status(403).json({ error: 'Access denied' });

  const revoked = await revokeLink(linkId);
  if (!revoked) return res.status(404).json({ error: 'Link not found' });
  res.json(revoked);
}));

/* ── DMCA / Abuse Report Takedown (Public) ───────────────────── */
router.post('/:id/report', asyncHandler(async (req, res) => {
  const linkId = req.params.id as string;
  const reason = req.body?.reason || 'DMCA / Copyright Infringement or Abuse';
  const success = await reportLink(linkId, reason);
  if (!success) return res.status(404).json({ error: 'Link not found' });
  res.json({ success: true, message: 'Link reported and quarantined for review.' });
}));

export default router;
