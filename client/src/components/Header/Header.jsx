import React from 'react';
import './Header.css';

export default function Header({
  title, onTitleChange, onlineUsers, onExport, onBack, boardId,
  onUndo, onChatToggle, showChat,
}) {
  const shareBoard = () => {
    const url = `${window.location.origin}/board/${boardId}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    alert(`Share link copied!\n${url}`);
  };

  return (
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
      <button className="wh-btn wh-btn-accent" onClick={shareBoard}>⬡ Share</button>
      <button
        className={`wh-btn wh-btn-chat ${showChat ? 'active' : ''}`}
        onClick={onChatToggle}
        title="Team Chat"
      >
        💬
      </button>
    </header>
  );
}
