import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { getNearbyDevices, announceDevice } from '../services/discovery.service.js';

const router = Router();

/* ── List nearby devices ────────────────────────────────────── */
router.get('/nearby', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  // Extract requestor's subnet from IP for relative distance calculation
  const ip = req.ip || req.socket.remoteAddress || '';
  const subnet = extractSubnet(ip);
  const list = await getNearbyDevices(subnet);
  res.json(list);
}));

/* ── Announce this device ───────────────────────────────────── */
router.post('/announce', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const ip = req.ip || req.socket.remoteAddress || '';
  const device = await announceDevice({
    userId: req.userId,
    name: req.body.name || 'Unknown Device',
    platform: req.body.platform || 'Unknown',
    deviceType: req.body.deviceType || 'desktop',
    ipAddress: ip,
  });
  res.status(201).json(device);
}));

function extractSubnet(ip: string): string {
  const cleaned = ip.replace(/^::ffff:/, '');
  const parts = cleaned.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  return 'unknown';
}

export default router;
