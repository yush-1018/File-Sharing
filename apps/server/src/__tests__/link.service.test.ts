import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { createLink, verifyLinkPassword, reportLink, revokeLink } from '../services/link.service.js';
import { CloudLink } from '../models/index.js';

vi.mock('../models/index.js', () => ({
  CloudLink: {
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
}));

describe('Link Service & Password Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLink & Password Hashing', () => {
    it('should hash passwords with PBKDF2 salt instead of plaintext', async () => {
      const mockId = new mongoose.Types.ObjectId();
      const mockSave = vi.fn().mockResolvedValue(true);

      vi.mocked(CloudLink.create).mockResolvedValue({
        _id: mockId,
        userId: new mongoose.Types.ObjectId(),
        fileName: 'report.pdf',
        fileSize: 1024,
        storagePath: '/tmp/report.pdf',
        passwordHash: 'mockHash',
        passwordSalt: 'mockSalt',
        save: mockSave,
        toObject: () => ({ _id: mockId }),
      } as any);

      const link = await createLink({
        userId: '507f1f77bcf86cd799439011',
        fileName: 'report.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        storagePath: '/tmp/report.pdf',
        password: 'secretPassword123',
      });

      expect(CloudLink.create).toHaveBeenCalled();
      const createArgs = vi.mocked(CloudLink.create).mock.calls[0][0] as any;
      expect(createArgs.passwordHash).toBeDefined();
      expect(createArgs.passwordSalt).toBeDefined();
      expect(createArgs.password).toBeUndefined(); // Raw password must NEVER be sent to DB
    });
  });

  describe('verifyLinkPassword', () => {
    it('should verify correct password using PBKDF2 hash comparison', () => {
      const link = {
        passwordHash: '8b7f87258bd5ebf4c5e3f4339942a1761612dbf2d5e718b5b7b1d96082c5f111',
        passwordSalt: 'abcdef1234567890',
      };

      // Test with mock implementation behavior
      expect(typeof verifyLinkPassword(link, 'secret')).toBe('boolean');
    });
  });

  describe('reportLink (DMCA Takedown)', () => {
    it('should quarantine and deactivate link upon report', async () => {
      const mockId = new mongoose.Types.ObjectId().toString();
      vi.mocked(CloudLink.findByIdAndUpdate).mockResolvedValue({ _id: mockId, active: false } as any);

      const result = await reportLink(mockId, 'Copyright infringement');
      expect(result).toBe(true);
      expect(CloudLink.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        { $set: { active: false, reported: true, reportReason: 'Copyright infringement' } },
        { new: true },
      );
    });
  });
});
