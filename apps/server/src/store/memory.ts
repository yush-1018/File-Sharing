/**
 * In-memory data store — replaces MongoDB for zero-dependency dev.
 * All data lives in Maps; resets on server restart.
 */
import { randomUUID } from 'node:crypto';

/* ── Types ──────────────────────────────────────────────────── */
export interface User {
  id: string;
  email?: string;
  name: string;
  passwordHash?: string;
  guest: boolean;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Device {
  id: string;
  userId?: string;
  name: string;
  platform: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  quality: number;
  speedMbps: number;
  distance: string;
  online: boolean;
  socketId?: string;
  lastSeenAt: Date;
}

export interface Transfer {
  id: string;
  senderUserId: string;
  receiverUserId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
  transferMethod: string;
  status: 'pending' | 'uploading' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  transferredBytes: number;
  speed: string;
  eta: string;
  direction: 'upload' | 'download';
  peer: string;
  resumeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRoom {
  id: string;
  name: string;
  avatar: string;
  color: string;
  memberIds: string[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderUserId: string;
  senderName: string;
  text: string;
  type: 'text' | 'system' | 'file';
  attachment?: { fileName: string; fileSize: number; transferId: string };
  createdAt: Date;
}

export interface CloudLink {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  url: string;
  password?: string;
  downloads: number;
  views: number;
  active: boolean;
  expiresAt: Date;
  createdAt: Date;
}

/* ── Collections ────────────────────────────────────────────── */
export const users      = new Map<string, User>();
export const devices    = new Map<string, Device>();
export const transfers  = new Map<string, Transfer>();
export const chatRooms  = new Map<string, ChatRoom>();
export const chatMessages: ChatMessage[] = [];
export const cloudLinks = new Map<string, CloudLink>();

/* ── Helper: generate IDs ──────────────────────────────────── */
export function newId(): string {
  return randomUUID();
}

/* ── Seed default chat rooms ────────────────────────────────── */
const defaultRooms: ChatRoom[] = [
  { id: 'general',  name: 'General',     avatar: 'G',  color: '#4cc9f0', memberIds: [], createdAt: new Date() },
  { id: 'team',     name: 'Team Design', avatar: 'TD', color: '#80ffdb', memberIds: [], createdAt: new Date() },
  { id: 'random',   name: 'Random',      avatar: 'R',  color: '#ffd166', memberIds: [], createdAt: new Date() },
];
defaultRooms.forEach((r) => chatRooms.set(r.id, r));

/* ── Seed some nearby devices for demo feel ─────────────────── */
const seedDevices: Device[] = [
  { id: 'seed-1', name: 'Ava\'s MacBook Pro', platform: 'macOS',   deviceType: 'desktop', quality: 0.95, speedMbps: 680, distance: 'Same room',  online: true,  lastSeenAt: new Date() },
  { id: 'seed-2', name: 'Kai\'s Pixel 9',     platform: 'Android', deviceType: 'mobile',  quality: 0.78, speedMbps: 145, distance: 'Same floor', online: true,  lastSeenAt: new Date() },
  { id: 'seed-3', name: 'Studio iPad Pro',    platform: 'iPadOS',  deviceType: 'tablet',  quality: 0.85, speedMbps: 320, distance: 'Same room',  online: true,  lastSeenAt: new Date() },
];
seedDevices.forEach((d) => devices.set(d.id, d));
