import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { users } from '../store/memory.js';

export interface AuthRequest extends Request {
  userId?: string;
  userName?: string;
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    // Allow unauthenticated — routes decide if they need auth
    return next();
  }

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    const user = users.get(payload.sub);
    if (user) req.userName = user.name;
  } catch {
    // invalid token — treat as unauthenticated
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
