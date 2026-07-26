import { Transfer, type ITransfer } from '../models/index.js';
import { setResumeToken, getResumeToken } from '../config/redis.js';
import { randomUUID } from 'node:crypto';

export type TransferPreference = 'local' | 'webrtc' | 'bluetooth' | 'cloud';

export function chooseTransferMethod(input: {
  sameLan?: boolean;
  hotspotReachable?: boolean;
  bluetoothAvailable?: boolean;
  estimatedBytes?: number;
  onlineRemote?: boolean;
  requiresTurnRelay?: boolean;
}): TransferPreference {
  // 1. Direct LAN / Hotspot has zero external bandwidth cost
  if (input.sameLan || input.hotspotReachable) return 'local';
  
  // 2. WebRTC P2P (Direct STUN) - limit to 5GB remote
  const size = input.estimatedBytes || 0;
  if (input.onlineRemote) {
    // If TURN relay is explicitly required (symmetric NAT), cap at 2GB to protect bandwidth costs
    if (input.requiresTurnRelay && size > 2 * 1024 * 1024 * 1024) {
      return 'cloud'; // Route >2GB TURN transfers to S3/R2 zero-egress cloud links
    }
    if (size < 5 * 1024 * 1024 * 1024) return 'webrtc';
  }
  
  // 3. Fallback to Resumable Cloud Relay (S3/R2 zero egress)
  return 'cloud';
}

export async function createTransfer(input: {
  senderUserId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
  s3Key?: string;
  peer?: string;
  transferMethod?: TransferPreference;
  encrypted?: boolean;
  encryptionIV?: string;
}): Promise<Record<string, any>> {
  const resumeToken = randomUUID();
  const method = input.transferMethod || 'cloud';

  const transfer = await Transfer.create({
    senderUserId: input.senderUserId,
    fileName: input.fileName,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    storagePath: input.storagePath,
    s3Key: input.s3Key,
    transferMethod: method,
    status: input.s3Key ? 'completed' : 'uploading',
    progress: input.s3Key ? 100 : 0,
    transferredBytes: input.s3Key ? input.fileSize : 0,
    speed: '—',
    eta: '—',
    direction: 'upload',
    peer: input.peer || 'Cloud',
    resumeToken,
    encrypted: input.encrypted || false,
    encryptionIV: input.encryptionIV,
  });

  // Store resume token in Redis with 24h TTL
  try {
    await setResumeToken(transfer._id.toString(), resumeToken);
  } catch {
    // Redis may not be available in dev; continue gracefully
  }

  return formatTransfer(transfer);
}

export async function getTransfersByUser(userId: string, page = 1, limit = 50): Promise<{ transfers: Record<string, any>[]; total: number; page: number }> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;
  const filter = { $or: [{ senderUserId: userId }, { receiverUserId: userId }] };

  const [transfers, total] = await Promise.all([
    Transfer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Transfer.countDocuments(filter),
  ]);

  return { transfers: transfers.map(formatTransfer), total, page: safePage };
}

export async function getTransferById(id: string): Promise<Record<string, any> | null> {
  try {
    const transfer = await Transfer.findById(id).lean();
    return transfer ? formatTransfer(transfer) : null;
  } catch {
    return null;
  }
}

export async function updateTransferStatus(
  id: string,
  status: ITransfer['status'],
): Promise<Record<string, any> | null> {
  const update: Record<string, any> = { status };
  if (status === 'paused') {
    update.speed = '—';
    update.eta = '—';
  }

  try {
    const transfer = await Transfer.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    return transfer ? formatTransfer(transfer) : null;
  } catch {
    return null;
  }
}

export async function updateTransferProgress(
  id: string,
  transferredBytes: number,
  speed?: string,
): Promise<Record<string, any> | null> {
  try {
    const transfer = await Transfer.findById(id);
    if (!transfer) return null;

    transfer.transferredBytes = transferredBytes;
    transfer.progress = transfer.fileSize > 0
      ? Math.round((transferredBytes / transfer.fileSize) * 100)
      : 0;
    if (speed) transfer.speed = speed;

    if (transfer.progress >= 100) {
      transfer.status = 'completed';
      transfer.speed = '—';
      transfer.eta = '—';
      transfer.progress = 100;
    }

    await transfer.save();
    return formatTransfer(transfer);
  } catch {
    return null;
  }
}

export async function verifyResumeToken(transferId: string, token: string): Promise<boolean> {
  try {
    const stored = await getResumeToken(transferId);
    return stored === token;
  } catch {
    // If Redis is down, allow resume if the transfer exists
    const transfer = await Transfer.findById(transferId).lean();
    return transfer?.resumeToken === token;
  }
}

function formatTransfer(t: any): Record<string, any> {
  return {
    id: t._id.toString(),
    senderUserId: t.senderUserId?.toString(),
    receiverUserId: t.receiverUserId?.toString(),
    fileName: t.fileName,
    fileSize: t.fileSize,
    mimeType: t.mimeType,
    transferMethod: t.transferMethod,
    status: t.status,
    progress: t.progress,
    transferredBytes: t.transferredBytes,
    speed: t.speed,
    eta: t.eta,
    direction: t.direction,
    peer: t.peer,
    encrypted: t.encrypted,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
