/**
 * In-memory data store — replaces MongoDB for zero-dependency dev.
 * All data lives in Maps; resets on server restart.
 */
import { randomUUID } from 'node:crypto';
/* ── Collections ────────────────────────────────────────────── */
export const users = new Map();
export const devices = new Map();
export const transfers = new Map();
export const chatRooms = new Map();
export const chatMessages = [];
export const cloudLinks = new Map();
/* ── Helper: generate IDs ──────────────────────────────────── */
export function newId() {
    return randomUUID();
}
/* ── Seed default chat rooms ────────────────────────────────── */
const defaultRooms = [
    { id: 'general', name: 'General', avatar: 'G', color: '#4cc9f0', memberIds: [], createdAt: new Date() },
    { id: 'team', name: 'Team Design', avatar: 'TD', color: '#80ffdb', memberIds: [], createdAt: new Date() },
    { id: 'random', name: 'Random', avatar: 'R', color: '#ffd166', memberIds: [], createdAt: new Date() },
];
defaultRooms.forEach((r) => chatRooms.set(r.id, r));
/* ── Seed some nearby devices for demo feel ─────────────────── */
const seedDevices = [
    { id: 'seed-1', name: 'Ava\'s MacBook Pro', platform: 'macOS', deviceType: 'desktop', quality: 0.95, speedMbps: 680, distance: 'Same room', online: true, lastSeenAt: new Date() },
    { id: 'seed-2', name: 'Kai\'s Pixel 9', platform: 'Android', deviceType: 'mobile', quality: 0.78, speedMbps: 145, distance: 'Same floor', online: true, lastSeenAt: new Date() },
    { id: 'seed-3', name: 'Studio iPad Pro', platform: 'iPadOS', deviceType: 'tablet', quality: 0.85, speedMbps: 320, distance: 'Same room', online: true, lastSeenAt: new Date() },
];
seedDevices.forEach((d) => devices.set(d.id, d));
