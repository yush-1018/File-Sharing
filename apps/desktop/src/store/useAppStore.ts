import { create } from 'zustand';
import * as api from '../lib/api';
import { connectSocket, getSocket, announcePresence, joinRoom, sendChatViaSocket } from '../lib/socket';

/* ── Types ──────────────────────────────────────────────────── */
export type Page = 'dashboard' | 'nearby' | 'transfers' | 'chat' | 'links' | 'settings';

export interface Device {
  id: string;
  name: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: string;
  quality: number;
  speedMbps: number;
  distance: string;
  online: boolean;
}

export interface Transfer {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  speed: string;
  eta: string;
  transferMethod: string;
  status: string;
  direction: string;
  peer: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderUserId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface CloudLink {
  id: string;
  fileName: string;
  fileSize: number;
  url: string;
  downloads: number;
  views: number;
  active: boolean;
  expiresAt: string;
  createdAt: string;
  password?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  // App state
  page: Page;
  initialized: boolean;
  serverOnline: boolean;
  userId: string | null;
  userName: string;

  // Data
  devices: Device[];
  transfers: Transfer[];
  chatRooms: ChatRoom[];
  chatMessages: ChatMessage[];
  activeChatRoom: string | null;
  cloudLinks: CloudLink[];
  toasts: Toast[];
  uploadProgress: number | null;

  // Settings
  e2eEnabled: boolean;
  autoResume: boolean;
  chunkSize: string;
  theme: string;

  // Actions
  setPage: (page: Page) => void;
  initialize: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshTransfers: () => Promise<void>;
  refreshChatRooms: () => Promise<void>;
  refreshLinks: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  toggleTransfer: (id: string) => Promise<void>;
  cancelTransfer: (id: string) => Promise<void>;
  setActiveChatRoom: (roomId: string) => void;
  loadChatMessages: (roomId: string) => Promise<void>;
  sendChatMessage: (text: string) => void;
  createLink: (file: File, password?: string) => Promise<void>;
  copyLink: (id: string) => void;
  revokeLink: (id: string) => Promise<void>;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  toggleE2E: () => void;
  toggleAutoResume: () => void;
  setChunkSize: (size: string) => void;
  setTheme: (theme: string) => void;
  setUserName: (name: string) => void;
}

let toastCounter = 0;

export const useAppStore = create<AppState>((set, get) => ({
  page: 'dashboard',
  initialized: false,
  serverOnline: false,
  userId: null,
  userName: 'User',

  devices: [],
  transfers: [],
  chatRooms: [],
  chatMessages: [],
  activeChatRoom: null,
  cloudLinks: [],
  toasts: [],
  uploadProgress: null,

  e2eEnabled: true,
  autoResume: true,
  chunkSize: '16 MB',
  theme: 'dark',

  setPage: (page) => set({ page }),

  /* ── Initialize: guest login + connect socket + load data ───── */
  initialize: async () => {
    if (get().initialized) return;

    try {
      // Guest login
      const authResult = await api.guestLogin('User');
      set({ userId: authResult.user.id, userName: authResult.user.name, serverOnline: true });

      // Connect socket
      const socket = connectSocket();

      // Announce device presence
      announcePresence({
        name: 'My Desktop',
        platform: navigator.platform || 'Windows',
        deviceType: 'desktop',
        userId: authResult.user.id,
      });

      // Socket event listeners
      socket.on('presence:list', (devices: Device[]) => {
        set({ devices });
      });

      socket.on('presence:update', (device: Device) => {
        set((s) => {
          const exists = s.devices.find((d) => d.id === device.id);
          if (exists) {
            return { devices: s.devices.map((d) => d.id === device.id ? device : d) };
          }
          return { devices: [...s.devices, device] };
        });
      });

      socket.on('presence:offline', ({ socketId }: { socketId: string }) => {
        set((s) => ({
          devices: s.devices.map((d) =>
            (d as any).socketId === socketId ? { ...d, online: false } : d
          ),
        }));
      });

      socket.on('chat:message', (msg: ChatMessage) => {
        set((s) => {
          // Avoid duplicates
          if (s.chatMessages.find((m) => m.id === msg.id)) return s;
          return { chatMessages: [...s.chatMessages, msg] };
        });
      });

      socket.on('transfer:progress', (payload: any) => {
        set((s) => ({
          transfers: s.transfers.map((t) =>
            t.id === payload.transferId
              ? { ...t, progress: payload.progress, speed: payload.speed, eta: payload.eta, status: payload.status }
              : t
          ),
        }));
      });

      // Load initial data
      await Promise.allSettled([
        get().refreshDevices(),
        get().refreshTransfers(),
        get().refreshChatRooms(),
        get().refreshLinks(),
      ]);

      // Join default chat room
      if (get().chatRooms.length > 0) {
        const firstRoom = get().chatRooms[0].id;
        set({ activeChatRoom: firstRoom });
        joinRoom(firstRoom);
        await get().loadChatMessages(firstRoom);
      }

      set({ initialized: true });
      get().addToast('Connected to LinkDrop server', 'success');
    } catch (err) {
      console.warn('Server not available, running in offline mode');
      set({ initialized: true, serverOnline: false });
      get().addToast('Server offline — running in demo mode', 'info');
    }
  },

  /* ── Refresh helpers ──────────────────────────────────────── */
  refreshDevices: async () => {
    try {
      const devices = await api.fetchNearbyDevices();
      set({ devices });
    } catch { /* ignore */ }
  },

  refreshTransfers: async () => {
    try {
      const transfers = await api.fetchTransfers();
      set({ transfers });
    } catch { /* ignore */ }
  },

  refreshChatRooms: async () => {
    try {
      const chatRooms = await api.fetchChatRooms();
      set({ chatRooms });
    } catch { /* ignore */ }
  },

  refreshLinks: async () => {
    try {
      const cloudLinks = await api.fetchCloudLinks();
      set({ cloudLinks });
    } catch { /* ignore */ }
  },

  /* ── File upload ──────────────────────────────────────────── */
  uploadFile: async (file: File) => {
    set({ uploadProgress: 0 });
    try {
      const transfer = await api.uploadFile(file, (progress) => {
        set({ uploadProgress: progress });
      });
      set({ uploadProgress: null });
      get().addToast(`Uploaded: ${file.name}`, 'success');
      await get().refreshTransfers();
    } catch (err) {
      set({ uploadProgress: null });
      get().addToast(`Upload failed: ${(err as Error).message}`, 'error');
    }
  },

  /* ── Transfer controls ────────────────────────────────────── */
  toggleTransfer: async (id: string) => {
    const t = get().transfers.find((t) => t.id === id);
    if (!t) return;
    try {
      if (t.status === 'in_progress' || t.status === 'uploading') {
        await api.pauseTransfer(id);
      } else if (t.status === 'paused') {
        await api.resumeTransfer(id);
      }
      await get().refreshTransfers();
    } catch {
      get().addToast('Failed to update transfer', 'error');
    }
  },

  cancelTransfer: async (id: string) => {
    try {
      await api.cancelTransfer(id);
      await get().refreshTransfers();
      get().addToast('Transfer cancelled', 'info');
    } catch {
      get().addToast('Failed to cancel transfer', 'error');
    }
  },

  /* ── Chat ─────────────────────────────────────────────────── */
  setActiveChatRoom: (roomId: string) => {
    set({ activeChatRoom: roomId });
    joinRoom(roomId);
    get().loadChatMessages(roomId);
  },

  loadChatMessages: async (roomId: string) => {
    try {
      const msgs = await api.fetchChatMessages(roomId);
      set((s) => {
        // Merge server messages without duplicating
        const existingIds = new Set(s.chatMessages.filter(m => m.roomId !== roomId).map(m => m.id));
        const filtered = s.chatMessages.filter(m => m.roomId !== roomId);
        return { chatMessages: [...filtered, ...msgs] };
      });
    } catch { /* ignore */ }
  },

  sendChatMessage: (text: string) => {
    const { activeChatRoom, userId, userName } = get();
    if (!activeChatRoom || !text.trim() || !userId) return;

    sendChatViaSocket({
      roomId: activeChatRoom,
      text: text.trim(),
      senderUserId: userId,
      senderName: userName,
    });
  },

  /* ── Cloud links ──────────────────────────────────────────── */
  createLink: async (file: File, password?: string) => {
    set({ uploadProgress: 0 });
    try {
      const link = await api.createCloudLink(file, { password }, (progress) => {
        set({ uploadProgress: progress });
      });
      set({ uploadProgress: null });
      get().addToast(`Share link created for ${file.name}`, 'success');
      await get().refreshLinks();
    } catch (err) {
      set({ uploadProgress: null });
      get().addToast(`Failed to create link: ${(err as Error).message}`, 'error');
    }
  },

  copyLink: (id: string) => {
    const link = get().cloudLinks.find((l) => l.id === id);
    if (link) {
      navigator.clipboard?.writeText(link.url).catch(() => {});
      get().addToast(`Copied: ${link.url}`, 'success');
    }
  },

  revokeLink: async (id: string) => {
    try {
      await api.revokeCloudLink(id);
      await get().refreshLinks();
      get().addToast('Link revoked', 'info');
    } catch {
      get().addToast('Failed to revoke link', 'error');
    }
  },

  /* ── Toasts ───────────────────────────────────────────────── */
  addToast: (message, type) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 3000);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  /* ── Settings ─────────────────────────────────────────────── */
  toggleE2E: () => set((s) => ({ e2eEnabled: !s.e2eEnabled })),
  toggleAutoResume: () => set((s) => ({ autoResume: !s.autoResume })),
  setChunkSize: (chunkSize) => set({ chunkSize }),
  setTheme: (theme) => set({ theme }),
  setUserName: (userName) => set({ userName }),
}));
