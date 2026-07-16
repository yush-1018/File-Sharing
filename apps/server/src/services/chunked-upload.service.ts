import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { Transfer } from '../models/index.js';
import { markChunkReceived, getChunkBitmap } from '../config/redis.js';
import { uploadToS3, generateS3Key } from './storage.service.js';

const CHUNKS_DIR = path.join(env.uploadDir, 'chunks');

/** Ensure the chunks directory exists */
function ensureChunksDir(transferId: string): string {
  const dir = path.join(CHUNKS_DIR, transferId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** Initialize a chunked upload session */
export async function initiateChunkedUpload(
  transferId: string,
  totalChunks: number,
  chunkSize: number,
): Promise<{ transferId: string; totalChunks: number; chunkSize: number }> {
  // Update transfer with chunk metadata
  await Transfer.findByIdAndUpdate(transferId, {
    $set: {
      totalChunks,
      chunkSize,
      status: 'uploading',
    },
  });

  ensureChunksDir(transferId);

  return { transferId, totalChunks, chunkSize };
}

/** Write a single chunk to disk and mark it in Redis */
export async function uploadChunk(
  transferId: string,
  chunkIndex: number,
  data: Buffer,
): Promise<{ chunkIndex: number; received: boolean }> {
  const dir = ensureChunksDir(transferId);
  const chunkPath = path.join(dir, `chunk-${chunkIndex.toString().padStart(6, '0')}`);

  fs.writeFileSync(chunkPath, data);

  // Mark in Redis
  try {
    await markChunkReceived(transferId, chunkIndex);
  } catch {
    // Redis unavailable — file on disk is the source of truth
  }

  // Update transfer progress
  const transfer = await Transfer.findById(transferId);
  if (transfer && transfer.totalChunks) {
    const chunkSizeBytes = transfer.chunkSize || data.length;
    transfer.transferredBytes = Math.min(
      (chunkIndex + 1) * chunkSizeBytes,
      transfer.fileSize,
    );
    transfer.progress = Math.round((transfer.transferredBytes / transfer.fileSize) * 100);
    transfer.status = 'uploading';
    await transfer.save();
  }

  return { chunkIndex, received: true };
}

/** Get the status of which chunks have been received */
export async function getChunksStatus(
  transferId: string,
  totalChunks: number,
): Promise<{ received: boolean[]; complete: number; total: number }> {
  let received: boolean[];

  try {
    received = await getChunkBitmap(transferId, totalChunks);
  } catch {
    // Fallback: check filesystem
    const dir = path.join(CHUNKS_DIR, transferId);
    received = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(dir, `chunk-${i.toString().padStart(6, '0')}`);
      received.push(fs.existsSync(chunkPath));
    }
  }

  return {
    received,
    complete: received.filter(Boolean).length,
    total: totalChunks,
  };
}

/** Merge all chunks into a single file and upload to S3 */
export async function finalizeUpload(
  transferId: string,
): Promise<Record<string, any>> {
  const transfer = await Transfer.findById(transferId);
  if (!transfer) throw new Error('Transfer not found');

  const dir = path.join(CHUNKS_DIR, transferId);
  const totalChunks = transfer.totalChunks || 0;

  // Verify all chunks exist
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(dir, `chunk-${i.toString().padStart(6, '0')}`);
    if (!fs.existsSync(chunkPath)) {
      throw Object.assign(new Error(`Missing chunk ${i}`), { status: 400 });
    }
  }

  // Merge chunks into a single file
  const mergedPath = path.join(env.uploadDir, `merged-${transferId}${path.extname(transfer.fileName)}`);
  const output = fs.createWriteStream(mergedPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(dir, `chunk-${i.toString().padStart(6, '0')}`);
    const chunkData = fs.readFileSync(chunkPath);
    output.write(chunkData);
  }

  await new Promise<void>((resolve, reject) => {
    output.end(() => resolve());
    output.on('error', reject);
  });

  // Upload merged file to S3
  const s3Key = generateS3Key(transfer.fileName);
  try {
    await uploadToS3(mergedPath, s3Key, transfer.mimeType);
    transfer.s3Key = s3Key;
  } catch (err) {
    console.warn('[ChunkedUpload] S3 upload failed, keeping local file:', (err as Error).message);
    transfer.storagePath = mergedPath;
  }

  // Update transfer as completed
  transfer.status = 'completed';
  transfer.progress = 100;
  transfer.transferredBytes = transfer.fileSize;
  transfer.speed = '—';
  transfer.eta = '—';
  await transfer.save();

  // Cleanup chunks directory
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }

  return {
    id: transfer._id.toString(),
    status: transfer.status,
    progress: transfer.progress,
    s3Key: transfer.s3Key,
  };
}
