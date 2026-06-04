import React from 'react';
import './StatusBar.css';

export default function StatusBar({ tool, strokeCount, onlineCount }) {
  return (
    <div className="status-bar">
      <div className="sb-item">
        <div className="sb-dot" />
        Connected
      </div>
      <div className="sb-item">⬡ Socket.IO</div>
      <div className="sb-item">Strokes: {strokeCount}</div>
      <div className="sb-item">
        Tool: {tool[0].toUpperCase() + tool.slice(1)}
      </div>
      <div className="sb-item">
        👥 {onlineCount} online
      </div>
      <div className="sb-spacer" />
      <div className="sb-item">TensorFlow.js v4.x</div>
      <div className="sb-item">MERN Stack</div>
    </div>
  );
}
