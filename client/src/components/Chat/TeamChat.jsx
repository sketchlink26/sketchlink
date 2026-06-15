import React, { useState, useEffect, useRef } from 'react';
import './TeamChat.css';

export default function TeamChat({ messages, onSend, onClose, currentUser }) {
  const [text, setText]   = useState('');
  const bottomRef         = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="team-chat">
      <div className="tc-header">
        <div className="tc-header-left">
          <span className="tc-icon">💬</span>
          <div>
            <div className="tc-title">Team Chat</div>
            <div className="tc-sub">Real-time collaboration</div>
          </div>
        </div>
        <button className="tc-close" onClick={onClose} title="Close chat">✕</button>
      </div>

      <div className="tc-messages">
        {messages.length === 0 && (
          <div className="tc-empty">
            <div className="tc-empty-icon">💬</div>
            <p>No messages yet.<br />Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.user === currentUser?.name;
          return (
            <div key={msg.id || i} className={`tc-msg ${isOwn ? 'own' : ''}`}>
              {!isOwn && (
                <div
                  className="tc-avatar"
                  style={{ background: msg.color || '#7c6ef5' }}
                  title={msg.user}
                >
                  {msg.user?.slice(0, 2).toUpperCase() || '??'}
                </div>
              )}
              <div className="tc-bubble-wrap">
                {!isOwn && <div className="tc-name">{msg.user}</div>}
                <div className="tc-bubble">{msg.message}</div>
                <div className="tc-time">{formatTime(msg.time)}</div>
              </div>
              {isOwn && (
                <div
                  className="tc-avatar"
                  style={{ background: msg.color || '#7c6ef5' }}
                >
                  {msg.user?.slice(0, 2).toUpperCase() || '??'}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="tc-input-row">
        <textarea
          className="tc-input"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          className="tc-send"
          onClick={handleSend}
          disabled={!text.trim()}
          title="Send (Enter)"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
