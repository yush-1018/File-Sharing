import { getSocket } from './socket';

export interface WebRTCTransferOptions {
  peerId: string;       // Socket ID of the remote peer
  file?: File;          // File to send (for sender)
  chunkSize?: number;   // Bytes per chunk (default 64KB)
  onProgress?: (progress: number, speed: string) => void;
  onComplete?: (file?: { name: string; data: Blob }) => void;
  onError?: (error: Error) => void;
}

interface ICEConfig {
  iceServers: RTCIceServer[];
}

const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64KB — optimal for data channels

/**
 * WebRTC peer-to-peer file transfer.
 * Uses RTCDataChannel for direct file transfer between browsers.
 */
export class WebRTCFileTransfer {
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private options: WebRTCTransferOptions;
  private iceConfig: ICEConfig;
  private receivedChunks: ArrayBuffer[] = [];
  private receivedSize = 0;
  private fileMetadata: { name: string; size: number; type: string } | null = null;
  private startTime = 0;
  private _destroyed = false;

  constructor(options: WebRTCTransferOptions, iceConfig?: ICEConfig) {
    this.options = options;
    this.iceConfig = iceConfig || {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
  }

  /** Initiate a file transfer as the sender (creates offer) */
  async sendFile(): Promise<void> {
    if (!this.options.file) throw new Error('No file provided');

    const socket = getSocket();
    if (!socket) throw new Error('Socket not connected');

    this.pc = new RTCPeerConnection(this.iceConfig);
    this.setupICEHandling();

    // Create data channel
    this.dataChannel = this.pc.createDataChannel('filetransfer', {
      ordered: true,
    });

    this.dataChannel.binaryType = 'arraybuffer';

    this.dataChannel.onopen = () => {
      console.log('[WebRTC] Data channel open — sending file');
      this.startSending();
    };

    this.dataChannel.onerror = (e) => {
      this.options.onError?.(new Error(`Data channel error: ${(e as any).error?.message || 'unknown'}`));
    };

    // Create and send offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    socket.emit('webrtc:signal', {
      to: this.options.peerId,
      signal: { type: 'offer', sdp: offer.sdp },
      metadata: {
        fileName: this.options.file.name,
        fileSize: this.options.file.size,
      },
    });

