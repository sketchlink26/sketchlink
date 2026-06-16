import { useRef, useEffect, useState, useCallback } from 'react';

export default function useCanvas(tool, color, strokeWidth, zoom = 1) {
  const canvasRef  = useRef(null);
  const ctxRef     = useRef(null);
  const drawing    = useRef(false);
  const startPos   = useRef({ x: 0, y: 0 });
  const snapshot   = useRef(null);
  const curPath    = useRef([]);
  const [strokes, setStrokes] = useState([]);
  const strokesRef = useRef([]);

  // Drag state
  const isDragging   = useRef(false);
  const dragIndex    = useRef(-1);
  const lastDragPos  = useRef({ x: 0, y: 0 });
  const [isDraggingElement, setIsDraggingElement] = useState(false);

  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const resize = () => {
      const w = canvas.offsetWidth  || (window.innerWidth  - 320);
      const h = canvas.offsetHeight || (window.innerHeight - 76);
      canvas.width  = w;
      canvas.height = h;
      redrawAll(ctx, strokesRef.current);
    };

    const t1 = setTimeout(resize, 50);
    const t2 = setTimeout(resize, 300);
    window.addEventListener('resize', resize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const r  = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = r.width  > 0 ? canvas.width  / r.width  : 1;
    const scaleY = r.height > 0 ? canvas.height / r.height : 1;
    return { x: (cx - r.left) * scaleX, y: (cy - r.top) * scaleY };
  };

  const redrawAll = (ctx, stks) => {
    const c  = ctx || ctxRef.current;
    const cv = canvasRef.current;
    if (!c || !cv) return;
    c.clearRect(0, 0, cv.width, cv.height);
    stks.forEach(s => renderStroke(c, s));
  };

  const renderStroke = (ctx, s) => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth   = s.sw;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    if (s.type === 'pen') {
      if (!s.path.length) return;
      ctx.beginPath();
      ctx.moveTo(s.path[0].x, s.path[0].y);
      s.path.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    } else if (s.type === 'text') {
      ctx.font         = `${s.fs}px Outfit, sans-serif`;
      ctx.fillStyle    = s.color;
      ctx.textAlign    = s.align    || 'left';
      ctx.textBaseline = s.baseline || 'alphabetic';
      ctx.fillText(s.text, s.x, s.y);
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'alphabetic';
    } else {
      drawShape(ctx, s.type, s.x1, s.y1, s.x2, s.y2, s.color, s.sw);
    }
  };

  const drawShape = (ctx, type, x1, y1, x2, y2, clr, w) => {
    ctx.strokeStyle = clr;
    ctx.lineWidth   = w;
    ctx.lineCap     = 'round';
    ctx.beginPath();

    switch (type) {
      case 'rect':
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        break;
      case 'circle': {
        const rx = Math.abs(x2 - x1) / 2;
        const ry = Math.abs(y2 - y1) / 2;
        ctx.ellipse(x1 + (x2-x1)/2, y1 + (y2-y1)/2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'arrow': {
        const hl  = 16;
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - hl * Math.cos(ang - 0.4), y2 - hl * Math.sin(ang - 0.4));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - hl * Math.cos(ang + 0.4), y2 - hl * Math.sin(ang + 0.4));
        ctx.stroke();
        break;
      }
      case 'diamond': {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        ctx.moveTo(mx, y1); ctx.lineTo(x2, my);
        ctx.lineTo(mx, y2); ctx.lineTo(x1, my);
        ctx.closePath(); ctx.stroke();
        break;
      }
      default: break;
    }
  };

  // Returns true if canvas point (px, py) is inside/near stroke s
  const hitTest = (s, px, py) => {
    console.log('hitTest checking stroke:', s.type, 'at', px, py);
    if (s.type === 'pen') {
      return s.path.some(p => Math.hypot(p.x - px, p.y - py) < 10);
    }
    if (s.type === 'text') {
      return Math.abs(s.x - px) < 80 && Math.abs(s.y - py) < 20;
    }
    // rect, circle, diamond, arrow — all use bounding box
    const minX = Math.min(s.x1, s.x2);
    const maxX = Math.max(s.x1, s.x2);
    const minY = Math.min(s.y1, s.y2);
    const maxY = Math.max(s.y1, s.y2);
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  };

  const startDraw = useCallback((e) => {
    console.log('startDraw called, tool:', tool);
    console.log('strokes count:', strokesRef.current.length);
    if (!ctxRef.current || !canvasRef.current) return;
    const p = getPos(e);

    if (tool === 'select') {
      // Find the topmost stroke under the cursor (reverse = top-of-stack first)
      const list = strokesRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        if (hitTest(list[i], p.x, p.y)) {
          isDragging.current  = true;
          dragIndex.current   = i;
          lastDragPos.current = p;
          setIsDraggingElement(true);
          return;
        }
      }
      return; // nothing hit — do nothing
    }

    drawing.current  = true;
    startPos.current = p;
    curPath.current  = [p];
    snapshot.current = ctxRef.current.getImageData(
      0, 0, canvasRef.current.width, canvasRef.current.height
    );

    if (tool === 'pen') {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(p.x, p.y);
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth   = strokeWidth;
      ctxRef.current.lineCap     = 'round';
      ctxRef.current.lineJoin    = 'round';
    }
  }, [tool, color, strokeWidth]);

  const midDraw = useCallback((e) => {
    const p = getPos(e);

    if (isDragging.current) {
      const dx = p.x - lastDragPos.current.x;
      const dy = p.y - lastDragPos.current.y;
      const s  = strokesRef.current[dragIndex.current];
      if (s) {
        if (s.type === 'pen') {
          s.path.forEach(pt => { pt.x += dx; pt.y += dy; });
        } else if (s.type === 'text') {
          s.x += dx;
          s.y += dy;
        } else {
          s.x1 += dx; s.y1 += dy;
          s.x2 += dx; s.y2 += dy;
        }
        lastDragPos.current = p;
        redrawAll(ctxRef.current, strokesRef.current);
      }
      return;
    }

    if (!drawing.current || !ctxRef.current) return;
    curPath.current.push(p);
    const { x: sx, y: sy } = startPos.current;

    if (tool === 'pen') {
      ctxRef.current.lineTo(p.x, p.y);
      ctxRef.current.stroke();
    } else if (tool === 'eraser') {
      ctxRef.current.clearRect(p.x - 14, p.y - 14, 28, 28);
    } else {
      ctxRef.current.putImageData(snapshot.current, 0, 0);
      drawShape(ctxRef.current, tool, sx, sy, p.x, p.y, color, strokeWidth);
    }
  }, [tool, color, strokeWidth]);

  const endDraw = useCallback((e, onStrokeEnd) => {
    if (isDragging.current) {
      isDragging.current = false;
      dragIndex.current  = -1;
      setIsDraggingElement(false);
      // Sync React state with the in-place mutations from drag
      setStrokes([...strokesRef.current]);
      return;
    }

    if (!drawing.current) return;
    drawing.current = false;

    const last = curPath.current[curPath.current.length - 1] || startPos.current;
    const { x: sx, y: sy } = startPos.current;

    let newStroke = null;

    if (tool === 'pen' && curPath.current.length > 1) {
      newStroke = { type:'pen', path:[...curPath.current], color, sw: strokeWidth };
    } else if (['rect','circle','arrow','diamond'].includes(tool)) {
      newStroke = { type:tool, x1:sx, y1:sy, x2:last.x, y2:last.y, color, sw: strokeWidth };
    }

    if (newStroke) {
      const updated = [...strokesRef.current, newStroke];
      strokesRef.current = updated;
      setStrokes(updated);
      if (onStrokeEnd) onStrokeEnd(newStroke);
    }
  }, [tool, color, strokeWidth]);

  const addText = useCallback((x, y, text) => {
    if (!ctxRef.current) return;
    const fs  = 14 + strokeWidth * 2;
    const ctx = ctxRef.current;
    ctx.font      = `${fs}px Outfit, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(text, x, y);
    const s = { type:'text', x, y, text, color, sw: strokeWidth, fs };
    const updated = [...strokesRef.current, s];
    strokesRef.current = updated;
    setStrokes(updated);
    return s;
  }, [color, strokeWidth]);

  const addRemoteStroke = useCallback((stroke) => {
    if (!ctxRef.current) return;
    renderStroke(ctxRef.current, stroke);
    const updated = [...strokesRef.current, stroke];
    strokesRef.current = updated;
    setStrokes(updated);
  }, []);

  const undo = useCallback(() => {
    if (!strokesRef.current.length) return;
    const updated = strokesRef.current.slice(0, -1);
    strokesRef.current = updated;
    setStrokes(updated);
    redrawAll(ctxRef.current, updated);
  }, []);

  const clear = useCallback(() => {
    if (!ctxRef.current || !canvasRef.current) return;
    strokesRef.current = [];
    setStrokes([]);
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const exportPNG = useCallback(() => {
    if (!canvasRef.current) return;
    const a    = document.createElement('a');
    a.download = 'sketchlink-board.png';
    a.href     = canvasRef.current.toDataURL('image/png');
    a.click();
  }, []);

  return {
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
    isDraggingElement,
  };
}
