import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isZeroVector } from '@/lib/math';

interface SubspacePlot3DProps {
  basisVectors: number[][];
  accentColor: string;
}

type Vec3 = [number, number, number];

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < 1e-12) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function rotateX(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

function rotateY(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

function rotateZ(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
}

function applyRotation(v: Vec3, rx: number, ry: number, rz: number): Vec3 {
  return rotateZ(rotateY(rotateX(v, rx), ry), rz);
}

function rgbaFromRgbString(rgb: string, a: number): string {
  const m = rgb.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (!m) return `rgba(255,255,255,${a})`;
  return `rgba(${m[1]},${m[2]},${m[3]},${a})`;
}

function multiplyAlpha(color: string, factor: number): string {
  const rgba = color.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9]*\.?[0-9]+)\s*\)/i);
  if (rgba) {
    const a = Math.max(0, Math.min(1, Number(rgba[4]) * factor));
    return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},${a})`;
  }
  const rgb = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgb) {
    const a = Math.max(0, Math.min(1, factor));
    return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${a})`;
  }
  return color;
}

function toVec3(v: number[]): Vec3 {
  return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0];
}

function dimensionFromBasis(raw: Vec3[]): 0 | 1 | 2 | 3 {
  const nonZero = raw.filter(v => Math.hypot(v[0], v[1], v[2]) > 1e-9);
  if (nonZero.length === 0) return 0;
  const u0 = normalize(nonZero[0]);
  if (nonZero.length === 1) return 1;

  const v1 = nonZero.find(v => {
    const u = normalize(v);
    const c = cross(u0, u);
    return Math.hypot(c[0], c[1], c[2]) > 1e-6;
  });
  if (!v1) return 1;
  const u1 = normalize(v1);
  const n = cross(u0, u1);
  if (Math.hypot(n[0], n[1], n[2]) < 1e-9) return 1;

  const uN = normalize(n);
  const v2 = nonZero.find(v => Math.abs(dot(normalize(v), uN)) > 1e-6);
  if (!v2) return 2;
  return 3;
}

