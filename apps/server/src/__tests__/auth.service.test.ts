import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { registerWithEmail, loginWithEmail, createGuestUser } from '../services/auth.service.js';
import { User } from '../models/index.js';

vi.mock('../models/index.js', () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerWithEmail', () => {
    it('should register a new user successfully', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(User.create).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        guest: false,
      } as any);

      const result = await registerWithEmail({ email: 'test@example.com', password: 'password123', name: 'Test User' });
      expect(result.token).toBeDefined();
      expect(result.user.name).toBe('Test User');
    });

    it('should throw if email already exists', async () => {
      vi.mocked(User.findOne).mockResolvedValue({ _id: '123' } as any);
      await expect(registerWithEmail({ email: 'test@example.com', password: 'password123', name: 'Test User' }))
        .rejects.toThrow('Email already registered');
    });
  });

  describe('createGuestUser', () => {
    it('should create a guest user', async () => {
      vi.mocked(User.create).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'Guest User',
        guest: true,
      } as any);

      const result = await createGuestUser('Guest User');
      expect(result.token).toBeDefined();
      expect(result.user.guest).toBe(true);
    });
  });
});
