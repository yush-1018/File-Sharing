import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`[MongoDB] Connecting (attempt ${attempt}/${maxRetries})...`);

      await mongoose.connect(env.mongodbUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      isConnected = true;
      console.log('[MongoDB] Connected successfully');

      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Disconnected');
        isConnected = false;
      });

      return;
    } catch (err) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed:`, (err as Error).message);
      if (attempt >= maxRetries) {
        throw new Error(`[MongoDB] Failed to connect after ${maxRetries} attempts`);
      }
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected gracefully');
}
