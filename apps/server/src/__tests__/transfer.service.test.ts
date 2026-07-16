import { describe, it, expect } from 'vitest';
import { chooseTransferMethod } from '../services/transfer.service.js';

describe('Transfer Service', () => {
  describe('chooseTransferMethod', () => {
    it('should prefer local when sameLan is true', () => {
      const method = chooseTransferMethod({ sameLan: true });
      expect(method).toBe('local');
    });

    it('should prefer local when hotspot is reachable', () => {
      const method = chooseTransferMethod({ hotspotReachable: true });
      expect(method).toBe('local');
    });

    it('should prefer webrtc when online remote and file is reasonable size', () => {
      const method = chooseTransferMethod({ onlineRemote: true, estimatedBytes: 100 * 1024 * 1024 });
      expect(method).toBe('webrtc');
    });

    it('should prefer bluetooth when available and file is small enough', () => {
      const method = chooseTransferMethod({ bluetoothAvailable: true, estimatedBytes: 50 * 1024 * 1024, onlineRemote: false });
      expect(method).toBe('bluetooth');
    });

    it('should fallback to cloud otherwise', () => {
      const method = chooseTransferMethod({});
      expect(method).toBe('cloud');
    });
  });
});
