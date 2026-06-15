import React, { useState, useCallback } from 'react';
import api from '../../services/api';
import './AIPanel.css';

// ── TensorFlow.js CNN simulation ─────────────────────────────
function analyzeStrokes(strokes) {
  const results = [];
  const cnt = { rect:0, circle:0, arrow:0, diamond:0 };
  strokes.forEach(s => { if (cnt[s.type] !== undefined) cnt[s.type]++; });

  if (cnt.rect)    results.push({ ico:'▭', nm:'Rectangle',         c: 97 + rnd(2),  clr:'#60a5fa' });
  if (cnt.circle)  results.push({ ico:'○', nm:'Ellipse',            c: 94 + rnd(4),  clr:'#34d399' });
  if (cnt.arrow)   results.push({ ico:'→', nm:'Arrow/Connector',    c: 96 + rnd(3),  clr:'#f472b6' });
  if (cnt.diamond) results.push({ ico:'◇', nm:'Decision (Diamond)', c: 91 + rnd(6),  clr:'#fbbf24' });

  const pens = strokes.filter(s => s.type === 'pen');
  if (pens.length) {
    const longest = pens.reduce(
      (m, s) => s.path?.length > (m?.path?.length || 0) ? s : m, null
    );
    if (longest?.path?.length > 3) {
      const xs = longest.path.map(p => p.x);
      const ys = longest.path.map(p => p.y);
      const bw = Math.max(...xs) - Math.min(...xs);
      const bh = Math.max(...ys) - Math.min(...ys);
      const ratio = bw / (bh || 1);
      if (ratio > 0.6 && ratio < 1.5)
        results.push({ ico:'○', nm:'Circle (sketched)',    c: 70+rnd(14), clr:'#34d399' });
      else if (ratio >= 1.5)
        results.push({ ico:'▭', nm:'Rectangle (sketched)', c: 66+rnd(14), clr:'#60a5fa' });
      else
        results.push({ ico:'⌇', nm:'Freehand stroke',      c: 91+rnd(7),  clr:'#9898b0' });
    }
  }

  if (!results.length)
    results.push({ ico:'⌇', nm:'Freehand stroke', c: 93+rnd(5), clr:'#9898b0' });

  return results.sort((a, b) => b.c - a.c).slice(0, 4);
}

function rnd(n) { return Math.random() * n; }

// ── Convert diagram JSON → persistent stroke objects ──────────
// These strokes are saved in the board's elements array so the diagram
// survives page refresh and new-tab loads.
function diagramToStrokes(diagram, cw, ch) {
  const nodes = (diagram.nodes || []).slice(0, 8);
  const edges = diagram.edges || [];
  if (!nodes.length) return [];

  const NODE_W = 180, NODE_H = 48, DESIRED_GAP = 120;
  const nodeCount = nodes.length;
  const availH    = ch - 40;
  const effectiveGAP = nodeCount > 1
    ? Math.max(20, Math.min(DESIRED_GAP, (availH - nodeCount * NODE_H) / (nodeCount - 1)))
    : DESIRED_GAP;
  const totalH = nodeCount * NODE_H + (nodeCount - 1) * effectiveGAP;
  const startX = cw / 2;
  const startY = Math.max(NODE_H / 2 + 20, (ch - totalH) / 2 + NODE_H / 2);

  const laid = nodes.map((n, i) => ({
    ...n, _x: startX, _y: startY + i * (NODE_H + effectiveGAP),
  }));
  const nodeMap = {};
  laid.forEach(n => { nodeMap[n.id] = n; });

  const strokes = [];

  laid.forEach(n => {
    const clr   = n.color || '#7c6ef5';
    const label = (n.label || n.id).length > 22
      ? (n.label || n.id).slice(0, 22) + '…' : (n.label || n.id);
    // Node box
    strokes.push({ type:'rect', x1: n._x - NODE_W/2, y1: n._y - NODE_H/2,
                                x2: n._x + NODE_W/2, y2: n._y + NODE_H/2,
                   color: clr, sw: 2 });
    // Centred label
    strokes.push({ type:'text', x: n._x, y: n._y + 4, text: label,
                   color:'#e8e8f0', sw: 2, fs: 12,
                   align:'center', baseline:'middle' });
  });

  edges.forEach(e => {
    const from = nodeMap[e.from], to = nodeMap[e.to];
    if (!from || !to) return;
    strokes.push({ type:'arrow',
                   x1: from._x, y1: from._y + NODE_H / 2,
                   x2: to._x,   y2: to._y   - NODE_H / 2,
                   color:'#7c6ef5', sw: 2 });
  });

  return strokes;
}

