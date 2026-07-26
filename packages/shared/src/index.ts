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

/* ── Cross-Platform Standardized Signaling Protocol Specification ────── */
export enum SignalingMessageType {
  PRESENCE_ANNOUNCE = 'presence:announce',
  PRESENCE_UPDATE   = 'presence:update',
  PRESENCE_LIST     = 'presence:list',
  PRESENCE_OFFLINE  = 'presence:offline',
  
  ROOM_JOIN         = 'room:join',
  ROOM_LEAVE        = 'room:leave',
  
  CHAT_SEND         = 'chat:send',
  CHAT_MESSAGE      = 'chat:message',
  CHAT_HISTORY      = 'chat:history',
  
  WEBRTC_SIGNAL     = 'webrtc:signal',
  WEBRTC_REJECT     = 'webrtc:reject',
  
  TRANSFER_PROGRESS = 'transfer:progress',
  TRANSFER_COMPLETE = 'transfer:complete',
}

export interface SignalingMessage<T = any> {
  type: SignalingMessageType;
  payload: T;
  timestamp: number;
}

