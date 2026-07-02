import { cloudLinks, newId } from '../store/memory.js';
export function createLink(input) {
    const id = newId();
    const shortCode = id.slice(0, 8);
    const link = {
        id,
        userId: input.userId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        storagePath: input.storagePath,
        url: `http://localhost:8080/api/links/${id}/download`,
        password: input.password,
        downloads: 0,
        views: 0,
        active: true,
        expiresAt: new Date(Date.now() + (input.expiresInDays || 7) * 86400000),
        createdAt: new Date(),
    };
    cloudLinks.set(id, link);
    return link;
}
export function getLinks(userId) {
    const result = [];
    for (const l of cloudLinks.values()) {
        if (l.userId === userId)
            result.push(l);
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
export function getLinkById(id) {
    return cloudLinks.get(id);
}
export function recordView(id) {
    const l = cloudLinks.get(id);
    if (l) {
        l.views++;
        cloudLinks.set(id, l);
    }
}
export function recordDownload(id) {
    const l = cloudLinks.get(id);
    if (l) {
        l.downloads++;
        cloudLinks.set(id, l);
    }
}
export function revokeLink(id) {
    const l = cloudLinks.get(id);
    if (!l)
        return null;
    l.active = false;
    cloudLinks.set(id, l);
    return l;
}