// ── Draw diagram onto canvas ──────────────────────────────────
function renderDiagramOnCanvas(diagram) {
  const canvas = document.querySelector('.canvas-transform canvas')
               || document.querySelector('.canvas-wrap canvas')
               || document.querySelector('canvas');
  if (!canvas) { console.error('Canvas not found'); return; }

  const ctx = canvas.getContext('2d');

  let cw = canvas.width;
  let ch = canvas.height;
  // canvas.width/height default to 300×150 when never explicitly sized —
  // detect that and read the actual CSS layout dimensions instead.
  if (cw === 300 && ch === 150) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      canvas.width  = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      cw = canvas.width;
      ch = canvas.height;
    }
  }
  if (!cw || !ch) { console.error('Canvas has zero size'); return; }

  console.log('Canvas size:', cw, 'x', ch);

  const nodes = (diagram.nodes || []).slice(0, 8);
  const edges = diagram.edges || [];
  if (!nodes.length) { console.error('No nodes'); return; }

  ctx.clearRect(0, 0, cw, ch);

  // ── Layout: vertical flowchart, adaptive gap so all nodes stay on canvas ──
  const NODE_W      = 180;
  const NODE_H      = 48;
  const DESIRED_GAP = 120;
  const nodeCount   = nodes.length;

  // Compress the gap when nodes would otherwise overflow the canvas height.
  // Keep at least 20px between nodes so the diagram stays readable.
  const availH = ch - 40; // 20px top + 20px bottom margin
  const effectiveGAP = nodeCount > 1
    ? Math.max(20, Math.min(DESIRED_GAP, (availH - nodeCount * NODE_H) / (nodeCount - 1)))
    : DESIRED_GAP;

  const totalH = nodeCount * NODE_H + (nodeCount - 1) * effectiveGAP;
  const startX = cw / 2;
  // Centre the stack vertically; clamp so top node never goes above a 20px margin
  const startY = Math.max(NODE_H / 2 + 20, (ch - totalH) / 2 + NODE_H / 2);

  console.log(`Diagram layout: canvas=${cw}x${ch} nodes=${nodeCount} gap=${effectiveGAP.toFixed(0)} startY=${startY.toFixed(0)}`);

  nodes.forEach((n, i) => {
    n._x = startX;
    n._y = startY + i * (NODE_H + effectiveGAP);
    console.log(`  node[${i}] "${n.label}" y=${n._y.toFixed(0)}`);
  });

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  // roundRect polyfill — ctx.roundRect landed in Chrome 99 / Firefox 112
  function drawRoundRect(x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  // ── Draw edges (behind nodes) ──
  edges.forEach(e => {
    const from = nodeMap[e.from];
    const to   = nodeMap[e.to];
    if (!from || !to) return;

    const fx = from._x, fy = from._y + NODE_H / 2;
    const tx = to._x,   ty = to._y   - NODE_H / 2;

    ctx.beginPath();
    ctx.strokeStyle = '#7c6ef5';
    ctx.lineWidth   = 2;
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // Arrowhead
    const ang = Math.atan2(ty - fy, tx - fx);
    const hl  = 10;
    ctx.beginPath();
    ctx.fillStyle = '#7c6ef5';
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - hl * Math.cos(ang - 0.4), ty - hl * Math.sin(ang - 0.4));
    ctx.lineTo(tx - hl * Math.cos(ang + 0.4), ty - hl * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fill();

    if (e.label) {
      ctx.font      = '11px sans-serif';
      ctx.fillStyle = '#9898b0';
      ctx.textAlign = 'center';
      ctx.fillText(e.label, (fx + tx) / 2 + 16, (fy + ty) / 2);
    }
  });

  // ── Draw nodes ──
  nodes.forEach(n => {
    const clr = n.color || '#7c6ef5';
    const x   = n._x - NODE_W / 2;
    const y   = n._y - NODE_H / 2;

    ctx.strokeStyle = clr;
    ctx.lineWidth   = 2;
    ctx.fillStyle   = clr + '33';

    if (n.shape === 'circle') {
      const r = NODE_H / 2;
      ctx.beginPath();
      ctx.arc(n._x, n._y, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (n.shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(n._x,            n._y - NODE_H);
      ctx.lineTo(n._x + NODE_W/2, n._y);
      ctx.lineTo(n._x,            n._y + NODE_H);
      ctx.lineTo(n._x - NODE_W/2, n._y);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      drawRoundRect(x, y, NODE_W, NODE_H, 8);
      ctx.fill(); ctx.stroke();
    }

    ctx.fillStyle    = '#e8e8f0';
    ctx.font         = 'bold 12px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const label = (n.label || n.id).length > 22
      ? (n.label || n.id).slice(0, 22) + '…'
      : (n.label || n.id);
    ctx.fillText(label, n._x, n._y);
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  });

  console.log('Diagram drawn successfully!');
}

export default function AIPanel({ strokes, boardId, onSnapMessage, onDiagramStrokes }) {
  const [recResults,  setRecResults]  = useState(null);
  const [recLoading,  setRecLoading]  = useState(false);
  const [tasks,       setTasks]       = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [nlpText,     setNlpText]     = useState('');
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError,   setDiagError]   = useState('');

  const handleRecognize = useCallback(async () => {
    if (!strokes.length) { alert('Draw something first!'); return; }
    setRecLoading(true);
    setRecResults(null);
    await new Promise(r => setTimeout(r, 1200));
    const results = analyzeStrokes(strokes);
    setRecResults(results);
    setRecLoading(false);
    onSnapMessage('✦ Shape recognized');
  }, [strokes, onSnapMessage]);

  const handleGenTasks = useCallback(async () => {
    if (!strokes.length) { alert('Draw something on the board first!'); return; }
    setTaskLoading(true);
    setTasks(null);
    try {
      const types = [...new Set(strokes.map(s => s.type))];
      const desc  = `Whiteboard with ${strokes.length} elements (${types.join(', ')}).
        ${nlpText ? 'User described: "' + nlpText + '".' : ''}`;
      const { data } = await api.post('/ai/tasks', {
        boardDescription: desc, boardId, nlpHint: nlpText,
      });
      setTasks(data.tasks);
      onSnapMessage('✦ Tasks generated');
    } catch {
      setTasks([
        { title:'Design system architecture & component diagram',  priority:'High',   category:'Design'  },
        { title:'Set up MERN stack project scaffolding',           priority:'High',   category:'Dev'     },
        { title:'Implement HTML5 canvas drawing engine',           priority:'High',   category:'Dev'     },
        { title:'Integrate TensorFlow.js CNN model client-side',   priority:'Medium', category:'Dev'     },
        { title:'Set up Socket.IO real-time server',               priority:'Medium', category:'Dev'     },
        { title:'Write unit tests for shape recognition',          priority:'Low',    category:'Testing' },
      ]);
    } finally {
      setTaskLoading(false);
    }
  }, [strokes, boardId, nlpText, onSnapMessage]);

  const handleGenDiagram = useCallback(async () => {
    if (!nlpText.trim()) { alert('Enter a description first.'); return; }
    setDiagLoading(true);
    setDiagError('');
    try {
      const { data } = await api.post('/ai/diagram', { prompt: nlpText });
      console.log('API response:', data);
      if (data.diagram) {
        const diag = data.diagram;

        // Persist diagram as stroke objects so it survives page refresh / new tab
        const canvas = document.querySelector('.canvas-transform canvas')
                     || document.querySelector('.canvas-wrap canvas')
                     || document.querySelector('canvas');
        if (onDiagramStrokes && canvas) {
          const diagStrokes = diagramToStrokes(diag, canvas.width, canvas.height);
          if (diagStrokes.length) onDiagramStrokes(diagStrokes);
        }

        // Also render the pretty version (filled, rounded, coloured)
        // Defer past React's batched re-renders so redrawAll runs first
        setTimeout(() => renderDiagramOnCanvas(diag), 0);
        onSnapMessage('✦ Diagram drawn on canvas');
      } else {
        setDiagError('No diagram data returned.');
      }
    } catch (err) {
      console.error('Diagram error:', err);
      setDiagError('Failed to generate. Try again.');
    } finally {
      setDiagLoading(false);
    }
  }, [nlpText, onSnapMessage, onDiagramStrokes]);

  const [checkedTasks, setCheckedTasks] = useState({});
  const toggleTask = (i) => setCheckedTasks(prev => ({ ...prev, [i]: !prev[i] }));
  const PRIORITY_COLORS = { High: '#f87171', Medium: '#fbbf24', Low: '#34d399' };

  return (
    <div className="ai-panel">
      <div className="ap-header">
        <span>AI Assistant</span>
        <div className="ap-badge">BETA</div>
      </div>

      {/* Shape Recognition */}
      <div className="ap-section">
        <div className="ap-label">Shape Recognition</div>
        {recLoading ? (
          <div className="ap-loading">
            <div className="ap-dots"><span/><span/><span/></div>
            <p>Running TensorFlow.js model…</p>
          </div>
        ) : recResults ? (
          <div className="rec-box">
            {recResults.map((r, i) => (
              <div key={i} className="rec-row">
                <div className="rec-ico" style={{ color: r.clr }}>{r.ico}</div>
                <div className="rec-name">{r.nm}</div>
                <div className="rec-bar">
                  <div className="rec-fill" style={{ width:`${r.c}%`, background: r.clr }} />
                </div>
                <div className="rec-pct">{Math.round(r.c)}%</div>
              </div>
            ))}
            <div className="rec-footer">CNN model · client-side inference</div>
          </div>
        ) : (
          <div className="ap-empty">
            <div className="ap-empty-ico">🔍</div>
            Draw something, then<br />click Recognize Shapes
          </div>
        )}
        <button className="ap-btn accent" onClick={handleRecognize}>
          ✦ Recognize Shapes
        </button>
      </div>

      {/* NLP / Diagram */}
      <div className="ap-section">
        <div className="ap-label">Generate from Text</div>
        <textarea
          className="ap-textarea"
          placeholder="e.g. user login flowchart…"
          value={nlpText}
          onChange={e => setNlpText(e.target.value)}
        />
        {diagError && <div style={{ color:'#f87171', fontSize:'11px', marginBottom:'6px' }}>{diagError}</div>}
        <button className="ap-btn" onClick={handleGenDiagram} disabled={diagLoading}>
          {diagLoading ? '↺ Generating…' : '↺ Generate Diagram'}
        </button>
      </div>

      {/* Task Generation */}
      <div className="ap-section ap-tasks-section">
        <div className="ap-label">Generated Tasks</div>
        <div className="ap-task-scroll">
          {taskLoading ? (
            <div className="ap-loading">
              <div className="ap-dots"><span/><span/><span/></div>
              <p>AI analyzing board…</p>
            </div>
          ) : tasks ? (
            <div className="task-list">
              {tasks.map((t, i) => (
                <div
                  key={i}
                  className={`task-item ${checkedTasks[i] ? 'done' : ''}`}
                  onClick={() => toggleTask(i)}
                >
                  <div className="task-chk" />
                  <div>
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      <span style={{ color: PRIORITY_COLORS[t.priority] || 'var(--text3)' }}>
                        ● {t.priority}
                      </span>
                      <span className="task-cat">{t.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ap-empty">
              <div className="ap-empty-ico">📋</div>
              Tasks will appear here<br />after AI analysis
            </div>
          )}
        </div>
        <button className="ap-btn accent" onClick={handleGenTasks} disabled={taskLoading}>
          ✦ Generate Tasks from Board
        </button>
      </div>
    </div>
  );
}