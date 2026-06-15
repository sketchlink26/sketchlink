import React, { useState, useEffect, useRef, useCallback } from 'react';
import './TeamChat.css';

export default function TeamChat({ messages, onSend, onClose, currentUser, typingUsers = {}, onTyping }) {
  const [text, setText]   = useState('');
  const bottomRef         = useRef(null);
  const typingTimer       = useRef(null);
  const isTypingRef       = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    stopTyping();
  };

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping?.(false);
    }
    clearTimeout(typingTimer.current);
  }, [onTyping]);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping?.(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2000);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const typers = Object.values(typingUsers).filter(u => u.name !== currentUser?.name);

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

        {typers.length > 0 && (
          <div className="tc-typing">
            <div className="tc-typing-dots">
              <span /><span /><span />
            </div>
            <span className="tc-typing-label">
              {typers.map(u => u.name).join(', ')} {typers.length === 1 ? 'is' : 'are'} typing…
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="tc-input-row">
        <textarea
          className="tc-input"
          placeholder="Type a message…"
          value={text}
          onChange={handleChange}
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