export function SubspacePlot3D({ basisVectors, accentColor }: SubspacePlot3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultRotation = useMemo(() => ({ rx: -0.55, ry: 0.75, rz: 0 }), []);
  const [rotation, setRotation] = useState<{ rx: number; ry: number; rz: number }>({
    rx: -0.55,
    ry: 0.75,
    rz: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [showBox, setShowBox] = useState(true);
  const [showCoordPlanes, setShowCoordPlanes] = useState(false);
  const [showTicks, setShowTicks] = useState(true);
  const draggingRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

  const basis3 = useMemo(() => basisVectors.map(toVec3), [basisVectors]);
  const dim = useMemo(() => dimensionFromBasis(basis3), [basis3]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const wheelOpts: AddEventListenerOptions = { passive: false };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (canvasRef.current && e.target !== canvasRef.current) return;
      draggingRef.current = { active: true, x: e.clientX, y: e.clientY };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current.active) return;
      const dx = e.clientX - draggingRef.current.x;
      const dy = e.clientY - draggingRef.current.y;
      draggingRef.current.x = e.clientX;
      draggingRef.current.y = e.clientY;
      setRotation(r => ({
        rx: r.rx + dy * 0.008,
        ry: r.ry + dx * 0.008,
        rz: e.shiftKey ? r.rz + dx * 0.01 : r.rz,
      }));
    };

    const onPointerUp = () => {
      draggingRef.current.active = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY);
      setZoom(z => Math.min(4, Math.max(0.25, z * (delta > 0 ? 0.9 : 1.1))));
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, wheelOpts);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel, wheelOpts);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const w = width;
    const h = height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.fillRect(0, 0, w, h);

    const nonZero = basis3.filter(v => !isZeroVector([v[0], v[1], v[2]]));
    const maxAbs = Math.max(1, ...nonZero.flat().map(a => Math.abs(a)));
    const baseScale = Math.min(w, h) * 0.35 / maxAbs;
    const scalePx = baseScale * zoom;

    const project = (v: Vec3) => {
      const vr = applyRotation(v, rotation.rx, rotation.ry, rotation.rz);
      const z = vr[2];
      return { x: cx + vr[0] * scalePx, y: cy - vr[1] * scalePx, z };
    };

    const drawLine = (a: Vec3, b: Vec3, stroke: string, widthPx: number, dash?: number[]) => {
      const pa = project(a);
      const pb = project(b);
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = widthPx;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      ctx.restore();
    };

    const clipSegmentToBox = (a: Vec3, b: Vec3, limit: number): [Vec3, Vec3] | null => {
      let t0 = 0;
      let t1 = 1;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dz = b[2] - a[2];

      const update = (p: number, q: number) => {
        if (Math.abs(p) < 1e-12) return q >= 0;
        const r = q / p;
        if (p < 0) {
          if (r > t1) return false;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return false;
          if (r < t1) t1 = r;
        }
        return true;
      };

      if (!update(-dx, a[0] + limit)) return null;
      if (!update(dx, limit - a[0])) return null;
      if (!update(-dy, a[1] + limit)) return null;
      if (!update(dy, limit - a[1])) return null;
      if (!update(-dz, a[2] + limit)) return null;
      if (!update(dz, limit - a[2])) return null;
      if (t1 < t0) return null;

      const c0: Vec3 = [a[0] + dx * t0, a[1] + dy * t0, a[2] + dz * t0];
      const c1: Vec3 = [a[0] + dx * t1, a[1] + dy * t1, a[2] + dz * t1];
      return [c0, c1];
    };

    const drawLineDepth = (a: Vec3, b: Vec3, stroke: string, widthPx: number, dash?: number[]) => {
      const ar = applyRotation(a, rotation.rx, rotation.ry, rotation.rz);
      const br = applyRotation(b, rotation.rx, rotation.ry, rotation.rz);
      const zMid = (ar[2] + br[2]) * 0.5;
      const t = Math.max(0, Math.min(1, (zMid + units) / (2 * units)));
      const alphaFactor = 1 - t * 0.55;
      drawLine(a, b, multiplyAlpha(stroke, alphaFactor), widthPx, dash);
    };

    const drawLineDepthClipped = (a: Vec3, b: Vec3, stroke: string, widthPx: number, dash?: number[]) => {
      const clipped = clipSegmentToBox(a, b, units);
      if (!clipped) return;
      drawLineDepth(clipped[0], clipped[1], stroke, widthPx, dash);
    };

    const drawArrow = (a: Vec3, b: Vec3, stroke: string, widthPx: number, headPx: number) => {
      drawLine(a, b, stroke, widthPx);
      const pa = project(a);
      const pb = project(b);
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) return;
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;
      const tipX = pb.x;
      const tipY = pb.y;
      const backX = tipX - ux * headPx;
      const backY = tipY - uy * headPx;
      const leftX = backX + nx * (headPx * 0.55);
      const leftY = backY + ny * (headPx * 0.55);
      const rightX = backX - nx * (headPx * 0.55);
      const rightY = backY - ny * (headPx * 0.55);

      ctx.save();
      ctx.fillStyle = stroke;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawArrowClipped = (a: Vec3, b: Vec3, stroke: string, widthPx: number, headPx: number) => {
      const clipped = clipSegmentToBox(a, b, units);
      if (!clipped) return;
      drawArrow(clipped[0], clipped[1], stroke, widthPx, headPx);
    };

    const drawText = (p: Vec3, text: string, fill: string, dx: number, dy: number, font: string) => {
      const pp = project(p);
      ctx.save();
      ctx.fillStyle = fill;
      ctx.font = font;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(text, pp.x + dx, pp.y + dy);
      ctx.restore();
    };

    const viewDir: Vec3 = [0, 0, -1];
    const facingScore = (nWorld: Vec3) => dot(applyRotation(nWorld, rotation.rx, rotation.ry, rotation.rz), viewDir);

    const axesLen = maxAbs * 1.2;
    const units = Math.min(9, Math.max(4, Math.ceil(maxAbs * 1.4)));

    const planeGridStep = units <= 6 ? 1 : 2;
    const faintGrid = 'rgba(255,255,255,0.10)';
    const faintBorder = 'rgba(255,255,255,0.22)';

    if (showCoordPlanes) {
      const planes: Array<{ n: Vec3; kind: 'xy' | 'xz' | 'yz' }> = [
        { n: [0, 0, 1], kind: 'xy' },
        { n: [0, 1, 0], kind: 'xz' },
        { n: [1, 0, 0], kind: 'yz' },
      ];

      const sorted = planes
        .map(p => ({ ...p, score: facingScore(p.n) }))
        .sort((a, b) => b.score - a.score);

      sorted.forEach(({ kind, score }) => {
        const alpha = Math.min(0.14, Math.max(0.05, 0.09 + score * 0.08));
        const border = `rgba(255,255,255,${Math.min(0.26, alpha + 0.12)})`;
        const grid = `rgba(255,255,255,${Math.min(0.20, alpha + 0.08)})`;

        const corners: Vec3[] =
          kind === 'xy'
            ? [
                [-units, -units, 0],
                [units, -units, 0],
                [units, units, 0],
                [-units, units, 0],
              ]
            : kind === 'xz'
              ? [
                  [-units, 0, -units],
                  [units, 0, -units],
                  [units, 0, units],
                  [-units, 0, units],
                ]
              : [
                  [0, -units, -units],
                  [0, units, -units],
                  [0, units, units],
                  [0, -units, units],
                ];

        for (let i = -units; i <= units; i += planeGridStep) {
          if (kind === 'xy') {
            drawLineDepthClipped([-units, i, 0], [units, i, 0], grid, 1);
            drawLineDepthClipped([i, -units, 0], [i, units, 0], grid, 1);
          } else if (kind === 'xz') {
            drawLineDepthClipped([-units, 0, i], [units, 0, i], grid, 1);
            drawLineDepthClipped([i, 0, -units], [i, 0, units], grid, 1);
          } else {
            drawLineDepthClipped([0, -units, i], [0, units, i], grid, 1);
            drawLineDepthClipped([0, i, -units], [0, i, units], grid, 1);
          }
        }

        drawLineDepthClipped(corners[0], corners[1], border, 1.5);
        drawLineDepthClipped(corners[1], corners[2], border, 1.5);
        drawLineDepthClipped(corners[2], corners[3], border, 1.5);
        drawLineDepthClipped(corners[3], corners[0], border, 1.5);
      });
    }

    if (showBox) {
      const a: Vec3 = [-units, -units, -units];
      const b: Vec3 = [units, -units, -units];
      const c: Vec3 = [units, units, -units];
      const d: Vec3 = [-units, units, -units];
      const e: Vec3 = [-units, -units, units];
      const f: Vec3 = [units, -units, units];
      const g: Vec3 = [units, units, units];
      const h0: Vec3 = [-units, units, units];

      const edges: Array<[Vec3, Vec3]> = [
        [a, b], [b, c], [c, d], [d, a],
        [e, f], [f, g], [g, h0], [h0, e],
        [a, e], [b, f], [c, g], [d, h0],
      ];

      edges.forEach(([p, q]) => drawLineDepthClipped(p, q, faintBorder, 1.5));

      const faceAxes: Array<{ fixed: 'x' | 'y' | 'z'; sign: 1 | -1 }> = [
        { fixed: 'x', sign: 1 },
        { fixed: 'x', sign: -1 },
        { fixed: 'y', sign: 1 },
        { fixed: 'y', sign: -1 },
        { fixed: 'z', sign: 1 },
        { fixed: 'z', sign: -1 },
      ];

      const faceNormals: Record<string, Vec3> = {
        'x+': [1, 0, 0],
        'x-': [-1, 0, 0],
        'y+': [0, 1, 0],
        'y-': [0, -1, 0],
        'z+': [0, 0, 1],
        'z-': [0, 0, -1],
      };

      const faceScores = faceAxes
        .map(fa => {
          const key = `${fa.fixed}${fa.sign === 1 ? '+' : '-'}`;
          return { ...fa, key, score: facingScore(faceNormals[key]!) };
        })
        .sort((p, q) => q.score - p.score)
        .slice(0, 3);

      const boxStep = units <= 6 ? 1 : 2;
      faceScores.forEach(face => {
        if (face.fixed === 'x') {
          const x = face.sign * units;
          for (let t = -units; t <= units; t += boxStep) {
            drawLineDepthClipped([x, -units, t], [x, units, t], faintGrid, 1);
            drawLineDepthClipped([x, t, -units], [x, t, units], faintGrid, 1);
          }
        } else if (face.fixed === 'y') {
          const y = face.sign * units;
          for (let t = -units; t <= units; t += boxStep) {
            drawLineDepthClipped([-units, y, t], [units, y, t], faintGrid, 1);
            drawLineDepthClipped([t, y, -units], [t, y, units], faintGrid, 1);
          }
        } else {
          const z = face.sign * units;
          for (let t = -units; t <= units; t += boxStep) {
            drawLineDepthClipped([-units, t, z], [units, t, z], faintGrid, 1);
            drawLineDepthClipped([t, -units, z], [t, units, z], faintGrid, 1);
          }
        }
      });
    }

    const xAxisColor = 'rgba(255, 66, 107, 0.92)';
    const yAxisColor = 'rgba(56, 255, 107, 0.90)';
    const zAxisColor = 'rgba(120, 160, 255, 0.90)';
    drawArrowClipped([-axesLen, 0, 0], [axesLen, 0, 0], xAxisColor, 2.2, 10);
    drawArrowClipped([0, -axesLen, 0], [0, axesLen, 0], yAxisColor, 2.2, 10);
    drawArrowClipped([0, 0, -axesLen], [0, 0, axesLen], zAxisColor, 2.2, 10);

    const xTip = project([axesLen, 0, 0]);
    const yTip = project([0, axesLen, 0]);
    const zTip = project([0, 0, axesLen]);
    ctx.font = 'bold 12px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 66, 107, 0.92)';
    ctx.fillText('x', xTip.x + 8, xTip.y);
    ctx.fillStyle = 'rgba(56, 255, 107, 0.90)';
    ctx.fillText('y', yTip.x + 8, yTip.y);
    ctx.fillStyle = 'rgba(120, 160, 255, 0.90)';
    ctx.fillText('z', zTip.x + 8, zTip.y);

    if (showTicks) {
      const tickColor = 'rgba(255,255,255,0.75)';
      const small = Math.max(0.15, units * 0.04);
      const labelEvery = units <= 6 ? 1 : 2;
      const font = '11px monospace';

      for (let i = -units; i <= units; i += labelEvery) {
        if (i === 0) continue;
        drawLineDepthClipped([i, -small, 0], [i, small, 0], tickColor, 1);
        drawText([i, 0, 0], `${i}`, 'rgba(255,255,255,0.70)', 6, 0, font);
      }
      for (let i = -units; i <= units; i += labelEvery) {
        if (i === 0) continue;
        drawLineDepthClipped([-small, i, 0], [small, i, 0], tickColor, 1);
        drawText([0, i, 0], `${i}`, 'rgba(255,255,255,0.70)', 6, 0, font);
      }
      for (let i = -units; i <= units; i += labelEvery) {
        if (i === 0) continue;
        drawLineDepthClipped([0, -small, i], [0, small, i], tickColor, 1);
        drawText([0, 0, i], `${i}`, 'rgba(255,255,255,0.70)', 6, 0, font);
      }
    }

    if (dim === 2 && nonZero.length >= 2) {
      const u0 = normalize(nonZero[0]);
      const v1 = nonZero.find(v => {
        const u = normalize(v);
        const c = cross(u0, u);
        return Math.hypot(c[0], c[1], c[2]) > 1e-6;
      });
      if (v1) {
        const u1raw = normalize(v1);
        const e0 = normalize(u0);
        const u1proj = add(u1raw, scale(e0, -dot(u1raw, e0)));
        const e1 = normalize(u1proj);
        const n = normalize(cross(e0, e1));

        const cubeCorners: Vec3[] = [
          [-units, -units, -units],
          [-units, -units, units],
          [-units, units, -units],
          [-units, units, units],
          [units, -units, -units],
          [units, -units, units],
          [units, units, -units],
          [units, units, units],
        ];

        const cubeEdges: Array<[number, number]> = [
          [0, 1], [0, 2], [0, 4],
          [3, 1], [3, 2], [3, 7],
          [5, 1], [5, 4], [5, 7],
          [6, 2], [6, 4], [6, 7],
        ];

        const planePoints: Vec3[] = [];
        for (const [iA, iB] of cubeEdges) {
          const a = cubeCorners[iA]!;
          const b = cubeCorners[iB]!;
          const da = dot(n, a);
          const db = dot(n, b);
          if (Math.abs(da) < 1e-10 && Math.abs(db) < 1e-10) {
            planePoints.push(a, b);
            continue;
          }
          if (da * db > 0) continue;
          const denom = da - db;
          if (Math.abs(denom) < 1e-12) continue;
          const t = da / denom;
          if (t < -1e-9 || t > 1 + 1e-9) continue;
          const p: Vec3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
          planePoints.push(p);
        }

        const unique: Vec3[] = [];
        const eps = 1e-5;
        for (const p of planePoints) {
          if (unique.some(q => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < eps)) continue;
          unique.push(p);
        }

        if (unique.length >= 3) {
          const ordered = unique
            .map(p => {
              const x = dot(p, e0);
              const y = dot(p, e1);
              return { p, a: Math.atan2(y, x) };
            })
            .sort((u, v) => u.a - v.a)
            .map(v => v.p);

          const poly2 = ordered.map(project);
          ctx.save();
          ctx.fillStyle = rgbaFromRgbString(accentColor, 0.14);
          ctx.beginPath();
          ctx.moveTo(poly2[0]!.x, poly2[0]!.y);
          for (let i = 1; i < poly2.length; i++) ctx.lineTo(poly2[i]!.x, poly2[i]!.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          const boxStroke = 'rgba(255,255,255,0.55)';
          for (let i = 0; i < ordered.length; i++) {
            const a = ordered[i]!;
            const b = ordered[(i + 1) % ordered.length]!;
            drawLineDepthClipped(a, b, boxStroke, 1.5);
          }
        }

        const gridStroke = 'rgba(255,255,255,0.30)';
        const extent = units * 3;
        const step = units <= 6 ? 1 : 2;
        for (let k = -units; k <= units; k += step) {
          const offset1 = scale(e1, k);
          drawLineDepthClipped(add(offset1, scale(e0, -extent)), add(offset1, scale(e0, extent)), gridStroke, 1);
          const offset0 = scale(e0, k);
          drawLineDepthClipped(add(offset0, scale(e1, -extent)), add(offset0, scale(e1, extent)), gridStroke, 1);
        }

        drawLineDepthClipped([0, 0, 0], scale(n, units * 0.9), 'rgba(255,255,255,0.45)', 2, [4, 6]);
      }
    }

    if (dim === 1 && nonZero.length >= 1) {
      const v = normalize(nonZero[0]);
      const ext = units * 2;
      drawLineDepthClipped(scale(v, -ext), scale(v, ext), rgbaFromRgbString(accentColor, 0.9), 2, [6, 6]);
    }

    const vectorsToDraw = nonZero.slice(0, 3);
    vectorsToDraw.forEach((v, i) => {
      const color = i === 0 ? accentColor : (i === 1 ? '#00e5ff' : '#ff40ff');
      drawArrowClipped([0, 0, 0], v, color, 3, 10);
      
      const pEnd = project(v);
      ctx.fillStyle = color;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`v${i+1}`, pEnd.x + 8, pEnd.y - 8);

      const formatNum = (n: number) => {
        if (Number.isInteger(n)) return `${n}`;
        const rounded = Math.round(n * 100) / 100;
        return `${rounded}`;
      };
      ctx.font = '11px monospace';
      ctx.fillText(`(${formatNum(v[0])}, ${formatNum(v[1])}, ${formatNum(v[2])})`, pEnd.x + 8, pEnd.y + 10);
    });

    if (dim === 0) {
      const origin = project([0, 0, 0]);
      ctx.fillStyle = rgbaFromRgbString(accentColor, 0.9);
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [accentColor, basis3, dim, rotation, showBox, showCoordPlanes, showTicks, zoom]);

  return (
    <div className="relative group select-none" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="w-full aspect-square rounded-xl border border-white/20 shadow-inner bg-black/80 touch-none"
      />

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
        <button
          onClick={() => {
            setRotation(defaultRotation);
            setZoom(1);
          }}
          className="w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-lg border border-white/20 hover:bg-black/80 text-xs font-semibold"
        >
          R
        </button>
      </div>

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
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#78a0ff]" />
            <span className="text-[10px] font-bold text-white/80">z</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowBox(v => !v)}
          className={`px-2 py-1 rounded-md text-[10px] font-semibold border border-white/15 ${showBox ? 'text-white bg-white/10' : 'text-white/60 hover:text-white'}`}
        >
          Box
        </button>
        <button
          onClick={() => setShowCoordPlanes(v => !v)}
          className={`px-2 py-1 rounded-md text-[10px] font-semibold border border-white/15 ${showCoordPlanes ? 'text-white bg-white/10' : 'text-white/60 hover:text-white'}`}
        >
          Planes
        </button>
        <button
          onClick={() => setShowTicks(v => !v)}
          className={`px-2 py-1 rounded-md text-[10px] font-semibold border border-white/15 ${showTicks ? 'text-white bg-white/10' : 'text-white/60 hover:text-white'}`}
        >
          Ticks
        </button>
      </div>
    </div>
  );
}
