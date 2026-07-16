import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Device } from '../models/index.js';
import * as discoveryService from '../services/discovery.service.js';

vi.mock('../models/index.js', () => {
  return {
    Device: {
      findOneAndUpdate: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
      updateMany: vi.fn(),
    },
  };
});

describe('Discovery Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('announceDevice', () => {
    it('should calculate realistic speed based on latency', async () => {
      const mockDevice = {
        _id: 'device-id',
        name: 'Test Mac',
        platform: 'macOS',
        deviceType: 'desktop',
        quality: 0.98,
        speedMbps: 784, // 0.98 * 800
        distance: 'Same network',
        online: true,
      };

      vi.mocked(Device.create).mockResolvedValueOnce(mockDevice as any);

      const result = await discoveryService.announceDevice({
        name: 'Test Mac',
        platform: 'macOS',
        deviceType: 'desktop',
        ipAddress: '192.168.1.5',
        latencyMs: 2, // low latency = high quality
      });

      expect(result.quality).toBe(0.98);
      expect(result.speedMbps).toBe(784);
      expect(Device.create).toHaveBeenCalledWith(expect.objectContaining({
        subnet: '192.168.1',
        quality: 0.98,
      }));
    });
  });

  describe('getNearbyDevices', () => {
    it('should compute distance based on subnet', async () => {
      const mockDevices = [
        { _id: '1', name: 'Dev 1', subnet: '192.168.1', online: true },
        { _id: '2', name: 'Dev 2', subnet: '192.168.2', online: true }, // different subnet
        { _id: '3', name: 'Dev 3', subnet: '10.0.0.1', online: true },
      ];

      vi.mocked(Device.find).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(mockDevices)
      } as any);

      const result = await discoveryService.getNearbyDevices('192.168.1');
      
      expect(result[0].distance).toBe('Same network');
      expect(result[1].distance).toBe('Same building');
      expect(result[2].distance).toBe('Remote');
    });
  });
});
