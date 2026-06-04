import React from 'react';
import './Header.css';

export default function Header({
  title, onTitleChange, onlineUsers, onExport, onBack, boardId
}) {
  const shareBoard = () => {
    const url = `${window.location.origin}/board/${boardId}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    alert(`Share link copied!\n${url}`);
  };

  return (
    <header className="wh-header">
      <button className="wh-back" onClick={onBack} title="Back to Dashboard">
        ← Dashboard
      </button>

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

      <div className="wh-spacer" />

      {/* Online users */}
      <div className="wh-collab">
        {onlineUsers.slice(0, 5).map(u => (
          <div
            key={u.id}
            className="wh-avatar"
            style={{ background: u.color }}
            title={u.name + ' — Online'}
          >
            {u.name?.slice(0, 2).toUpperCase() || '?'}
            <div className="wh-avatar-dot" />
          </div>
        ))}
      </div>

      <button className="wh-btn" onClick={onExport}>↓ Export PNG</button>
      <button className="wh-btn wh-btn-accent" onClick={shareBoard}>⬡ Share</button>
    </header>
  );
}
