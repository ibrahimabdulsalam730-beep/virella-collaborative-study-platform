"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { 
  Pen, 
  Highlighter, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Download, 
  Grid, 
  Maximize2 
} from "lucide-react";

export interface StrokePoint {
  x: number;
  y: number;
}

export interface WhiteboardStroke {
  id: string;
  tool: "pen" | "highlighter" | "eraser" | "line" | "rect" | "circle";
  color: string;
  width: number;
  points: StrokePoint[];
  timestamp: number;
  userId?: string;
}

interface SharedWhiteboardProps {
  roomId: string;
  userId?: string;
  userName?: string;
  onStrokeBroadcast?: (stroke: WhiteboardStroke) => void;
  externalStrokes?: WhiteboardStroke[];
  onClearBroadcast?: () => void;
}

export default function SharedWhiteboard({
  roomId,
  userId = "user_me",
  userName = "Scholar",
  onStrokeBroadcast,
  externalStrokes = [],
  onClearBroadcast,
}: SharedWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<"pen" | "highlighter" | "eraser" | "line" | "rect" | "circle">("pen");
  const [selectedColor, setSelectedColor] = useState<string>("#b4f000"); // Lime default
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardStroke[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<StrokePoint[]>([]);

  // Theme color palette
  const PALETTE = [
    "#b4f000", // Virella Lime
    "#c084fc", // Lavender Violet
    "#38bdf8", // Sky Cyan
    "#f43f5e", // Rose Pink
    "#facc15", // Amber
    "#ffffff", // Clean White
    "#94a3b8", // Slate
  ];

  // Load persisted strokes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`virella_wb_${roomId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setStrokes(parsed);
        }
      }
    } catch {
      // Ignore storage error
    }
  }, [roomId]);

  // Persist strokes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`virella_wb_${roomId}`, JSON.stringify(strokes));
    } catch {
      // Ignore storage error
    }
  }, [strokes, roomId]);

  // Merge external strokes received from peers
  useEffect(() => {
    if (externalStrokes.length > 0) {
      setStrokes((prev) => {
        const map = new Map(prev.map((s) => [s.id, s]));
        externalStrokes.forEach((s) => map.set(s.id, s));
        return Array.from(map.values());
      });
    }
  }, [externalStrokes]);

  // Redraw canvas whenever strokes change or grid toggled
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = stroke.width * 2.5;
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else if (stroke.tool === "highlighter") {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = stroke.width * 3.5;
        ctx.strokeStyle = stroke.color;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = stroke.width;
        ctx.strokeStyle = stroke.color;
      }

      if (stroke.tool === "line") {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (stroke.tool === "rect") {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (stroke.tool === "circle") {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = Math.min(start.x, end.x) + rx;
        const cy = Math.min(start.y, end.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Freehand pen / eraser / highlighter
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [strokes, showGrid]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Adjust canvas resolution to parent size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redrawCanvas();
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [redrawCanvas]);

  // MOUSE & TOUCH EVENT HANDLERS
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coord = getCoordinates(e);
    if (!coord) return;
    isDrawingRef.current = true;
    currentPointsRef.current = [coord];
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const coord = getCoordinates(e);
    if (!coord) return;

    currentPointsRef.current.push(coord);

    // Live preview on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw existing strokes
    redrawCanvas();

    // Draw active stroke preview
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (activeTool === "eraser") {
      ctx.lineWidth = strokeWidth * 2.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    } else if (activeTool === "highlighter") {
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = strokeWidth * 3.5;
      ctx.strokeStyle = selectedColor;
    } else {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = selectedColor;
    }

    const pts = currentPointsRef.current;
    if (activeTool === "line") {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(coord.x, coord.y);
      ctx.stroke();
    } else if (activeTool === "rect") {
      ctx.strokeRect(pts[0].x, pts[0].y, coord.x - pts[0].x, coord.y - pts[0].y);
    } else if (activeTool === "circle") {
      const rx = Math.abs(coord.x - pts[0].x) / 2;
      const ry = Math.abs(coord.y - pts[0].y) / 2;
      const cx = Math.min(pts[0].x, coord.x) + rx;
      const cy = Math.min(pts[0].y, coord.y) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      const newStroke: WhiteboardStroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        tool: activeTool,
        color: selectedColor,
        width: strokeWidth,
        points: [...currentPointsRef.current],
        timestamp: Date.now(),
        userId,
      };

      setStrokes((prev) => [...prev, newStroke]);
      setRedoStack([]); // Clear redo stack on new action
      onStrokeBroadcast?.(newStroke);
    }

    currentPointsRef.current = [];
  };

  // UNDO / REDO
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setStrokes((prev) => [...prev, next]);
    onStrokeBroadcast?.(next);
  };

  // CLEAR WHITEBOARD
  const handleClear = () => {
    if (window.confirm("Clear shared whiteboard for everyone in the room?")) {
      setStrokes([]);
      setRedoStack([]);
      localStorage.removeItem(`virella_wb_${roomId}`);
      onClearBroadcast?.();
    }
  };

  // EXPORT AS PNG
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `virella-whiteboard-${roomId}-${Date.now()}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0812] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0e0c18] border-b border-white/[0.08] select-none">
        
        {/* DRAWING TOOLS */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTool("pen")}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === "pen" ? "bg-[#b4f000] text-black" : "text-slate-300 hover:bg-white/10"
            }`}
            title="Pen"
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("highlighter")}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === "highlighter" ? "bg-[#b4f000] text-black" : "text-slate-300 hover:bg-white/10"
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("eraser")}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === "eraser" ? "bg-[#b4f000] text-black" : "text-slate-300 hover:bg-white/10"
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-white/10 mx-1" />

          {/* SHAPES */}
          <button
            onClick={() => setActiveTool("line")}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === "line" ? "bg-[#b4f000] text-black" : "text-slate-300 hover:bg-white/10"
            }`}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("rect")}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === "rect" ? "bg-[#b4f000] text-black" : "text-slate-300 hover:bg-white/10"
            }`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("circle")}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === "circle" ? "bg-[#b4f000] text-black" : "text-slate-300 hover:bg-white/10"
            }`}
            title="Circle / Ellipse"
          >
            <Circle className="w-4 h-4" />
          </button>
        </div>

        {/* COLOR PALETTE */}
        <div className="flex items-center gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`w-5 h-5 rounded-full transition-transform ${
                selectedColor === c ? "scale-125 ring-2 ring-white/50" : "hover:scale-110"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* STROKE WIDTH */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Size</span>
          <input
            type="range"
            min="1"
            max="16"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-16 accent-[#b4f000]"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              showGrid ? "text-[#b4f000] bg-white/5" : "text-slate-400 hover:bg-white/5"
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
            title="Clear board"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
            title="Export as PNG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* CANVAS DRAWING SURFACE */}
      <div className="relative flex-1 w-full h-full cursor-crosshair overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={drawMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={drawMove}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 block w-full h-full"
        />

        {/* Realtime synced status indicator badge */}
        <div className="absolute bottom-3 left-3 pointer-events-none glass-panel px-2.5 py-1 rounded-full text-[10px] font-mono text-purple-300 border border-white/10 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b4f000] animate-pulse" />
          <span>REALTIME STROKES BATCHED ({strokes.length})</span>
        </div>
      </div>
    </div>
  );
}