    // Listen for answer
    socket.on('webrtc:signal', async (data: { from: string; signal: any }) => {
      if (data.from !== this.options.peerId || this._destroyed) return;

      if (data.signal.type === 'answer') {
        await this.pc!.setRemoteDescription(new RTCSessionDescription(data.signal));
      } else if (data.signal.candidate) {
        await this.pc!.addIceCandidate(new RTCIceCandidate(data.signal));
      }
    });
  }

  /** Accept an incoming file transfer as the receiver (creates answer) */
  async receiveFile(offer: RTCSessionDescriptionInit): Promise<void> {
    const socket = getSocket();
    if (!socket) throw new Error('Socket not connected');

    this.pc = new RTCPeerConnection(this.iceConfig);
    this.setupICEHandling();

    // Handle incoming data channel
    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.dataChannel.binaryType = 'arraybuffer';
      this.startTime = Date.now();

      this.dataChannel.onmessage = (e) => {
        this.handleIncomingData(e.data);
      };

      this.dataChannel.onerror = (e) => {
        this.options.onError?.(new Error(`Data channel error: ${(e as any).error?.message || 'unknown'}`));
      };
    };

    // Set remote description (the offer) and create answer
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    socket.emit('webrtc:signal', {
      to: this.options.peerId,
      signal: { type: 'answer', sdp: answer.sdp },
    });

    // Listen for ICE candidates
    socket.on('webrtc:signal', async (data: { from: string; signal: any }) => {
      if (data.from !== this.options.peerId || this._destroyed) return;

      if (data.signal.candidate) {
        await this.pc!.addIceCandidate(new RTCIceCandidate(data.signal));
      }
    });
  }

  /** Clean up resources */
  destroy(): void {
    this._destroyed = true;
    this.dataChannel?.close();
    this.pc?.close();
    this.dataChannel = null;
    this.pc = null;
    this.receivedChunks = [];
  }

  /* ── Private methods ──────────────────────────────────────── */

  private setupICEHandling(): void {
    if (!this.pc) return;

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket?.emit('webrtc:signal', {
          to: this.options.peerId,
          signal: { candidate: event.candidate.toJSON() },
        });
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', this.pc?.iceConnectionState);
      if (this.pc?.iceConnectionState === 'failed' || this.pc?.iceConnectionState === 'disconnected') {
        this.options.onError?.(new Error('ICE connection failed'));
      }
    };
  }

  private async startSending(): Promise<void> {
    const file = this.options.file!;
    const chunkSize = this.options.chunkSize || DEFAULT_CHUNK_SIZE;
    const dc = this.dataChannel!;
    this.startTime = Date.now();

    // Send file metadata first
    dc.send(JSON.stringify({
      type: 'metadata',
      name: file.name,
      size: file.size,
      mimeType: file.type,
    }));

    // Read and send file in chunks
    let offset = 0;
    const reader = new FileReader();

    const sendNextChunk = () => {
      if (offset >= file.size || this._destroyed) {
        // Send completion signal
        dc.send(JSON.stringify({ type: 'complete' }));
        this.options.onComplete?.();
        return;
      }

      // Backpressure: wait if the buffer is too full
      if (dc.bufferedAmount > chunkSize * 8) {
        setTimeout(sendNextChunk, 50);
        return;
      }

      const slice = file.slice(offset, offset + chunkSize);
      reader.onload = () => {
        if (reader.result && !this._destroyed) {
          dc.send(reader.result as ArrayBuffer);
          offset += chunkSize;

          // Report progress
          const progress = Math.min(Math.round((offset / file.size) * 100), 100);
          const elapsed = (Date.now() - this.startTime) / 1000;
          const speedBps = offset / elapsed;
          const speedStr = formatSpeed(speedBps);
          this.options.onProgress?.(progress, speedStr);

          sendNextChunk();
        }
      };
      reader.readAsArrayBuffer(slice);
    };

    sendNextChunk();
  }

  private handleIncomingData(data: any): void {
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'metadata') {
          this.fileMetadata = { name: msg.name, size: msg.size, type: msg.mimeType };
          this.receivedChunks = [];
          this.receivedSize = 0;
        } else if (msg.type === 'complete') {
          // Assemble received file
          const blob = new Blob(this.receivedChunks, { type: this.fileMetadata?.type });
          this.options.onComplete?.({
            name: this.fileMetadata?.name || 'received-file',
            data: blob,
          });
        }
      } catch {
        // Not JSON — treat as text
      }
    } else if (data instanceof ArrayBuffer) {
      this.receivedChunks.push(data);
      this.receivedSize += data.byteLength;

      if (this.fileMetadata) {
        const progress = Math.min(
          Math.round((this.receivedSize / this.fileMetadata.size) * 100),
          100,
        );
        const elapsed = (Date.now() - this.startTime) / 1000;
        const speedBps = this.receivedSize / elapsed;
        this.options.onProgress?.(progress, formatSpeed(speedBps));
      }
    }
  }
}

function formatSpeed(bps: number): string {
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(1)} GB/s`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(0)} MB/s`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} KB/s`;
  return `${Math.round(bps)} B/s`;
}

/** Request ICE configuration from the server */
export function requestICEConfig(): Promise<ICEConfig> {
  return new Promise((resolve) => {
    const socket = getSocket();
    if (!socket) {
      resolve({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      });
      return;
    }

    socket.once('ice:config', (config: ICEConfig) => {
      resolve(config);
    });
    socket.emit('ice:config');

    // Timeout fallback
    setTimeout(() => {
      resolve({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
    }, 3000);
  });
}
