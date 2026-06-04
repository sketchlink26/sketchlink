import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useCanvas from '../../hooks/useCanvas';
import useSocket from '../../hooks/useSocket';
import api from '../../services/api';
import Header    from '../Header/Header';
import Toolbar   from '../Toolbar/Toolbar';
import AIPanel   from '../AIPanel/AIPanel';
import StatusBar from '../StatusBar/StatusBar';
import './Whiteboard.css';

const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export default function Whiteboard() {
  const { id }       = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  // Board state
  const [board,       setBoard]       = useState(null);
  const [boardTitle,  setBoardTitle]  = useState('Untitled Board');
  const [loading,     setLoading]     = useState(true);

  // Drawing state
  const [tool,        setTool]        = useState('pen');
  const [color,       setColor]       = useState('#e8e8f0');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [coordText,   setCoordText]   = useState('0, 0');

  // Collaboration state
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [cursors,     setCursors]     = useState({});

  // AI Panel
  const [snapMsg,     setSnapMsg]     = useState('');
  const [showSnap,    setShowSnap]    = useState(false);
  const snapTimer = useRef(null);

  // Canvas hook
  const {
    canvasRef,
    strokes,
    startDraw,
    midDraw,
    endDraw,
    addText,
    addRemoteStroke,
    undo,
    clear,
    exportPNG,
  } = useCanvas(tool, color, strokeWidth);

  // Socket hook — real-time collaboration
  const { emitStroke, emitShape, emitCursor, emitClear, emitUndo } = useSocket(id, user, {
    onStrokeReceived: ({ stroke })         => addRemoteStroke(stroke),
    onShapeReceived:  ({ shape })          => addRemoteStroke(shape),
    onCursorUpdated:  (data)               => setCursors(prev => ({ ...prev, [data.socketId]: data })),
    onUsersUpdated:   ({ users })          => setOnlineUsers(users),
    onBoardCleared:   ()                   => clear(),
    onUndoReceived:   ()                   => undo(),
  });

  // Load board data
  useEffect(() => {
    if (!id) return;
    api.get(`/boards/${id}`)
      .then(({ data }) => {
        setBoard(data.board);
        setBoardTitle(data.board.title);
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (strokes.length > 0) {
        api.put(`/boards/${id}`, {
          title:     boardTitle,
          elements:  strokes,
          thumbnail: canvasRef.current?.toDataURL('image/png', 0.3),
        }).catch(console.error);
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [id, strokes, boardTitle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = e => {
      if (e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return;
      const k = e.key.toLowerCase();
      if (k === 'p') setTool('pen');
      if (k === 'e') setTool('eraser');
      if (k === 'r') setTool('rect');
      if (k === 'c') setTool('circle');
      if (k === 'a') setTool('arrow');
      if (k === 'd') setTool('diamond');
      if (k === 't') setTool('text');
      if (e.ctrlKey && k === 'z') { e.preventDefault(); handleUndo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (tool === 'text') {
      const r   = canvasRef.current.getBoundingClientRect();
      const pos = { x: e.clientX - r.left, y: e.clientY - r.top };
      const txt = prompt('Enter text:');
      if (txt) {
        const s = addText(pos.x, pos.y, txt);
        emitShape(s);
      }
      return;
    }
    startDraw(e);
  }, [tool, startDraw, addText, emitShape]);

  const handleMouseMove = useCallback((e) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (r) {
      const x = Math.round(e.clientX - r.left);
      const y = Math.round(e.clientY - r.top);
      setCoordText(`${x}, ${y}`);
      emitCursor(x, y);
    }
    midDraw(e);
  }, [midDraw, emitCursor]);

  const handleMouseUp = useCallback((e) => {
    endDraw(e, (stroke) => {
      if (stroke.type === 'pen') emitStroke(stroke);
      else emitShape(stroke);
    });
  }, [endDraw, emitStroke, emitShape]);

  const handleUndo = () => { undo(); emitUndo(); };
  const handleClear = () => {
    if (!window.confirm('Clear the board for everyone?')) return;
    clear(); emitClear();
  };

  const flashSnap = (msg) => {
    setSnapMsg(msg);
    setShowSnap(true);
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => setShowSnap(false), 2400);
  };

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)' }}>
      Loading board…
    </div>
  );

  return (
    <div className="whiteboard-wrap">
      <Header
        title={boardTitle}
        onTitleChange={setBoardTitle}
        onlineUsers={onlineUsers}
        onExport={exportPNG}
        onBack={() => navigate('/dashboard')}
        boardId={id}
      />

      <div className="whiteboard-body">
        <Toolbar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          onUndo={handleUndo}
          onClear={handleClear}
        />

        {/* Canvas */}
        <div className="canvas-wrap">
          <canvas
            ref={canvasRef}
            style={{ cursor: tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Remote cursors */}
          {Object.values(cursors).map(c => (
            <div key={c.socketId} className="remote-cursor"
              style={{ left: c.x, top: c.y }}>
              <div className="rc-dot" style={{ background: c.color }} />
              <div className="rc-label" style={{ background: c.color }}>{c.name}</div>
            </div>
          ))}

          {/* Snap notification */}
          {showSnap && (
            <div className="snap-notification">{snapMsg}</div>
          )}

          <div className="canvas-info-bar">
            <span>∞ canvas</span>
            <span>{coordText}</span>
            <span>100%</span>
          </div>
        </div>

        <AIPanel
          strokes={strokes}
          boardId={id}
          onSnapMessage={flashSnap}
        />
      </div>

      <StatusBar
        tool={tool}
        strokeCount={strokes.length}
        onlineCount={onlineUsers.length || 1}
      />
    </div>
  );
}
