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
}): TransferPreference {
  if (input.sameLan || input.hotspotReachable) return 'local';
  if (input.onlineRemote && (input.estimatedBytes || 0) < 20 * 1024 * 1024 * 1024) return 'webrtc';
  if (input.bluetoothAvailable && (input.estimatedBytes || 0) < 512 * 1024 * 1024) return 'bluetooth';
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

export async function getTransfersByUser(userId: string): Promise<Record<string, any>[]> {
  const transfers = await Transfer.find({
    $or: [{ senderUserId: userId }, { receiverUserId: userId }],
  }).sort({ createdAt: -1 }).lean();

  return transfers.map(formatTransfer);
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
    storagePath: t.storagePath,
    s3Key: t.s3Key,
    transferMethod: t.transferMethod,
    status: t.status,
    progress: t.progress,
    transferredBytes: t.transferredBytes,
    speed: t.speed,
    eta: t.eta,
    direction: t.direction,
    peer: t.peer,
    resumeToken: t.resumeToken,
    encrypted: t.encrypted,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
