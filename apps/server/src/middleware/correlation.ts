import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

export function correlationMiddleware(req: CorrelatedRequest, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) || (req.headers['x-transfer-id'] as string) || randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
}

export function logEvent(correlationId: string | undefined, event: string, details?: Record<string, any>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    correlationId: correlationId || 'system',
    event,
    ...details,
  }));
}
