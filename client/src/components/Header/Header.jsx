import React, { useState } from 'react';
import './Header.css';

export default function Header({
  title, onTitleChange, onlineUsers, onExport, onBack, boardId,
  onUndo, onChatToggle, showChat, unreadCount = 0, shareCode,
}) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied,         setCopied]         = useState('');

  const joinLink = shareCode
    ? `${window.location.origin}/join/${shareCode}`
    : `${window.location.origin}/board/${boardId}`;

  const copyText = (text, label) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <>
      <header className="wh-header">
        {/* Left */}
        <button className="wh-back" onClick={onBack} title="Back to Dashboard">←</button>

        <div className="wh-logo">
          <div className="wh-logo-icon">✦</div>
          SketchLink
        </div>

        <div
          className="wh-title"
          contentEditable
          suppressContentEditableWarning
          onBlur={e => onTitleChange(e.target.textContent.trim())}
          spellCheck={false}
        >
          {title}
        </div>

        {/* Center — actions */}
        <div className="wh-center">
          {onUndo && (
            <button className="wh-tool-btn" onClick={onUndo} title="Undo (Ctrl+Z)">↩</button>
          )}
          <button className="wh-tool-btn wh-dimmed" title="AI Summarize — coming soon" disabled>⚡ AI</button>
          <button className="wh-tool-btn wh-dimmed" title="Auto Layout — coming soon" disabled>⊞ Layout</button>
        </div>

        <div className="wh-spacer" />

        {/* Online users */}
        <div className="wh-collab">
          {onlineUsers.slice(0, 5).map(u => (
            <div
              key={u.id}
              className="wh-avatar"
              style={{ background: u.color }}
              title={`${u.name} — Online`}
            >
              {u.name?.slice(0, 2).toUpperCase() || '??'}
              <div className="wh-avatar-dot" />
            </div>
          ))}
        </div>

        {/* Right actions */}
        <button className="wh-btn" onClick={onExport} title="Export as PNG">↓ Export</button>
        <button className="wh-btn wh-btn-accent" onClick={() => setShowShareModal(true)}>⬡ Share</button>
        <button
          className={`wh-btn wh-btn-chat ${showChat ? 'active' : ''}`}
          onClick={onChatToggle}
          title="Team Chat"
          style={{ position: 'relative' }}
        >
          💬
          {!showChat && unreadCount > 0 && (
            <span className="wh-chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
      </header>

      {/* Share modal */}
      {showShareModal && (
        <div className="share-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3 className="share-modal-title">Share Board</h3>
              <button className="share-modal-close" onClick={() => setShowShareModal(false)}>✕</button>
            </div>

            <div className="share-section">
              <div className="share-label">Share Code</div>
              <div className="share-row">
                <div className="share-code-display">{shareCode || '——'}</div>
                <button
                  className="share-copy-btn"
                  onClick={() => copyText(shareCode, 'code')}
                  disabled={!shareCode}
                >
                  {copied === 'code' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="share-hint">Paste this code into the "Share code" field on the Dashboard</div>
            </div>

            <div className="share-section">
              <div className="share-label">Invite Link</div>
              <div className="share-row">
                <div className="share-link-display">{joinLink}</div>
                <button
                  className="share-copy-btn"
                  onClick={() => copyText(joinLink, 'link')}
                >
                  {copied === 'link' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="share-hint">Anyone with this link can join and edit the board</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
