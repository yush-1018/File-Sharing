/**
 * Client-side AES-256-GCM encryption using the Web Crypto API.
 * Used for E2E encryption of file transfers.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM

/** Generate a new AES-256-GCM key */
export async function generateFileKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt'],
  );
}

/** Export a CryptoKey to raw hex string for sharing */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufferToHex(raw);
}

/** Import a raw hex key string back to CryptoKey */
export async function importKey(hexKey: string): Promise<CryptoKey> {
  const raw = hexToBuffer(hexKey);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt a file, returning encrypted blob + IV */
export async function encryptFile(
  file: File,
  key: CryptoKey,
): Promise<{ encrypted: Blob; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const data = await file.arrayBuffer();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data,
  );

  return {
    encrypted: new Blob([encrypted], { type: 'application/octet-stream' }),
    iv: bufferToHex(iv.buffer),
  };
}

/** Decrypt an encrypted blob back to a File */
export async function decryptFile(
  encryptedBlob: Blob,
  key: CryptoKey,
  ivHex: string,
  originalName: string,
  originalType: string,
): Promise<File> {
  const iv = hexToBuffer(ivHex);
  const data = await encryptedBlob.arrayBuffer();

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data,
  );

  return new File([decrypted], originalName, { type: originalType });
}

/** Encrypt an ArrayBuffer chunk (for WebRTC streaming) */
export async function encryptChunk(
  data: ArrayBuffer,
  key: CryptoKey,
): Promise<{ encrypted: ArrayBuffer; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data,
  );

  return {
    encrypted,
    iv: bufferToHex(iv.buffer),
  };
}

/** Decrypt an encrypted ArrayBuffer chunk */
export async function decryptChunk(
  encrypted: ArrayBuffer,
  key: CryptoKey,
  ivHex: string,
): Promise<ArrayBuffer> {
  const iv = hexToBuffer(ivHex);

  return crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encrypted,
  );
}

/* ── Utility functions ──────────────────────────────────────── */

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}
