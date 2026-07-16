import Redis from 'ioredis';
import { env } from './env.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    throw new Error('[Redis] Not connected. Call connectRedis() first.');
  }
  return redis;
}

export async function connectRedis(): Promise<Redis> {
  if (redis) return redis;

  return new Promise((resolve, reject) => {
    const client = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          console.error('[Redis] Max retries reached, giving up');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: false,
    });

    client.on('connect', () => {
      console.log('[Redis] Connected successfully');
      redis = client;
      resolve(client);
    });

    client.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
      if (!redis) reject(err);
    });

    client.on('close', () => {
      console.warn('[Redis] Connection closed');
    });
  });
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[Redis] Disconnected gracefully');
  }
}

/* ── Convenience helpers ────────────────────────────────────── */

/** Store a resume token with TTL (default 24 hours) */
export async function setResumeToken(transferId: string, token: string, ttlSeconds = 86400): Promise<void> {
  const r = getRedis();
  await r.set(`resume:${transferId}`, token, 'EX', ttlSeconds);
}

/** Retrieve a resume token */
export async function getResumeToken(transferId: string): Promise<string | null> {
  const r = getRedis();
  return r.get(`resume:${transferId}`);
}

/** Track chunked upload progress as a bitmap */
export async function markChunkReceived(transferId: string, chunkIndex: number): Promise<void> {
  const r = getRedis();
  await r.setbit(`chunks:${transferId}`, chunkIndex, 1);
}

/** Check which chunks have been received */
export async function getChunkBitmap(transferId: string, totalChunks: number): Promise<boolean[]> {
  const r = getRedis();
  const result: boolean[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const bit = await r.getbit(`chunks:${transferId}`, i);
    result.push(bit === 1);
  }
  return result;
}

/** Cache a value with TTL */
export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  const r = getRedis();
  await r.set(`cache:${key}`, value, 'EX', ttlSeconds);
}

/** Retrieve a cached value */
export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis();
  return r.get(`cache:${key}`);
}
