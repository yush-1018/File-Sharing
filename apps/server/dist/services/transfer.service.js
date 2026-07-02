import { transfers, newId } from '../store/memory.js';
export function chooseTransferMethod(input) {
    if (input.sameLan || input.hotspotReachable)
        return 'local';
    if (input.onlineRemote && (input.estimatedBytes || 0) < 20 * 1024 * 1024 * 1024)
        return 'webrtc';
    if (input.bluetoothAvailable && (input.estimatedBytes || 0) < 512 * 1024 * 1024)
        return 'bluetooth';
    return 'cloud';
}
export function createTransfer(input) {
    const id = newId();
    const transfer = {
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
export function getTransfersByUser(userId) {
    const result = [];
    for (const t of transfers.values()) {
        if (t.senderUserId === userId || t.receiverUserId === userId)
            result.push(t);
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
export function getTransferById(id) {
    return transfers.get(id);
}
export function updateTransferStatus(id, status) {
    const t = transfers.get(id);
    if (!t)
        return null;
    t.status = status;
    t.updatedAt = new Date();
    if (status === 'paused') {
        t.speed = '—';
        t.eta = '—';
    }
    transfers.set(id, t);
    return t;
}
export function updateTransferProgress(id, transferredBytes, speed) {
    const t = transfers.get(id);
    if (!t)
        return null;
    t.transferredBytes = transferredBytes;
    t.progress = t.fileSize > 0 ? Math.round((transferredBytes / t.fileSize) * 100) : 0;
    if (speed)
        t.speed = speed;
    if (t.progress >= 100) {
        t.status = 'completed';
        t.speed = '—';
        t.eta = '—';
    }
    t.updatedAt = new Date();
    transfers.set(id, t);
    return t;
}
