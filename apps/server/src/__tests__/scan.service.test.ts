import { describe, it, expect } from 'vitest';
import { scanFile } from '../services/scan.service.js';

describe('Malware Scan Service (Fail-Closed)', () => {
  it('should fail closed in production environment when ClamAV scanner is unavailable', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const result = await scanFile('/non/existent/file.exe');
      expect(result.clean).toBe(false);
      expect(result.scanner).toBe('none');
      expect(result.threat).toBeDefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should return scanner status in non-production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const result = await scanFile('/non/existent/file.txt');
      expect(result.scanner).toBeDefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
