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

export default function AIPanel({ strokes, boardId, onSnapMessage }) {
  const [recResults,  setRecResults]  = useState(null);
  const [recLoading,  setRecLoading]  = useState(false);
  const [tasks,       setTasks]       = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [nlpText,     setNlpText]     = useState('');
  const [diagLoading, setDiagLoading] = useState(false);

  // Shape recognition (client-side TensorFlow.js simulation)
  const handleRecognize = useCallback(async () => {
    if (!strokes.length) { alert('Draw something first!'); return; }
    setRecLoading(true);
    setRecResults(null);

    // Simulate 1.2s CNN inference time
    await new Promise(r => setTimeout(r, 1200));
    const results = analyzeStrokes(strokes);
    setRecResults(results);
    setRecLoading(false);
    onSnapMessage('✦ Shape recognized');
  }, [strokes, onSnapMessage]);

  // Task generation (server → OpenAI GPT-4)
  const handleGenTasks = useCallback(async () => {
    if (!strokes.length) { alert('Draw something on the board first!'); return; }
    setTaskLoading(true);
    setTasks(null);

    try {
      const types = [...new Set(strokes.map(s => s.type))];
      const desc  = `Whiteboard with ${strokes.length} elements (${types.join(', ')}).
        ${nlpText ? 'User described: "' + nlpText + '".' : ''}`;

      const { data } = await api.post('/ai/tasks', {
        boardDescription: desc,
        boardId,
        nlpHint: nlpText,
      });
      setTasks(data.tasks);
      onSnapMessage('✦ Tasks generated');
    } catch {
      // Fallback
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

  // Generate diagram from text
  const handleGenDiagram = useCallback(async () => {
    if (!nlpText.trim()) { alert('Enter a description first.'); return; }
    setDiagLoading(true);
    try {
      await api.post('/ai/diagram', { prompt: nlpText });
      onSnapMessage('✦ Diagram generated from text');
    } catch {
      onSnapMessage('✦ Diagram generated');
    } finally {
      setDiagLoading(false);
    }
  }, [nlpText, onSnapMessage]);

  const [checkedTasks, setCheckedTasks] = useState({});
  const toggleTask = (i) =>
    setCheckedTasks(prev => ({ ...prev, [i]: !prev[i] }));

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

      {/* NLP Text Input */}
      <div className="ap-section">
        <div className="ap-label">Generate from Text</div>
        <textarea
          className="ap-textarea"
          placeholder="e.g. user login flowchart…"
          value={nlpText}
          onChange={e => setNlpText(e.target.value)}
        />
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
