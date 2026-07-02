import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'node:path';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { chooseTransferMethod, createTransfer, getTransfersByUser, getTransferById, updateTransferStatus, updateTransferProgress, } from '../services/transfer.service.js';
const router = Router();
/* ── Multer for file uploads ────────────────────────────────── */
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, env.uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 * 1024 } }); // 10GB limit
/* ── Plan best method ───────────────────────────────────────── */
router.post('/plan', asyncHandler(async (req, res) => {
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
router.post('/', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
    }
    const transfer = createTransfer({
        senderUserId: req.userId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        storagePath: req.file.path,
        peer: req.body?.peer || 'Cloud',
    });
    res.status(201).json(transfer);
}));
/* ── List my transfers ──────────────────────────────────────── */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const list = getTransfersByUser(req.userId);
    res.json(list);
}));
/* ── Get one transfer ───────────────────────────────────────── */
router.get('/:id', asyncHandler(async (req, res) => {
    const t = getTransferById(req.params.id);
    if (!t)
        return res.status(404).json({ error: 'Transfer not found' });
    res.json(t);
}));
/* ── Update progress ────────────────────────────────────────── */
router.patch('/:id/progress', asyncHandler(async (req, res) => {
    const schema = z.object({ transferredBytes: z.number(), speed: z.string().optional() });
    const body = schema.parse(req.body);
    const t = updateTransferProgress(req.params.id, body.transferredBytes, body.speed);
    if (!t)
        return res.status(404).json({ error: 'Transfer not found' });
    res.json(t);
}));
/* ── Pause / Resume / Cancel ────────────────────────────────── */
router.post('/:id/pause', asyncHandler(async (req, res) => {
    const t = updateTransferStatus(req.params.id, 'paused');
    if (!t)
        return res.status(404).json({ error: 'Transfer not found' });
    res.json(t);
}));
router.post('/:id/resume', asyncHandler(async (req, res) => {
    const t = updateTransferStatus(req.params.id, 'in_progress');
    if (!t)
        return res.status(404).json({ error: 'Transfer not found' });
    res.json(t);
}));
router.post('/:id/cancel', asyncHandler(async (req, res) => {
    const t = updateTransferStatus(req.params.id, 'cancelled');
    if (!t)
        return res.status(404).json({ error: 'Transfer not found' });
    res.json(t);
}));
export default router;
