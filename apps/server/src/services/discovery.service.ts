import { devices, newId } from '../store/memory.js';
import type { Device } from '../store/memory.js';

export function announceDevice(input: {
  userId?: string;
  name: string;
  platform: string;
  deviceType: Device['deviceType'];
  socketId?: string;
}): Device {
  // Check if device already exists by socketId
  let existing: Device | undefined;
  if (input.socketId) {
    for (const d of devices.values()) {
      if (d.socketId === input.socketId) { existing = d; break; }
    }
  }

  const device: Device = {
    id: existing?.id || newId(),
    userId: input.userId,
    name: input.name,
    platform: input.platform,
    deviceType: input.deviceType,
    quality: 0.7 + Math.random() * 0.3,
    speedMbps: Math.round(100 + Math.random() * 800),
    distance: 'Same network',
    online: true,
    socketId: input.socketId,
    lastSeenAt: new Date(),
  };
  devices.set(device.id, device);
  return device;
}

export function getNearbyDevices(): Device[] {
  return Array.from(devices.values()).filter((d) => d.online);
}

export function setDeviceOffline(socketId: string): void {
  for (const d of devices.values()) {
    if (d.socketId === socketId) {
      d.online = false;
      devices.set(d.id, d);
    }
  }
}

export function getAllDevices(): Device[] {
  return Array.from(devices.values());
}
