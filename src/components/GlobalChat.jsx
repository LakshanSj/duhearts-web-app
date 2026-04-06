import React, { useState, useEffect, useRef } from 'react';
import { SendHorizonal } from 'lucide-react';
import { listenToMessages, sendMessage } from '../services/roomService';

export default function GlobalChat({ user, userProfile, pairId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [msgLimit, setMsgLimit] = useState(20);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const chatBottomRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!pairId) return;
    const unsub = listenToMessages(pairId, msgLimit, (msgs) => {
      if (chatContainerRef.current && loadingOlder) {
        const oldHeight = chatContainerRef.current.scrollHeight;
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - oldHeight;
          }
          setLoadingOlder(false);
        }, 100);
      }
      setMessages(msgs);
    });
    return unsub;
  }, [pairId, msgLimit]);

  useEffect(() => {
    if (!loadingOlder) {
      chatBottomRef.current?.scrollIntoView();
    }
  }, [messages]);

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && messages.length >= msgLimit && !loadingOlder) {
      setLoadingOlder(true);
      setMsgLimit(prev => prev + 20);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !pairId) return;
    
    // Inject username if displayName is empty
    const chatUser = { ...user, displayName: userProfile?.username || user.displayName };
    
    await sendMessage(pairId, chatUser, newMessage);
    setNewMessage('');
  };

  return (
    <div className="glass-panel" style={{ flex: 1, width: '100%', maxWidth: '800px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div ref={chatContainerRef} onScroll={handleScroll} className="chat-container hide-scrollbar" style={{ flex: 1, minHeight: 0, maxHeight: 'none' }}>
        <div className="chat-message system">
          <span>Welcome to your private chat, love!</span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`chat-message ${isMe ? 'mine' : 'theirs'} animate-in`}>
              <div className="bubble">
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
        <input
          type="text"
          className="input-field"
          style={{ flex: 1, borderRadius: '24px', padding: '0.8rem 1.2rem', backgroundColor: '#fff' }}
          placeholder="Chat with ur partner💕..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          className="gradient-btn flex-center"
          style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '50%', padding: 0 }}
          disabled={!newMessage.trim()}
        >
          <SendHorizonal size={20} />
        </button>
      </form>
    </div>
  );
}
