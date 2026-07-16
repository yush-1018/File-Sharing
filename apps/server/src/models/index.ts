import mongoose, { Schema, Document, Types } from 'mongoose';

/* ── User ──────────────────────────────────────────────────── */
export interface IUser extends Document {
  _id: Types.ObjectId;
  email?: string;
  name: string;
  passwordHash?: string;
  guest: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, index: true, sparse: true },
  name: { type: String, required: true },
  passwordHash: String,
  guest: { type: Boolean, default: false },
  avatarUrl: String,
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', userSchema);

/* ── Device ────────────────────────────────────────────────── */
export interface IDevice extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  name: string;
  platform: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  quality: number;
  speedMbps: number;
  distance: string;
  online: boolean;
  socketId?: string;
  ipAddress?: string;
  subnet?: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true },
  platform: { type: String, default: 'Unknown' },
  deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet'], default: 'desktop' },
  quality: { type: Number, default: 0.8 },
  speedMbps: { type: Number, default: 0 },
  distance: { type: String, default: 'Unknown' },
  online: { type: Boolean, default: true },
  socketId: { type: String, index: true },
  ipAddress: String,
  subnet: String,
  lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Device = mongoose.model<IDevice>('Device', deviceSchema);

/* ── Transfer ──────────────────────────────────────────────── */
export interface ITransfer extends Document {
  _id: Types.ObjectId;
  senderUserId: Types.ObjectId;
  receiverUserId?: Types.ObjectId;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
  s3Key?: string;
  transferMethod: 'local' | 'webrtc' | 'bluetooth' | 'cloud';
  status: 'pending' | 'uploading' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  transferredBytes: number;
  speed: string;
  eta: string;
  direction: 'upload' | 'download';
  peer: string;
  resumeToken: string;
  encrypted: boolean;
  encryptionIV?: string;
  totalChunks?: number;
  chunkSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

const transferSchema = new Schema<ITransfer>({
  senderUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiverUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  storagePath: String,
  s3Key: String,
  transferMethod: { type: String, enum: ['local', 'webrtc', 'bluetooth', 'cloud'], default: 'cloud' },
  status: {
    type: String,
    enum: ['pending', 'uploading', 'in_progress', 'paused', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  progress: { type: Number, default: 0 },
  transferredBytes: { type: Number, default: 0 },
  speed: { type: String, default: '—' },
  eta: { type: String, default: '—' },
  direction: { type: String, enum: ['upload', 'download'], default: 'upload' },
  peer: { type: String, default: 'Cloud' },
  resumeToken: String,
  encrypted: { type: Boolean, default: false },
  encryptionIV: String,
  totalChunks: Number,
  chunkSize: Number,
}, { timestamps: true });

export const Transfer = mongoose.model<ITransfer>('Transfer', transferSchema);

/* ── Chat Room ─────────────────────────────────────────────── */
export interface IChatRoom extends Document {
  _id: Types.ObjectId;
  roomId: string;
  name: string;
  avatar: string;
  color: string;
  memberIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const chatRoomSchema = new Schema<IChatRoom>({
  roomId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  color: { type: String, default: '#4cc9f0' },
  memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);

/* ── Chat Message ──────────────────────────────────────────── */
export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  roomId: string;
  senderUserId: Types.ObjectId;
  senderName: string;
  text: string;
  type: 'text' | 'system' | 'file';
  attachment?: { fileName: string; fileSize: number; transferId: string };
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  roomId: { type: String, required: true, index: true },
  senderUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'system', 'file'], default: 'text' },
  attachment: {
    type: {
      fileName: String,
      fileSize: Number,
      transferId: String,
    },
    required: false,
  },
}, { timestamps: true });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

/* ── Cloud Link ────────────────────────────────────────────── */
export interface ICloudLink extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  s3Key?: string;
  url: string;
  password?: string;
  downloads: number;
  views: number;
  active: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cloudLinkSchema = new Schema<ICloudLink>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  storagePath: String,
  s3Key: String,
  url: { type: String, required: true },
  password: String,
  downloads: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export const CloudLink = mongoose.model<ICloudLink>('CloudLink', cloudLinkSchema);

/* ── Seed default chat rooms (on first boot) ────────────────── */
export async function seedDefaults(): Promise<void> {
  const defaultRooms = [
    { roomId: 'general', name: 'General', avatar: 'G', color: '#4cc9f0' },
    { roomId: 'team', name: 'Team Design', avatar: 'TD', color: '#80ffdb' },
    { roomId: 'random', name: 'Random', avatar: 'R', color: '#ffd166' },
  ];

  for (const room of defaultRooms) {
    await ChatRoom.findOneAndUpdate(
      { roomId: room.roomId },
      { $setOnInsert: { ...room, memberIds: [] } },
      { upsert: true },
    );
  }
  console.log('[MongoDB] Default chat rooms seeded');
}
