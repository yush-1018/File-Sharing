import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

/* ── S3 Client ──────────────────────────────────────────────── */
const s3 = new S3Client({
  endpoint: env.s3Endpoint,
  region: env.s3Region,
  credentials: {
    accessKeyId: env.s3AccessKey,
    secretAccessKey: env.s3SecretKey,
  },
  forcePathStyle: true, // Required for MinIO
});

/* ── Ensure bucket exists ───────────────────────────────────── */
export async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.s3Bucket }));
    console.log(`[S3] Bucket '${env.s3Bucket}' exists`);
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404 || err.name === 'NoSuchBucket') {
      console.log(`[S3] Creating bucket '${env.s3Bucket}'...`);
      await s3.send(new CreateBucketCommand({ Bucket: env.s3Bucket }));
      console.log(`[S3] Bucket '${env.s3Bucket}' created`);
    } else {
      console.warn(`[S3] Could not verify bucket: ${err.message}`);
    }
  }
}

/* ── Upload file to S3 ──────────────────────────────────────── */
export async function uploadToS3(
  localPath: string,
  key: string,
  mimeType = 'application/octet-stream',
  onProgress?: (loaded: number, total: number) => void,
): Promise<{ key: string; bucket: string }> {
  const fileStream = fs.createReadStream(localPath);
  const fileSize = fs.statSync(localPath).size;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: env.s3Bucket,
      Key: key,
      Body: fileStream,
      ContentType: mimeType,
    },
    queueSize: 4,
    partSize: 8 * 1024 * 1024, // 8 MB parts
    leavePartsOnError: false,
  });

  upload.on('httpUploadProgress', (progress) => {
    if (onProgress && progress.loaded) {
      onProgress(progress.loaded, fileSize);
    }
  });

  await upload.done();

  // Clean up local temp file
  try {
    fs.unlinkSync(localPath);
  } catch {
    // Ignore cleanup errors
  }

  return { key, bucket: env.s3Bucket };
}

/* ── Download file from S3 (returns a readable stream) ──────── */
export async function downloadFromS3(key: string): Promise<{
  stream: NodeJS.ReadableStream;
  contentLength: number;
  contentType: string;
}> {
  const response = await s3.send(new GetObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
  }));

  return {
    stream: response.Body as NodeJS.ReadableStream,
    contentLength: response.ContentLength || 0,
    contentType: response.ContentType || 'application/octet-stream',
  };
}

/* ── Delete file from S3 ────────────────────────────────────── */
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
  }));
}

/* ── Generate an S3 key from filename ───────────────────────── */
export function generateS3Key(fileName: string, prefix = 'uploads'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${prefix}/${timestamp}-${random}-${baseName}${ext}`;
}
