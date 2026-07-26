import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { createFolder, getFolders, deleteFolder } from '../services/folder.service.js';

const router = Router();

router.post('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1),
    parentId: z.string().optional(),
    color: z.string().optional(),
  });
  const body = schema.parse(req.body);
  const folder = await createFolder({
    userId: req.userId!,
    name: body.name,
    parentId: body.parentId,
    color: body.color,
  });
  res.status(201).json(folder);
}));

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const parentId = req.query.parentId as string | undefined;
  const folders = await getFolders(req.userId!, parentId);
  res.json(folders);
}));

router.delete('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const deleted = await deleteFolder(req.params.id as string, req.userId!);
  if (!deleted) return res.status(404).json({ error: 'Folder not found or access denied' });
  res.json({ success: true });
}));

export default router;
