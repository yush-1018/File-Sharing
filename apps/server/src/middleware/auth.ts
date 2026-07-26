import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { cacheGet, cacheSet } from '../config/redis.js';

export interface AuthRequest extends Request {
  userId?: string;
  userName?: string;
}

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as { sub: string };
    req.userId = payload.sub;

    try {
      const cached = await cacheGet(`user:${payload.sub}`);
      if (cached) {
        req.userName = cached;
      } else {
        const user = await User.findById(payload.sub).lean();
        if (user) {
          req.userName = user.name;
          await cacheSet(`user:${payload.sub}`, user.name, 600);
        }
      }
    } catch {
      // Redis/DB unavailable — proceed with userId
    }
  } catch {
    // Invalid token — proceed as unauthenticated
  }

  return next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Middleware factory to check resource ownership.
 * Must be used after requireAuth.
 */
export function requireOwnership(getResourceUserId: (req: AuthRequest) => Promise<string | null>) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const resourceUserId = await getResourceUserId(req);
      if (!resourceUserId) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      if (resourceUserId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    } catch {
      return res.status(500).json({ error: 'Ownership check failed' });
    }
  };
}
