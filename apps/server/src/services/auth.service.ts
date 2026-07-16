import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, type IUser } from '../models/index.js';

export function issueToken(userId: string) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });
}

export async function registerWithEmail(input: { email: string; password: string; name: string }) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { status: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    email: input.email,
    name: input.name,
    passwordHash,
    guest: false,
  });

  return {
    token: issueToken(user._id.toString()),
    user: { id: user._id.toString(), name: user.name, email: user.email, guest: false },
  };
}

export async function loginWithEmail(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email });
  if (!user?.passwordHash) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  return {
    token: issueToken(user._id.toString()),
    user: { id: user._id.toString(), name: user.name, email: user.email, guest: false },
  };
}

export async function createGuestUser(name?: string) {
  const guestName = name || `Guest-${Math.random().toString(36).slice(2, 8)}`;
  const user = await User.create({
    name: guestName,
    guest: true,
  });

  return {
    token: issueToken(user._id.toString()),
    user: { id: user._id.toString(), name: guestName, guest: true },
  };
}

export async function getUser(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) return null;
  return { id: user._id.toString(), name: user.name, email: user.email, guest: user.guest };
}
