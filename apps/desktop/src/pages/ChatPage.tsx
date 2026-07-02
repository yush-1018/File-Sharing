import { useState } from 'react';
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function ChatPage() {
  const { chatRooms, chatMessages, activeChatRoom, setActiveChatRoom, sendChatMessage, userId } = useAppStore();
  const [input, setInput] = useState('');

  const activeRoom = chatRooms.find((r) => r.id === activeChatRoom);
  const messages = chatMessages.filter((m) => m.roomId === activeChatRoom);

  const handleSend = () => {
    if (!input.trim()) return;
    sendChatMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-layout">
      {/* Room list */}
      <div className="chat-rooms">
        <div className="chat-rooms-header">Rooms</div>
        {chatRooms.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No chat rooms yet
          </div>
        )}
        {chatRooms.map((room) => {
          const roomMsgs = chatMessages.filter((m) => m.roomId === room.id);
          const lastMsg = roomMsgs[roomMsgs.length - 1];

          return (
            <div
              key={room.id}
              className={`chat-room-item ${room.id === activeChatRoom ? 'active' : ''}`}
              onClick={() => setActiveChatRoom(room.id)}
            >
              <div className="chat-room-avatar" style={{ background: room.color + '22', color: room.color }}>
                {room.avatar}
              </div>
              <div className="chat-room-info">
                <div className="name">{room.name}</div>
                <div className="preview">
                  {lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : 'No messages yet'}
                </div>
              </div>
              <div className="chat-room-meta">
                {lastMsg && (
                  <span className="time">
                    {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat main */}
      <div className="chat-main">
        {activeRoom ? (
          <>
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-room-avatar" style={{ background: activeRoom.color + '22', color: activeRoom.color, width: 36, height: 36, borderRadius: 10, fontSize: 13 }}>
                  {activeRoom.avatar}
                </div>
                <div>
                  <strong>{activeRoom.name}</strong>
                  <div className="status" style={{ fontSize: 12, color: 'var(--success)' }}>● Online</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-icon"><MoreVertical size={16} /></button>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderUserId === userId;
                return (
                  <div key={msg.id} className={`chat-bubble ${isMine ? 'sent' : 'received'}`}>
                    {!isMine && <div className="bubble-sender">{msg.senderName}</div>}
                    {msg.text}
                    <div className="bubble-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="chat-input-bar">
              <button className="btn-icon"><Paperclip size={16} /></button>
              <button className="btn-icon"><Smile size={16} /></button>
              <input
                className="chat-input"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="btn btn-primary btn-sm" onClick={handleSend}>
                <Send size={14} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <p>Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
