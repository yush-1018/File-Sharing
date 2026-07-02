import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { users, newId } from '../store/memory.js';
import type { User } from '../store/memory.js';

export function issueToken(userId: string) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });
}

export async function registerWithEmail(input: { email: string; password: string; name: string }) {
  // Check duplicate
  for (const u of users.values()) {
    if (u.email === input.email) throw Object.assign(new Error('Email already registered'), { status: 409 });
  }
  const id = newId();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user: User = { id, email: input.email, name: input.name, passwordHash, guest: false, createdAt: new Date() };
  users.set(id, user);
  return { token: issueToken(id), user: { id, name: user.name, email: user.email, guest: false } };
}

export async function loginWithEmail(input: { email: string; password: string }) {
  let found: User | undefined;
  for (const u of users.values()) {
    if (u.email === input.email) { found = u; break; }
  }
  if (!found?.passwordHash) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  const ok = await bcrypt.compare(input.password, found.passwordHash);
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  return { token: issueToken(found.id), user: { id: found.id, name: found.name, email: found.email, guest: false } };
}

export function createGuestUser(name?: string) {
  const id = newId();
  const guestName = name || `Guest-${id.slice(0, 6)}`;
  const user: User = { id, name: guestName, guest: true, createdAt: new Date() };
  users.set(id, user);
  return { token: issueToken(id), user: { id, name: guestName, guest: true } };
}

export function getUser(userId: string) {
  const u = users.get(userId);
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, guest: u.guest };
}
