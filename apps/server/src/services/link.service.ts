import { CloudLink, type ICloudLink } from '../models/index.js';
import { env } from '../config/env.js';
import { deriveKeyFromPassword } from './encryption.service.js';

export async function createLink(input: {
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  s3Key?: string;
  password?: string;
  iv?: string;
  authTag?: string;
  expiresInDays?: number;
}): Promise<Record<string, any>> {
  let passwordHash: string | undefined;
  let passwordSalt: string | undefined;

  if (input.password) {
    const derived = deriveKeyFromPassword(input.password);
    passwordHash = derived.key.toString('hex');
    passwordSalt = derived.salt;
  }

  const link = await CloudLink.create({
    userId: input.userId,
    fileName: input.fileName,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    storagePath: input.storagePath,
    s3Key: input.s3Key,
    url: `${env.baseUrl}/api/links/{id}/download`,
    passwordHash,
    passwordSalt,
    iv: input.iv,
    authTag: input.authTag,
    downloads: 0,
    views: 0,
    active: true,
    expiresAt: new Date(Date.now() + (input.expiresInDays || 7) * 86400000),
  });

  // Update URL with the actual ID
  link.url = `${env.baseUrl}/api/links/${link._id.toString()}/download`;
  await link.save();

  return formatLink(link);
}

export function verifyLinkPassword(link: Record<string, any>, providedPassword?: string): boolean {
  if (!link.passwordHash) return true; // No password required
  if (!providedPassword) return false;
  
  const derived = deriveKeyFromPassword(providedPassword, link.passwordSalt);
  return derived.key.toString('hex') === link.passwordHash;
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

export async function reportLink(id: string, reason: string): Promise<boolean> {
  try {
    // Auto-deactivate link upon DMCA / malware abuse report
    const link = await CloudLink.findByIdAndUpdate(
      id,
      { $set: { active: false, reported: true, reportReason: reason } },
      { new: true },
    );
    return !!link;
  } catch {
    return false;
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
    passwordHash: l.passwordHash,
    passwordSalt: l.passwordSalt,
    hasPassword: !!l.passwordHash,
    downloads: l.downloads,
    views: l.views,
    active: l.active,
    expiresAt: l.expiresAt,
    createdAt: l.createdAt,
  };
}
