import { CloudLink, type ICloudLink } from '../models/index.js';
import { env } from '../config/env.js';

export async function createLink(input: {
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  s3Key?: string;
  password?: string;
  expiresInDays?: number;
}): Promise<Record<string, any>> {
  const link = await CloudLink.create({
    userId: input.userId,
    fileName: input.fileName,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    storagePath: input.storagePath,
    s3Key: input.s3Key,
    url: `http://localhost:${env.port}/api/links/{id}/download`,
    password: input.password,
    downloads: 0,
    views: 0,
    active: true,
    expiresAt: new Date(Date.now() + (input.expiresInDays || 7) * 86400000),
  });

  // Update URL with the actual ID
  link.url = `http://localhost:${env.port}/api/links/${link._id.toString()}/download`;
  await link.save();

  return formatLink(link);
}

export async function getLinks(userId: string): Promise<Record<string, any>[]> {
  const links = await CloudLink.find({ userId }).sort({ createdAt: -1 }).lean();
  return links.map(formatLink);
}

export async function getLinkById(id: string): Promise<Record<string, any> | null> {
  try {
    const link = await CloudLink.findById(id).lean();
    return link ? formatLink(link) : null;
  } catch {
    return null;
  }
}

export async function recordView(id: string): Promise<void> {
  try {
    await CloudLink.findByIdAndUpdate(id, { $inc: { views: 1 } });
  } catch {
    // Ignore
  }
}

export async function recordDownload(id: string): Promise<void> {
  try {
    await CloudLink.findByIdAndUpdate(id, { $inc: { downloads: 1 } });
  } catch {
    // Ignore
  }
}

export async function revokeLink(id: string): Promise<Record<string, any> | null> {
  try {
    const link = await CloudLink.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true },
    ).lean();
    return link ? formatLink(link) : null;
  } catch {
    return null;
  }
}

function formatLink(l: any): Record<string, any> {
  return {
    id: l._id.toString(),
    userId: l.userId?.toString(),
    fileName: l.fileName,
    fileSize: l.fileSize,
    mimeType: l.mimeType,
    storagePath: l.storagePath,
    s3Key: l.s3Key,
    url: l.url,
    password: l.password,
    downloads: l.downloads,
    views: l.views,
    active: l.active,
    expiresAt: l.expiresAt,
    createdAt: l.createdAt,
  };
}
