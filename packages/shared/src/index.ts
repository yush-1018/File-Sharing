export type TransferStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type TransferMethod = 'local' | 'hotspot' | 'lan' | 'bluetooth' | 'webrtc' | 'cloud' | 'link';

export interface FileManifestItem {
  path: string;
  size: number;
  mimeType: string;
  checksum: string;
  chunkSize: number;
}

export interface TransferSessionDTO {
  id: string;
  senderUserId: string;
  receiverUserId?: string;
  method: TransferMethod;
  status: TransferStatus;
  totalBytes: number;
  transferredBytes: number;
  files: FileManifestItem[];
}
