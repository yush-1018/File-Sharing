import { describe, it, expect } from 'vitest';
import {
  generateEncryptionKey,
  encryptBuffer,
  decryptBuffer,
  deriveKeyFromPassword,
  keyToHex,
  hexToKey,
} from '../services/encryption.service.js';

describe('Encryption Service', () => {
  it('should generate a 32-byte key', () => {
    const key = generateEncryptionKey();
    expect(key.length).toBe(32);
  });

  it('should encrypt and decrypt a buffer correctly using AES-256-GCM', () => {
    const key = generateEncryptionKey();
    const originalText = 'Super Secret File Content 123!';
    const buffer = Buffer.from(originalText);

    const { encrypted, iv, authTag } = encryptBuffer(buffer, key);
    expect(encrypted).toBeDefined();
    expect(iv).toHaveLength(32); // 16 bytes hex

    const decrypted = decryptBuffer(encrypted, key, iv, authTag);
    expect(decrypted.toString()).toBe(originalText);
  });

  it('should derive consistent keys from password and salt via PBKDF2', () => {
    const password = 'mySecurePassword123';
    const { key: key1, salt } = deriveKeyFromPassword(password);
    const { key: key2 } = deriveKeyFromPassword(password, salt);

    expect(key1.toString('hex')).toBe(key2.toString('hex'));
  });

  it('should convert key to hex and back', () => {
    const key = generateEncryptionKey();
    const hex = keyToHex(key);
    const restoredKey = hexToKey(hex);
    expect(restoredKey).toEqual(key);
  });
});
