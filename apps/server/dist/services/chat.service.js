import { chatRooms, chatMessages, newId } from '../store/memory.js';
export function getRooms() {
    return Array.from(chatRooms.values());
}
export function getOrCreateRoom(id, name) {
    let room = chatRooms.get(id);
    if (!room) {
        room = { id, name: name || id, avatar: (name || id).charAt(0).toUpperCase(), color: '#4cc9f0', memberIds: [], createdAt: new Date() };
        chatRooms.set(id, room);
    }
    return room;
}
export function getMessages(roomId, limit = 50) {
    return chatMessages
        .filter((m) => m.roomId === roomId)
        .slice(-limit);
}
export function addMessage(input) {
    const msg = {
        id: newId(),
        roomId: input.roomId,
        senderUserId: input.senderUserId,
        senderName: input.senderName,
        text: input.text,
        type: input.type || 'text',
        attachment: input.attachment,
        createdAt: new Date(),
    };
    chatMessages.push(msg);
    // Ensure room exists
    getOrCreateRoom(input.roomId);
    return msg;
}
