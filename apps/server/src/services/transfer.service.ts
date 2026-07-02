import { transfers, newId } from '../store/memory.js';
import type { Transfer } from '../store/memory.js';

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

export function createTransfer(input: {
  senderUserId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath?: string;
  peer?: string;
}): Transfer {
  const id = newId();
  const transfer: Transfer = {
    id,
    senderUserId: input.senderUserId,
    fileName: input.fileName,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    storagePath: input.storagePath,
    transferMethod: 'cloud',
    status: 'completed',
    progress: 100,
    transferredBytes: input.fileSize,
    speed: '—',
    eta: '—',
    direction: 'upload',
    peer: input.peer || 'Cloud',
    resumeToken: newId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  transfers.set(id, transfer);
  return transfer;
}

export function getTransfersByUser(userId: string): Transfer[] {
  const result: Transfer[] = [];
  for (const t of transfers.values()) {
    if (t.senderUserId === userId || t.receiverUserId === userId) result.push(t);
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getTransferById(id: string): Transfer | undefined {
  return transfers.get(id);
}

export function updateTransferStatus(id: string, status: Transfer['status']): Transfer | null {
  const t = transfers.get(id);
  if (!t) return null;
  t.status = status;
  t.updatedAt = new Date();
  if (status === 'paused') { t.speed = '—'; t.eta = '—'; }
  transfers.set(id, t);
  return t;
}

export function updateTransferProgress(id: string, transferredBytes: number, speed?: string): Transfer | null {
  const t = transfers.get(id);
  if (!t) return null;
  t.transferredBytes = transferredBytes;
  t.progress = t.fileSize > 0 ? Math.round((transferredBytes / t.fileSize) * 100) : 0;
  if (speed) t.speed = speed;
  if (t.progress >= 100) {
    t.status = 'completed';
    t.speed = '—';
    t.eta = '—';
  }
  t.updatedAt = new Date();
  transfers.set(id, t);
  return t;
}
