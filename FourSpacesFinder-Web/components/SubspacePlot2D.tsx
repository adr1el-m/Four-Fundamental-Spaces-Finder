import React, { useRef, useEffect, useState } from 'react';
import { isZeroVector, cross2 } from '@/lib/math';

interface SubspacePlot2DProps {
  basisVectors: number[][];
  accentColor: string; // hex or rgba
}

export function SubspacePlot2D({ basisVectors, accentColor }: SubspacePlot2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const wheelOpts: AddEventListenerOptions = { passive: false };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY);
      setZoom(z => Math.min(5, Math.max(0.2, z * (delta > 0 ? 0.9 : 1.1))));
    };

    el.addEventListener('wheel', onWheel, wheelOpts);
    return () => {
      el.removeEventListener('wheel', onWheel, wheelOpts);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const withShadow = (draw: () => void) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      draw();
      ctx.restore();
    };

    const roundedRectPath = (x: number, y: number, w: number, h: number, r: number) => {
      const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.arcTo(x + w, y, x + w, y + radius, radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
      ctx.lineTo(x + radius, y + h);
      ctx.arcTo(x, y + h, x, y + h - radius, radius);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
    };

    const drawVectorLabel = (x: number, y: number, title: string, subtitle: string, color: string) => {
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const padX = 6;
      const padY = 5;
      const lineGap = 6;

      ctx.font = 'bold 12px monospace';
      const titleMetrics = ctx.measureText(title);
      const titleH =
        (titleMetrics.actualBoundingBoxAscent ?? 8) + (titleMetrics.actualBoundingBoxDescent ?? 4);

      ctx.font = '11px monospace';
      const subMetrics = ctx.measureText(subtitle);
      const subH = (subMetrics.actualBoundingBoxAscent ?? 7) + (subMetrics.actualBoundingBoxDescent ?? 3);

      const width = Math.max(titleMetrics.width, subMetrics.width);
      const titleY = y;
      const subY = y + (titleH / 2) + lineGap + (subH / 2);
      const top = titleY - titleH / 2 - padY;
      const bottom = subY + subH / 2 + padY;
      const height = bottom - top;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      roundedRectPath(x - padX, top, width + padX * 2, height, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.lineWidth = 4;
      ctx.font = 'bold 12px monospace';
      ctx.strokeText(title, x, titleY);
      ctx.fillText(title, x, titleY);

      ctx.font = '11px monospace';
      ctx.lineWidth = 3;
      ctx.strokeText(subtitle, x, subY);
      ctx.fillText(subtitle, x, subY);

      ctx.restore();
    };

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = width;
    const h = height;
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)'; // Graph background
    ctx.fillRect(0, 0, w, h);

    const nonZero = basisVectors.filter(v => !isZeroVector(v));
    const maxAbs = Math.max(1, ...nonZero.flat().map(Math.abs));
    const scale = Math.min(w, h) * 0.40 / maxAbs * zoom;
    const units = Math.min(6, Math.max(2, Math.ceil(maxAbs)));

    const p = (x: number, y: number) => ({ x: cx + x * scale, y: cy - y * scale });

    // Rank 2 check (Plane)
    let rank2 = false;
    if (nonZero.length >= 2) {
        if (Math.abs(cross2(nonZero[0], nonZero[1])) > 1e-9) {
            rank2 = true;
        }
    }

    // Fill plane if rank 2
    if (rank2) {
        ctx.fillStyle = accentColor.replace(')', ', 0.1)').replace('rgb', 'rgba');
        ctx.fillRect(0, 0, w, h);
    }

    // Grid
    const drawGrid = (step: number, opacity: number) => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -units * 2; i <= units * 2; i += step) {
             const start = p(i, units);
             const end = p(i, -units);
             ctx.moveTo(start.x, start.y);
             ctx.lineTo(end.x, end.y);

             const startH = p(-units, i);
             const endH = p(units, i);
             ctx.moveTo(startH.x, startH.y);
             ctx.lineTo(endH.x, endH.y);
        }
        ctx.stroke();
    }

    drawGrid(1, 0.08);
    drawGrid(0.5, 0.04);

    // Axes
    const xAxisColor = 'rgba(255, 66, 107, 0.92)';
    const yAxisColor = 'rgba(56, 255, 107, 0.90)';
    
    // X Axis
    ctx.strokeStyle = xAxisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const xStart = p(-units, 0);
    const xEnd = p(units, 0);
    ctx.moveTo(xStart.x, xStart.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();

    // Y Axis
    ctx.strokeStyle = yAxisColor;
    ctx.beginPath();
    const yStart = p(0, -units);
    const yEnd = p(0, units);
    ctx.moveTo(yStart.x, yStart.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();

    ctx.font = 'bold 12px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = xAxisColor;
    ctx.fillText('x', xEnd.x + 6, xEnd.y);
    ctx.textAlign = 'center';
    ctx.fillStyle = yAxisColor;
    ctx.fillText('y', yEnd.x, yEnd.y - 10);

    // Vectors
    if (!rank2) {
        // Draw line or single vectors
        // If rank 1, draw line through origin along the vector
        if (nonZero.length > 0) {
            const v = nonZero[0];
            // Draw extended line
            withShadow(() => {
              ctx.strokeStyle = accentColor;
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              const start = p(-v[0] * 10, -v[1] * 10);
              const end = p(v[0] * 10, v[1] * 10);
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.stroke();
              ctx.setLineDash([]);
            });
        }
    }

    // Draw actual basis vectors
    nonZero.forEach((v, i) => {
        const end = p(v[0], v[1]);
        const vectorColor = i === 0 ? accentColor : (i === 1 ? '#00e5ff' : '#ff40ff');

        withShadow(() => {
          ctx.strokeStyle = vectorColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          // Arrow head
          const angle = Math.atan2(cy - end.y, end.x - cx); // Canvas Y is inverted
          const headLen = 10;
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLen * Math.cos(angle - Math.PI / 6),
            end.y + headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLen * Math.cos(angle + Math.PI / 6),
            end.y + headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        });

        const formatNum = (n: number) => {
          if (Number.isInteger(n)) return `${n}`;
          const rounded = Math.round(n * 100) / 100;
          return `${rounded}`;
        };

        drawVectorLabel(
          end.x + 10,
          end.y - 10,
          `v${i + 1}`,
          `(${formatNum(v[0])}, ${formatNum(v[1])})`,
          vectorColor
        );
    });

  }, [basisVectors, zoom, accentColor]);

  return (
    <div ref={containerRef} className="relative group">
      <canvas 
        ref={canvasRef}
        className="w-full aspect-square rounded-xl border border-white/20 shadow-inner bg-black/80"
      />
      
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={() => setZoom(z => Math.min(z * 1.2, 5))}
            className="w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-lg border border-white/20 hover:bg-black/80"
        >
            +
        </button>
        <button 
            onClick={() => setZoom(z => Math.max(z / 1.2, 0.2))}
            className="w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-lg border border-white/20 hover:bg-black/80"
        >
            -
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-3 left-3 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/20">
         <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ff426b]" />
                <span className="text-[10px] font-bold text-white/80">x</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#38ff6b]" />
                <span className="text-[10px] font-bold text-white/80">y</span>
            </div>
         </div>
      </div>
    </div>
  );
}
