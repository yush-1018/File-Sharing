import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getNearbyDevices, announceDevice } from '../services/discovery.service.js';
const router = Router();
/* ── List nearby devices ────────────────────────────────────── */
router.get('/nearby', asyncHandler(async (_req, res) => {
    const list = getNearbyDevices();
    res.json(list);
}));
/* ── Announce this device ───────────────────────────────────── */
router.post('/announce', asyncHandler(async (req, res) => {
    const device = announceDevice({
        userId: req.userId,
        name: req.body.name || 'Unknown Device',
        platform: req.body.platform || 'Unknown',
        deviceType: req.body.deviceType || 'desktop',
    });
    res.status(201).json(device);
}));
export default router;
