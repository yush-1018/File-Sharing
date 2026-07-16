import { Device, type IDevice } from '../models/index.js';

/** Extract subnet (first 3 octets) from an IPv4 address */
function extractSubnet(ip: string): string {
  // Handle IPv4-mapped IPv6 addresses (::ffff:192.168.1.5)
  const cleaned = ip.replace(/^::ffff:/, '');
  const parts = cleaned.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return 'unknown';
}

/** Estimate distance label based on subnet comparison */
function computeDistance(subnet1: string, subnet2: string): string {
  if (subnet1 === subnet2) return 'Same network';
  // If both are private IPs on different subnets
  if (subnet1.startsWith('192.168') && subnet2.startsWith('192.168')) return 'Same building';
  if (subnet1.startsWith('10.') && subnet2.startsWith('10.')) return 'Same org';
  return 'Remote';
}

/** Estimate quality from last ping latency (ms) */
function qualityFromLatency(latencyMs: number): number {
  if (latencyMs <= 5) return 0.98;
  if (latencyMs <= 20) return 0.92;
  if (latencyMs <= 50) return 0.85;
  if (latencyMs <= 100) return 0.75;
  if (latencyMs <= 200) return 0.60;
  return 0.45;
}

export async function announceDevice(input: {
  userId?: string;
  name: string;
  platform: string;
  deviceType: IDevice['deviceType'];
  socketId?: string;
  ipAddress?: string;
  latencyMs?: number;
}): Promise<Record<string, any>> {
  const subnet = input.ipAddress ? extractSubnet(input.ipAddress) : 'unknown';
  const quality = input.latencyMs != null ? qualityFromLatency(input.latencyMs) : 0.8;
  // Estimate speed from quality heuristic (rough — better with real measurements)
  const speedMbps = Math.round(quality * 800);

  const updateData: Record<string, any> = {
    name: input.name,
    platform: input.platform,
    deviceType: input.deviceType,
    quality: Math.round(quality * 100) / 100,
    speedMbps,
    distance: 'Same network',
    online: true,
    socketId: input.socketId,
    ipAddress: input.ipAddress,
    subnet,
    lastSeenAt: new Date(),
  };

  if (input.userId) {
    updateData.userId = input.userId;
  }

  // Upsert by socketId if provided, otherwise create new
  let device: IDevice | null = null;
  if (input.socketId) {
    device = await Device.findOneAndUpdate(
      { socketId: input.socketId },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } else {
    device = await Device.create(updateData);
  }

  return formatDevice(device!);
}

export async function getNearbyDevices(requestorSubnet?: string): Promise<Record<string, any>[]> {
  const devices = await Device.find({ online: true }).lean();

  return devices.map((d) => {
    const formatted = formatDevice(d);
    // Compute relative distance if we know the requestor's subnet
    if (requestorSubnet && d.subnet) {
      formatted.distance = computeDistance(requestorSubnet, d.subnet);
    }
    return formatted;
  });
}

export async function setDeviceOffline(socketId: string): Promise<void> {
  await Device.updateMany(
    { socketId },
    { $set: { online: false } },
  );
}

export async function getAllDevices(): Promise<Record<string, any>[]> {
  const devices = await Device.find().lean();
  return devices.map(formatDevice);
}

function formatDevice(d: any): Record<string, any> {
  return {
    id: d._id.toString(),
    userId: d.userId?.toString(),
    name: d.name,
    platform: d.platform,
    deviceType: d.deviceType,
    quality: d.quality,
    speedMbps: d.speedMbps,
    distance: d.distance,
    online: d.online,
    socketId: d.socketId,
    lastSeenAt: d.lastSeenAt,
  };
}
