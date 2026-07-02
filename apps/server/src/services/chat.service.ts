import { chatRooms, chatMessages, newId } from '../store/memory.js';
import type { ChatRoom, ChatMessage } from '../store/memory.js';

export function getRooms(): ChatRoom[] {
  return Array.from(chatRooms.values());
}

export function getOrCreateRoom(id: string, name?: string): ChatRoom {
  let room = chatRooms.get(id);
  if (!room) {
    room = { id, name: name || id, avatar: (name || id).charAt(0).toUpperCase(), color: '#4cc9f0', memberIds: [], createdAt: new Date() };
    chatRooms.set(id, room);
  }
  return room;
}

export function getMessages(roomId: string, limit = 50): ChatMessage[] {
  return chatMessages
    .filter((m) => m.roomId === roomId)
    .slice(-limit);
}

export function addMessage(input: {
  roomId: string;
  senderUserId: string;
  senderName: string;
  text: string;
  type?: ChatMessage['type'];
  attachment?: ChatMessage['attachment'];
}): ChatMessage {
  const msg: ChatMessage = {
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
