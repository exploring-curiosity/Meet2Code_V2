'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import throttle from 'lodash.throttle';

type WhiteboardCanvasProps = {
  imageData: string;
  lastUpdatedBy?: string;
  localUser?: string;
  disabled?: boolean;
  onChange: (image: string) => void;
};

const COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#f97316', '#e11d48', '#8b5cf6', '#e2e8f0'];

export function WhiteboardCanvas({ imageData, lastUpdatedBy, localUser, disabled = false, onChange }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pendingImageRef = useRef<string | null>(null);
  const [size, setSize] = useState({ width: 800, height: 480 });
  const [strokeColor, setStrokeColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  const syncWhiteboard = useMemo(
    () => throttle((canvas: HTMLCanvasElement) => onChange(canvas.toDataURL('image/png')), 250, { trailing: true }),
    [onChange]
  );

  useEffect(() => () => syncWhiteboard.cancel(), [syncWhiteboard]);

  const resizeCanvas = useCallback((nextWidth: number, nextHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.max(size.width, nextWidth);
    const height = Math.max(size.height, nextHeight);
    if (width === canvas.width && height === canvas.height) return;
    const snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const snapshotCtx = snapshot.getContext('2d');
    if (snapshotCtx) {
      snapshotCtx.drawImage(canvas, 0, 0);
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(snapshot, 0, 0);
    }
    setSize({ width, height });
  }, [size.height, size.width]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      resizeCanvas(Math.round(width), Math.round(height));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  useEffect(() => {
    if (!imageData) return;
    if (localUser && lastUpdatedBy && localUser === lastUpdatedBy) {
      return;
    }
    if (drawingRef.current) {
      pendingImageRef.current = imageData;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      if (img.width > canvas.width || img.height > canvas.height) {
        resizeCanvas(img.width, img.height);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
  }, [imageData, lastUpdatedBy, localUser, size, resizeCanvas]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.save();
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
    }
    ctx.lineWidth = tool === 'eraser' ? Math.max(10, strokeWidth * 2) : strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const point = pointFromEvent(event);
    if (!point) return;
    drawingRef.current = true;
    lastPointRef.current = point;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !drawingRef.current) return;
    const point = pointFromEvent(event);
    const last = lastPointRef.current;
    if (!point || !last) return;
    drawLine(last, point);
    lastPointRef.current = point;
    const canvas = canvasRef.current;
    if (canvas) {
      syncWhiteboard(canvas);
    }
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      syncWhiteboard.cancel();
      onChange(canvas.toDataURL('image/png'));
    }
    if (pendingImageRef.current) {
      const pending = pendingImageRef.current;
      pendingImageRef.current = null;
      if (pending) {
        const ctx = canvasRef.current?.getContext('2d');
        const canvas = canvasRef.current;
        if (ctx && canvas) {
          const img = new Image();
          img.onload = () => {
            if (img.width > canvas.width || img.height > canvas.height) {
              resizeCanvas(img.width, img.height);
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = pending;
        }
      }
    }
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-2">
        <div className="text-sm font-semibold text-slate-200">Whiteboard</div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setTool('pen');
                  setStrokeColor(color);
                }}
                className={`h-5 w-5 rounded-full border ${strokeColor === color && tool === 'pen' ? 'border-white' : 'border-slate-700'}`}
                style={{ backgroundColor: color }}
                title="Pen color"
              />
            ))}
          </div>
          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
          >
            <option value={2}>Thin</option>
            <option value={3}>Medium</option>
            <option value={5}>Thick</option>
            <option value={7}>Bold</option>
          </select>
          <button
            type="button"
            onClick={() => setTool(tool === 'pen' ? 'eraser' : 'pen')}
            className={`rounded border px-2 py-1 text-xs ${tool === 'eraser' ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 text-slate-300'}`}
          >
            {tool === 'eraser' ? 'Eraser' : 'Pen'}
          </button>
          <button
            type="button"
            onClick={clearBoard}
            className="rounded border border-rose-500/60 px-2 py-1 text-xs text-rose-300"
          >
            Clear
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto p-3">
        <canvas
          ref={canvasRef}
          style={{ width: size.width, height: size.height }}
          className={`touch-none rounded bg-slate-950 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  );
}
