import crypto from 'node:crypto';
import fs from 'node:fs';
import { Transform, pipeline } from 'node:stream';
import { promisify } from 'node:util';

const pipelineAsync = promisify(pipeline);

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits for GCM
const AUTH_TAG_LENGTH = 16;

/* ── Key generation ─────────────────────────────────────────── */
export function generateEncryptionKey(): Buffer {
  return crypto.randomBytes(KEY_LENGTH);
}

export function generateIV(): Buffer {
  return crypto.randomBytes(IV_LENGTH);
}

/* ── File encryption (streaming) ────────────────────────────── */
export async function encryptFile(
  inputPath: string,
  outputPath: string,
  key: Buffer,
): Promise<{ iv: string; authTag: string }> {
  const iv = generateIV();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  await pipelineAsync(input, cipher, output);

  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/* ── File decryption (streaming) ────────────────────────────── */
export async function decryptFile(
  inputPath: string,
  outputPath: string,
  key: Buffer,
  ivHex: string,
  authTagHex: string,
): Promise<void> {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  await pipelineAsync(input, decipher, output);
}

/* ── In-memory buffer encryption ────────────────────────────── */
export function encryptBuffer(data: Buffer, key: Buffer): { encrypted: Buffer; iv: string; authTag: string } {
  const iv = generateIV();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptBuffer(encrypted: Buffer, key: Buffer, ivHex: string, authTagHex: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/* ── Key encoding/decoding helpers ──────────────────────────── */
export function keyToHex(key: Buffer): string {
  return key.toString('hex');
}

export function hexToKey(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

/* ── Derive a key from password (for password-protected links) */
export function deriveKeyFromPassword(password: string, salt?: string): { key: Buffer; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const key = crypto.pbkdf2Sync(password, actualSalt, 100000, KEY_LENGTH, 'sha256');
  return { key, salt: actualSalt };
}
