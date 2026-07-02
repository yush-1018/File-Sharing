import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

/* ── Token management ───────────────────────────────────────── */
let authToken: string | null = null;

export function setToken(token: string) {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function getToken() {
  return authToken;
}

/* ── Auth ────────────────────────────────────────────────────── */
export async function guestLogin(name?: string) {
  const { data } = await api.post('/api/auth/guest', { name });
  setToken(data.token);
  return data;
}

export async function register(email: string, password: string, name: string) {
  const { data } = await api.post('/api/auth/register', { email, password, name });
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/api/auth/login', { email, password });
  setToken(data.token);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/api/auth/me');
  return data;
}

/* ── Discovery ──────────────────────────────────────────────── */
export async function fetchNearbyDevices() {
  const { data } = await api.get('/api/discovery/nearby');
  return data;
}

export async function announceDevice(info: { name: string; platform: string; deviceType: string }) {
  const { data } = await api.post('/api/discovery/announce', info);
  return data;
}

/* ── Transfers ──────────────────────────────────────────────── */
export async function fetchTransfers() {
  const { data } = await api.get('/api/transfers');
  return data;
}

export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('peer', 'Cloud');

  const { data } = await api.post('/api/transfers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0, // no timeout for uploads
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return data;
}

export async function pauseTransfer(id: string) {
  const { data } = await api.post(`/api/transfers/${id}/pause`);
  return data;
}

export async function resumeTransfer(id: string) {
  const { data } = await api.post(`/api/transfers/${id}/resume`);
  return data;
}

export async function cancelTransfer(id: string) {
  const { data } = await api.post(`/api/transfers/${id}/cancel`);
  return data;
}

/* ── Chat ────────────────────────────────────────────────────── */
export async function fetchChatRooms() {
  const { data } = await api.get('/api/chat/rooms');
  return data;
}

export async function fetchChatMessages(roomId: string) {
  const { data } = await api.get(`/api/chat/rooms/${roomId}/messages`);
  return data;
}

export async function sendChatMessage(roomId: string, text: string) {
  const { data } = await api.post(`/api/chat/rooms/${roomId}/messages`, { text });
  return data;
}

/* ── Cloud Links ─────────────────────────────────────────────── */
export async function fetchCloudLinks() {
  const { data } = await api.get('/api/links');
  return data;
}

export async function createCloudLink(
  file: File,
  options?: { password?: string; expiresInDays?: number },
  onProgress?: (progress: number) => void
) {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.password) formData.append('password', options.password);
  if (options?.expiresInDays) formData.append('expiresInDays', String(options.expiresInDays));

  const { data } = await api.post('/api/links', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return data;
}

export async function revokeCloudLink(id: string) {
  const { data } = await api.delete(`/api/links/${id}`);
  return data;
}

/* ── Health ──────────────────────────────────────────────────── */
export async function healthCheck() {
  const { data } = await api.get('/health');
  return data;
}

export default api;
