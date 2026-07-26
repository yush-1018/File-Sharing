import { Folder, type IFolder } from '../models/index.js';

export async function createFolder(input: {
  userId: string;
  name: string;
  parentId?: string;
  color?: string;
}): Promise<Record<string, any>> {
  const folder = await Folder.create({
    userId: input.userId,
    name: input.name,
    parentId: input.parentId || undefined,
    color: input.color || '#4cc9f0',
  });
  return formatFolder(folder);
}

export async function getFolders(userId: string, parentId?: string): Promise<Record<string, any>[]> {
  const query: Record<string, any> = { userId };
  if (parentId) query.parentId = parentId;
  const folders = await Folder.find(query).sort({ createdAt: -1 }).lean();
  return folders.map(formatFolder);
}

export async function deleteFolder(id: string, userId: string): Promise<boolean> {
  const folder = await Folder.findOneAndDelete({ _id: id, userId });
  return !!folder;
}

function formatFolder(f: any): Record<string, any> {
  return {
    id: f._id.toString(),
    userId: f.userId?.toString(),
    name: f.name,
    parentId: f.parentId?.toString(),
    color: f.color,
    createdAt: f.createdAt,
  };
}
