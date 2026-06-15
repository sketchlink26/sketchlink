import React from 'react';
import './Toolbar.css';

const TOOLS = [
  { id: 'select',  icon: '↖', label: 'Select (V)'       },
  { id: 'pen',     icon: '✏️', label: 'Pen (P)'         },
  { id: 'eraser',  icon: '🧹', label: 'Eraser (E)'      },
  null,
  { id: 'rect',    icon: '▭',  label: 'Rectangle (R)'   },
  { id: 'circle',  icon: '○',  label: 'Circle (C)'      },
  { id: 'arrow',   icon: '→',  label: 'Arrow (A)'       },
  { id: 'diamond', icon: '◇',  label: 'Diamond (D)'     },
  { id: 'text',    icon: 'T',  label: 'Text (T)'        },
];

const COLORS = [
  '#e8e8f0', '#f87171', '#fb923c',
  '#fbbf24', '#34d399', '#60a5fa',
  '#c084fc', '#f472b6',
];

const STROKES = [
  { label: 'S', value: 2  },
  { label: 'M', value: 4  },
  { label: 'L', value: 8  },
];

export default function Toolbar({
  tool, setTool, color, setColor,
  strokeWidth, setStrokeWidth,
  onUndo, onClear,
}) {
  return (
    <div className="toolbar">
      {TOOLS.map((t, i) =>
        t === null
          ? <div key={`sep-${i}`} className="tb-sep" />
          : (
            <button
              key={t.id}
              className={`tb-btn ${tool === t.id ? 'active' : ''}`}
              onClick={() => setTool(t.id)}
              title={t.label}
            >
              {t.icon}
              <span className="tb-tip">{t.label}</span>
            </button>
          )
      )}

      <div className="tb-sep" />

      {STROKES.map(s => (
        <button
          key={s.value}
          className={`tb-sw ${strokeWidth === s.value ? 'active' : ''}`}
          onClick={() => setStrokeWidth(s.value)}
          title={`Stroke ${s.label}`}
        >
          {s.label}
        </button>
      ))}

      <div className="tb-sep" />

      {COLORS.map(c => (
        <div
          key={c}
          className={`tb-clr ${color === c ? 'active' : ''}`}
          style={{ background: c }}
          onClick={() => setColor(c)}
          title={c}
        />
      ))}

      <div className="tb-sep" />

      <button className="tb-btn" onClick={onUndo} title="Undo (Ctrl+Z)">
        ↩<span className="tb-tip">Undo</span>
      </button>
      <button className="tb-btn" onClick={onClear} title="Clear board">
        🗑<span className="tb-tip">Clear</span>
      </button>
    </div>
  );
}
