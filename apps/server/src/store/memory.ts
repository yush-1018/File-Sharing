/**
 * Legacy type definitions — kept for backward compatibility.
 * All data operations now go through Mongoose models in ../models/index.ts.
 */

/* ── Types (re-exported for any code that still references them) */
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
