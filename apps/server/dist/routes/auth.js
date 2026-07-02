import { Router } from 'express';
import { z } from 'zod';
import { registerWithEmail, loginWithEmail, createGuestUser, getUser } from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
const router = Router();
router.post('/register', asyncHandler(async (req, res) => {
    const schema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(2) });
    const result = await registerWithEmail(schema.parse(req.body));
    res.status(201).json(result);
}));
router.post('/login', asyncHandler(async (req, res) => {
    const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
    const result = await loginWithEmail(schema.parse(req.body));
    res.json(result);
}));
router.post('/guest', asyncHandler(async (req, res) => {
    const name = req.body?.name;
    const result = createGuestUser(name);
    res.status(201).json(result);
}));
router.get('/me', asyncHandler(async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: 'Not authenticated' });
    const user = getUser(req.userId);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    res.json({ user });
}));
export default router;
