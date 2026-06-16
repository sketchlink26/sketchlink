import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useCanvas from '../../hooks/useCanvas';
import useSocket from '../../hooks/useSocket';
import api from '../../services/api';
import Header    from '../Header/Header';
import Toolbar   from '../Toolbar/Toolbar';
import AIPanel   from '../AIPanel/AIPanel';
import TeamChat  from '../Chat/TeamChat';
import StatusBar from '../StatusBar/StatusBar';
import './Whiteboard.css';

const AUTOSAVE_INTERVAL = 30000;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;

export default function Whiteboard() {
  const { id }       = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [board,       setBoard]       = useState(null);
  const [boardTitle,  setBoardTitle]  = useState('Untitled Board');
  const [loading,     setLoading]     = useState(true);

  const [tool,        setTool]        = useState('pen');
  const [color,       setColor]       = useState('#e8e8f0');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [coordText,   setCoordText]   = useState('0, 0');

  // Zoom & Pan state
  const [zoom,   setZoom]   = useState(1);
  const [pan,    setPan]    = useState({ x: 0, y: 0 });
  const isPanning           = useRef(false);
  const panStart            = useRef({ x: 0, y: 0 });
  const panOrigin           = useRef({ x: 0, y: 0 });
  const spaceDown           = useRef(false);

  const [onlineUsers,   setOnlineUsers]   = useState([]);
  const [cursors,       setCursors]       = useState({});
  const [snapMsg,       setSnapMsg]       = useState('');
  const [showSnap,      setShowSnap]      = useState(false);
  const [showChat,      setShowChat]      = useState(false);
  const [chatMessages,  setChatMessages]  = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [typingUsers,   setTypingUsers]   = useState({});
  const showChatRef = useRef(false);
  const snapTimer   = useRef(null);
  const typingTimers = useRef({});

  const {
    canvasRef, strokes,
    startDraw, midDraw, endDraw,
    addText, addRemoteStroke,
    undo, clear, exportPNG,
    isDraggingElement,
  } = useCanvas(tool, color, strokeWidth, zoom);

  const { emitStroke, emitShape, emitCursor, emitClear, emitUndo, emitChatMessage, emitTyping } = useSocket(id, user, {
    onStrokeReceived: ({ stroke }) => addRemoteStroke(stroke),
    onShapeReceived:  ({ shape })  => addRemoteStroke(shape),
    onCursorUpdated:  (data)       => setCursors(prev => ({ ...prev, [data.socketId]: data })),
    onUsersUpdated:   ({ users })  => setOnlineUsers(users),
    onBoardCleared:   ()           => clear(),
    onUndoReceived:   ()           => undo(),
    onChatReceived: (msg) => {
      setChatMessages(prev => [...prev, msg]);
      if (!showChatRef.current) setUnreadCount(n => n + 1);
    },
    onTypingReceived: ({ socketId, name, color, isTyping }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        if (isTyping) {
          next[socketId] = { name, color };
          clearTimeout(typingTimers.current[socketId]);
          typingTimers.current[socketId] = setTimeout(() => {
            setTypingUsers(p => { const n = { ...p }; delete n[socketId]; return n; });
          }, 3000);
        } else {
          delete next[socketId];
          clearTimeout(typingTimers.current[socketId]);
        }
        return next;
      });
    },
  });

  // Load board
  useEffect(() => {
    if (!id) return;
    api.get(`/boards/${id}`)
      .then(({ data }) => { setBoard(data.board); setBoardTitle(data.board.title); })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  // Replay saved strokes onto the canvas once board data arrives
  useEffect(() => {
    if (!board?.elements?.length) return;
    board.elements.forEach(el => addRemoteStroke(el));
  }, [board, addRemoteStroke]);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (strokes.length > 0) {
        api.put(`/boards/${id}`, {
          title: boardTitle, elements: strokes,
          thumbnail: canvasRef.current?.toDataURL('image/png', 0.3),
        }).catch(console.error);
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [id, strokes, boardTitle]);

  // Keyboard shortcuts
  useEffect(() => {
    const keyDown = e => {
      if (e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return;
      if (e.code === 'Space') { spaceDown.current = true; e.preventDefault(); return; }
      const k = e.key.toLowerCase();
      if (k === 'v') setTool('select');
      if (k === 'p') setTool('pen');
      if (k === 'e') setTool('eraser');
      if (k === 'r') setTool('rect');
      if (k === 'c') setTool('circle');
      if (k === 'a') setTool('arrow');
      if (k === 'd') setTool('diamond');
      if (k === 't') setTool('text');
      if (e.ctrlKey && k === '=') { e.preventDefault(); handleZoom(0.1); }
      if (e.ctrlKey && k === '-') { e.preventDefault(); handleZoom(-0.1); }
      if (e.ctrlKey && k === '0') { e.preventDefault(); setZoom(1); setPan({ x:0, y:0 }); }
      if (e.ctrlKey && k === 'z') { e.preventDefault(); handleUndo(); }
    };
    const keyUp = e => { if (e.code === 'Space') spaceDown.current = false; };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup',   keyUp);
    return () => { window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); };
  }, []);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  }, []);

  const handleZoom = (delta) => {
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  };

  // Convert screen coords to canvas coords (accounting for zoom & pan)
  const toCanvasCoords = useCallback((clientX, clientY) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: (clientX - r.left) / zoom,
      y: (clientY - r.top)  / zoom,
    };
  }, [zoom]);

  const handleMouseDown = useCallback((e) => {
    // Space + drag = pan
    if (spaceDown.current || e.button === 1) {
      isPanning.current  = true;
      panStart.current   = { x: e.clientX, y: e.clientY };
      panOrigin.current  = { ...pan };
      return;
    }
    if (tool === 'text') {
      const pos = toCanvasCoords(e.clientX, e.clientY);
      const txt = prompt('Enter text:');
      if (txt) { const s = addText(pos.x, pos.y, txt); emitShape(s); }
      return;
    }
    startDraw(e, zoom, pan);
  }, [tool, startDraw, addText, emitShape, zoom, pan, toCanvasCoords]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning.current) {
      setPan({
        x: panOrigin.current.x + (e.clientX - panStart.current.x),
        y: panOrigin.current.y + (e.clientY - panStart.current.y),
      });
      return;
    }
    const pos = toCanvasCoords(e.clientX, e.clientY);
    setCoordText(`${Math.round(pos.x)}, ${Math.round(pos.y)}`);
    emitCursor(Math.round(pos.x), Math.round(pos.y));
    midDraw(e, zoom, pan);
  }, [midDraw, emitCursor, zoom, pan, toCanvasCoords]);

  const handleMouseUp = useCallback((e) => {
    if (isPanning.current) { isPanning.current = false; return; }
    endDraw(e, (stroke) => {
      if (stroke.type === 'pen') emitStroke(stroke);
      else emitShape(stroke);
    }, zoom, pan);
  }, [endDraw, emitStroke, emitShape, zoom, pan]);

  // Add each diagram stroke to the canvas & strokes array so it persists
  const handleDiagramStrokes = useCallback((diagStrokes) => {
    diagStrokes.forEach(s => addRemoteStroke(s));
  }, [addRemoteStroke]);

  const toggleChat = () => {
    setShowChat(v => {
      const next = !v;
      showChatRef.current = next;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  const handleUndo  = () => { undo(); emitUndo(); };
  const handleClear = () => {
    if (!window.confirm('Clear the board for everyone?')) return;
    clear(); emitClear();
  };
  const flashSnap = (msg) => {
    setSnapMsg(msg); setShowSnap(true);
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => setShowSnap(false), 2400);
  };

  const getCursor = () => {
    if (spaceDown.current) return isPanning.current ? 'grabbing' : 'grab';
    if (tool === 'select') return isDraggingElement ? 'grabbing' : 'default';
    if (tool === 'eraser') return 'cell';
    if (tool === 'text')   return 'text';
    return 'crosshair';
  };

  // NOTE: we intentionally do NOT early-return when loading=true.
  // useCanvas's init useEffect runs on the very first mount; if the canvas
  // element isn't in the DOM yet (because we returned a loading div instead)
  // ctxRef is never set and startDraw silently no-ops on production.
  // Fix: always render the canvas so the effect sees it on mount, and cover
  // the UI with a fixed overlay while the board data is loading.

  return (
    <div className="whiteboard-wrap">
      {/* Full-screen overlay while board data loads — canvas stays in DOM */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg, #0c0c14)', color: 'var(--text3, #5a5a7a)',
          fontSize: '14px',
        }}>
          Loading board…
        </div>
      )}

      <Header
        title={boardTitle}
        onTitleChange={setBoardTitle}
        onlineUsers={onlineUsers}
        onExport={exportPNG}
        onBack={() => navigate('/dashboard')}
        boardId={id}
        onUndo={handleUndo}
        onChatToggle={toggleChat}
        showChat={showChat}
        unreadCount={unreadCount}
      />

      <div className="whiteboard-body">
        <Toolbar
          tool={tool} setTool={setTool}
          color={color} setColor={setColor}
          strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
          onUndo={handleUndo} onClear={handleClear}
        />

        {/* Canvas area */}
        <div
          className="canvas-wrap"
          onWheel={handleWheel}
          style={{ overflow: 'hidden' }}
        >
          {/* Zoom controls */}
          <div className="zoom-controls">
            <button onClick={() => handleZoom(0.15)} title="Zoom In">+</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(-0.15)} title="Zoom Out">−</button>
            <button onClick={() => { setZoom(1); setPan({ x:0, y:0 }); }} title="Reset">⊙</button>
          </div>

          {/* Transformed canvas container */}
          <div
            className="canvas-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ cursor: getCursor(), display: 'block' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Remote cursors */}
          {Object.values(cursors).map(c => (
            <div key={c.socketId} className="remote-cursor"
              style={{
                left: c.x * zoom + pan.x,
                top:  c.y * zoom + pan.y,
              }}>
              <div className="rc-dot"   style={{ background: c.color }} />
              <div className="rc-label" style={{ background: c.color }}>{c.name}</div>
            </div>
          ))}

          {showSnap && <div className="snap-notification">{snapMsg}</div>}

          <div className="canvas-info-bar">
            <span>∞ canvas</span>
            <span>{coordText}</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        <AIPanel strokes={strokes} boardId={id} onSnapMessage={flashSnap}
                 onDiagramStrokes={handleDiagramStrokes} />

        {showChat && (
          <TeamChat
            messages={chatMessages}
            currentUser={user}
            onSend={emitChatMessage}
            onClose={() => setShowChat(false)}
            typingUsers={typingUsers}
            onTyping={emitTyping}
          />
        )}
      </div>

      <StatusBar tool={tool} strokeCount={strokes.length} onlineCount={onlineUsers.length || 1} />
    </div>
  );
}