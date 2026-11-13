import { useEffect, useMemo, useRef, useState } from 'react';
import { project, MAP_W, MAP_H } from '../lib/geo';
import { LANDMARKS, TOW_ZONES } from '../data/pune';
import { Plus, Minus } from './icons';

// A schematic city map drawn from coordinates. No tile server, no API key,
// loads instantly on a 4G connection near Deccan, and stays readable at a glance.
// Turn-by-turn navigation is handed off to Google Maps.

const pts = (arr) => arr.map(([la, ln]) => { const p = project(la, ln); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');

const RIVERS = [
  [[18.6, 73.74], [18.585, 73.775], [18.575, 73.795], [18.566, 73.81], [18.555, 73.825], [18.545, 73.84], [18.533, 73.855]],
  [[18.465, 73.775], [18.48, 73.79], [18.495, 73.81], [18.505, 73.825], [18.513, 73.84], [18.52, 73.85], [18.533, 73.855]],
  [[18.533, 73.855], [18.538, 73.87], [18.545, 73.88], [18.541, 73.895], [18.548, 73.905], [18.552, 73.92], [18.548, 73.935], [18.556, 73.96]],
];

const ROADS = [
  { n: 'Mumbai Bengaluru Highway', w: 4, p: [[18.63, 73.745], [18.598, 73.765], [18.575, 73.78], [18.555, 73.79], [18.53, 73.795], [18.505, 73.8], [18.46, 73.815]] },
  { n: 'Hinjewadi road', w: 3, p: [[18.5869, 73.7055], [18.591, 73.739], [18.598, 73.765]] },
  { n: 'Baner Road', w: 3, p: [[18.571, 73.772], [18.559, 73.787], [18.558, 73.808]] },
  { n: 'University Road', w: 3, p: [[18.558, 73.808], [18.552, 73.825], [18.54, 73.838], [18.531, 73.847]] },
  { n: 'SB Road', w: 2, p: [[18.552, 73.825], [18.533, 73.83], [18.523, 73.838]] },
  { n: 'Karve Road', w: 3, p: [[18.507, 73.804], [18.508, 73.82], [18.512, 73.832], [18.517, 73.842]] },
  { n: 'FC Road', w: 2, p: [[18.5165, 73.841], [18.53, 73.8415]] },
  { n: 'JM Road', w: 2, p: [[18.513, 73.8465], [18.528, 73.848]] },
  { n: 'Shivajinagar to Swargate', w: 3, p: [[18.531, 73.849], [18.519, 73.855], [18.501, 73.863]] },
  { n: 'Satara Road', w: 3, p: [[18.501, 73.863], [18.478, 73.865], [18.46, 73.86]] },
  { n: 'Sinhagad Road', w: 2, p: [[18.505, 73.845], [18.48, 73.825], [18.46, 73.815]] },
  { n: 'Station Road', w: 2, p: [[18.531, 73.849], [18.529, 73.874]] },
  { n: 'Camp', w: 2, p: [[18.529, 73.874], [18.515, 73.879]] },
  { n: 'Nagar Road', w: 3, p: [[18.529, 73.874], [18.545, 73.885], [18.552, 73.895], [18.558, 73.91], [18.56, 73.925], [18.556, 73.945], [18.553, 73.97]] },
  { n: 'Airport Road', w: 2, p: [[18.558, 73.91], [18.57, 73.913], [18.582, 73.919]] },
  { n: 'North Main Road', w: 2, p: [[18.529, 73.876], [18.537, 73.893], [18.545, 73.903]] },
  { n: 'Solapur Road', w: 3, p: [[18.515, 73.879], [18.507, 73.905], [18.505, 73.925], [18.5, 73.97]] },
  { n: 'Magarpatta Road', w: 2, p: [[18.507, 73.905], [18.5155, 73.927], [18.519, 73.935]] },
  { n: 'Kharadi bypass', w: 2, p: [[18.519, 73.935], [18.535, 73.94], [18.556, 73.945]] },
];

const METRO = [
  [[18.5076, 73.8046], [18.508, 73.82], [18.512, 73.832], [18.517, 73.842], [18.524, 73.85], [18.528, 73.856], [18.529, 73.874], [18.545, 73.885], [18.5555, 73.9111]],
  [[18.63, 73.8], [18.6, 73.81], [18.57, 73.83], [18.545, 73.843], [18.531, 73.849], [18.528, 73.856], [18.515, 73.858], [18.501, 73.8637]],
];

const MAJOR = new Set(['hinjewadi', 'wakad', 'baner', 'aundh', 'university', 'shivajinagar', 'kp', 'viman', 'airport', 'kharadi', 'hadapsar', 'kothrud', 'swargate', 'camp']);

const LEVEL_FILL = { plenty: '#13795B', filling: '#D99A00', tight: '#E0662B', full: '#CF3A2C' };

export default function CityMap({ spots, preds, selectedId, onSelect, dest, parked, focus }) {
  const ref = useRef(null);
  const [vb, setVb] = useState(() => {
    const c = project(18.54, 73.826);
    const w = MAP_W * 0.9;
    return { x: c.x - w / 2, y: c.y - (w * 0.7) / 2, w, h: w * 0.7 };
  });
  const drag = useRef(null);
  const [aspect, setAspect] = useState(1.4);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.height) setAspect(r.width / r.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // keep the viewBox matched to the element's aspect
  const view = useMemo(() => {
    const h = vb.w / aspect;
    return { x: vb.x, y: vb.y + (vb.h - h) / 2, w: vb.w, h };
  }, [vb, aspect]);

  const zoom = (f, cx, cy) =>
    setVb((v) => {
      const w = Math.min(MAP_W * 1.1, Math.max(MAP_W * 0.08, v.w * f));
      const k = w / v.w;
      const ox = cx ?? v.x + v.w / 2;
      const oy = cy ?? v.y + v.h / 2;
      return { x: ox - (ox - v.x) * k, y: oy - (oy - v.y) * k, w, h: v.h * k };
    });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const cx = view.x + ((e.clientX - r.left) / r.width) * view.w;
      const cy = view.y + ((e.clientY - r.top) / r.height) * view.h;
      zoom(e.deltaY > 0 ? 1.15 : 0.87, cx, cy);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [view]);

  // Fly to whatever the panel focuses on
  useEffect(() => {
    if (!focus) return;
    const p = project(focus.lat, focus.lng);
    setVb((v) => {
      const w = Math.min(v.w, MAP_W * 0.26);
      const h = v.h * (w / v.w);
      return { x: p.x - w / 2, y: p.y - h / 2, w, h };
    });
  }, [focus?.lat, focus?.lng, focus?.k]);

  const onDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, vb, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const r = ref.current.getBoundingClientRect();
    const dx = ((e.clientX - d.x) / r.width) * view.w;
    const dy = ((e.clientY - d.y) / r.height) * view.h;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true;
    setVb({ ...d.vb, x: d.vb.x - dx, y: d.vb.y - dy });
  };
  const onUp = () => {
    setTimeout(() => (drag.current = null), 0);
  };

  const s = Math.min(view.w, view.h * 1.6) / 30; // pin size in map units, constant on screen
  const fs = s / 1.9;

  return (
    <div className="map" ref={ref}>
      <svg
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="application"
        aria-label="Map of Pune parking"
      >
        <defs>
          <pattern id="kerb" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="12" fill="#CF3A2C" />
          </pattern>
        </defs>
        <rect x={-MAP_W} y={-MAP_H} width={MAP_W * 3} height={MAP_H * 3} fill="var(--land)" />
        {RIVERS.map((r, i) => (
          <polyline key={i} points={pts(r)} fill="none" stroke="var(--river)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ))}
        {ROADS.map((r) => (
          <polyline key={r.n} points={pts(r.p)} fill="none" stroke="#fff" strokeWidth={r.w * 1.6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ))}
        {METRO.map((m, i) => (
          <polyline key={i} points={pts(m)} fill="none" stroke={i ? '#7A4FB5' : '#2E8FA6'} strokeOpacity="0.55" strokeWidth="2.2" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
        ))}
        {TOW_ZONES.map((z) => {
          const p = project(z.lat, z.lng);
          const rr = (z.r / 1000) * 32.4; // metres to map units (1 km ≈ 32.4 units)
          return <circle key={z.id} cx={p.x} cy={p.y} r={rr} fill="url(#kerb)" fillOpacity="0.16" stroke="#CF3A2C" strokeOpacity="0.45" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />;
        })}
        {LANDMARKS.filter((l) => view.w < MAP_W * 0.42 || MAJOR.has(l.id)).map((l) => {
            const p = project(l.lat, l.lng);
            return (
              <text key={l.id} x={p.x} y={p.y + s * 0.62} fontSize={fs} className="map-label" textAnchor="middle">
                {l.name}
              </text>
            );
          })}
        {dest && (() => {
          const p = project(dest.lat, dest.lng);
          return (
            <g transform={`translate(${p.x} ${p.y})`} className="dest">
              <circle r={s * 0.9} fill="var(--ink)" fillOpacity="0.1" />
              <circle r={s * 0.28} fill="var(--ink)" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })()}
        {parked && (() => {
          const p = project(parked.lat, parked.lng);
          return (
            <g transform={`translate(${p.x} ${p.y})`}>
              <circle r={s * 0.35} fill="var(--kerb)" stroke="var(--ink)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })()}
        {spots.map((sp) => {
          const p = project(sp.lat, sp.lng);
          const pr = preds[sp.id];
          const sel = sp.id === selectedId;
          const k = sel ? 1.45 : 1;
          const w = s * 0.62 * k;
          const host = sp.type === 'host';
          return (
            <g
              key={sp.id}
              transform={`translate(${p.x} ${p.y})`}
              className={`pin${sel ? ' sel' : ''}`}
              onClick={() => !drag.current?.moved && onSelect(sp.id)}
              tabIndex={0}
              role="button"
              aria-label={`${sp.name}, ${pr.level}`}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(sp.id)}
            >
              <rect x={-w / 2} y={-w * 1.25} width={w} height={w} rx={w * 0.14} fill={host ? 'var(--kerb)' : 'var(--sign)'} stroke="#fff" strokeWidth={sel ? 2.5 : 1.5} vectorEffect="non-scaling-stroke" />
              <text y={-w * 0.47} fontSize={w * 0.7} textAnchor="middle" className="pin-p" fill={host ? 'var(--ink)' : '#fff'}>
                {sp.type === 'metro' ? 'M' : 'P'}
              </text>
              <rect x={-w / 2} y={-w * 0.18} width={w} height={w * 0.2} rx={w * 0.06} fill={LEVEL_FILL[pr.level]} />
              <line x1="0" y1={-w * 0.25} x2="0" y2={-w * 0.18} stroke="#fff" />
            </g>
          );
        })}
      </svg>
      <div className="map-ctrl">
        <button onClick={() => zoom(0.75)} aria-label="Zoom in"><Plus /></button>
        <button onClick={() => zoom(1.33)} aria-label="Zoom out"><Minus /></button>
      </div>
      <div className="map-legend">
        <span><i style={{ background: LEVEL_FILL.plenty }} />Plenty</span>
        <span><i style={{ background: LEVEL_FILL.filling }} />Filling</span>
        <span><i style={{ background: LEVEL_FILL.tight }} />Tight</span>
        <span><i style={{ background: LEVEL_FILL.full }} />Full</span>
        <span><i className="kerb-chip" />Towing zone</span>
      </div>
    </div>
  );
}
