import { ChatRoom, ChatMessage, type IChatRoom, type IChatMessage } from '../models/index.js';

export async function getRooms(): Promise<Record<string, any>[]> {
  const rooms = await ChatRoom.find().lean();
  return rooms.map(formatRoom);
}

export async function getOrCreateRoom(roomId: string, name?: string): Promise<Record<string, any>> {
  let room = await ChatRoom.findOne({ roomId }).lean();
  if (!room) {
    const created = await ChatRoom.create({
      roomId,
      name: name || roomId,
      avatar: (name || roomId).charAt(0).toUpperCase(),
      color: '#4cc9f0',
      memberIds: [],
    });
    room = created.toObject();
  }
  return formatRoom(room);
}

export async function getMessages(roomId: string, limit = 50): Promise<Record<string, any>[]> {
  const messages = await ChatMessage.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse().map(formatMessage);
}

export async function addMessage(input: {
  roomId: string;
  senderUserId: string;
  senderName: string;
  text: string;
  type?: IChatMessage['type'];
  attachment?: IChatMessage['attachment'];
}): Promise<Record<string, any>> {
  // Sanitize text and limit length to 5000 characters
  const trimmed = (input.text || '').slice(0, 5000);
  const sanitizedText = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const msg = await ChatMessage.create({
    roomId: input.roomId,
    senderUserId: input.senderUserId,
    senderName: input.senderName,
    text: sanitizedText,
    type: input.type || 'text',
    attachment: input.attachment,
  });

  // Ensure room exists
  await getOrCreateRoom(input.roomId);

  return formatMessage(msg.toObject());
}

function formatRoom(r: any): Record<string, any> {
  return {
    id: r.roomId || r._id.toString(),
    name: r.name,
    avatar: r.avatar,
    color: r.color,
    memberIds: r.memberIds?.map((id: any) => id.toString()) || [],
    createdAt: r.createdAt,
  };
}

function formatMessage(m: any): Record<string, any> {
  return {
    id: m._id.toString(),
    roomId: m.roomId,
    senderUserId: m.senderUserId?.toString(),
    senderName: m.senderName,
    text: m.text,
    type: m.type,
    attachment: m.attachment,
    createdAt: m.createdAt,
  };
}
