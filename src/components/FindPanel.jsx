import { useMemo, useState } from 'react';
import { LANDMARKS, TYPE_LABEL } from '../data/pune';
import { LEVEL_TEXT } from '../lib/predict';
import { fmtWhen } from '../lib/assistant';
import BayBar from './BayBar';
import { Car, Bike, Search, Close } from './icons';

export const WHEN_PRESETS = [
  { key: 'now', label: 'Now', make: () => new Date() },
  { key: '1h', label: 'In 1 hr', make: () => new Date(Date.now() + 3600000) },
  { key: 'tonight', label: 'Tonight 8 pm', make: () => { const d = new Date(); if (d.getHours() >= 21) d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0); return d; } },
  { key: 'sat', label: 'Sat 6 pm', make: () => { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); d.setHours(18, 0, 0, 0); return d; } },
  { key: 'mon', label: 'Mon 10 am', make: () => { const d = new Date(); d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7 || 7)); d.setHours(10, 0, 0, 0); return d; } },
];

const FILTERS = [
  ['cheap', 'Cheapest'],
  ['covered', 'Covered'],
  ['ev', 'EV charging'],
  ['metro', 'Park and ride'],
  ['host', 'Host spots'],
];

export function VehicleToggle({ value, onChange }) {
  return (
    <div className="seg" role="radiogroup" aria-label="Vehicle">
      <button role="radio" aria-checked={value === 'car'} className={value === 'car' ? 'on' : ''} onClick={() => onChange('car')}>
        <Car /> Car
      </button>
      <button role="radio" aria-checked={value === 'bike'} className={value === 'bike' ? 'on' : ''} onClick={() => onChange('bike')}>
        <Bike /> Bike
      </button>
    </div>
  );
}

export default function FindPanel({ dest, setDest, vehicle, setVehicle, whenKey, setWhenKey, when, filters, setFilters, ranked, onOpen }) {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const sugg = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return LANDMARKS.slice(0, 6);
    return LANDMARKS.filter((l) => l.name.toLowerCase().includes(t) || l.aliases.some((a) => a.includes(t))).slice(0, 6);
  }, [q]);

  const list = ranked.slice(0, dest ? 10 : 12);

  return (
    <div className="find">
      <h1 className="ask-h">Where are you headed?</h1>
      <div className={`searchbox${focused ? ' open' : ''}`}>
        <Search />
        {dest && !focused ? (
          <button className="dest-chip" onClick={() => { setQ(''); setFocused(true); }}>
            {dest.name}
          </button>
        ) : (
          <input
            value={q}
            autoFocus={focused}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="FC Road, Phoenix, Hinjewadi Phase 1…"
            aria-label="Destination"
          />
        )}
        {dest && (
          <button className="icon-btn" aria-label="Clear destination" onClick={() => { setDest(null); setQ(''); }}>
            <Close />
          </button>
        )}
        {focused && sugg.length > 0 && (
          <ul className="sugg" role="listbox">
            {sugg.map((l) => (
              <li key={l.id}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setDest(l); setQ(''); setFocused(false); }}>
                  {l.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="row-controls">
        <VehicleToggle value={vehicle} onChange={setVehicle} />
      </div>
      <div className="chips when" aria-label="Arriving">
        {WHEN_PRESETS.map((p) => (
          <button key={p.key} className={`chip${whenKey === p.key ? ' on' : ''}`} onClick={() => setWhenKey(p.key)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="chips" aria-label="Filters">
        {FILTERS.map(([k, label]) => (
          <button key={k} className={`chip ghost${filters[k] ? ' on' : ''}`} aria-pressed={!!filters[k]} onClick={() => setFilters({ ...filters, [k]: !filters[k] })}>
            {label}
          </button>
        ))}
      </div>

      <p className="list-head">
        {dest ? `Best bets near ${dest.name}, ${fmtWhen(when)}` : `Easiest places to park ${fmtWhen(when)}`}
      </p>
      {list.length === 0 && <p className="empty">No spots match these filters. Turn one off to see more.</p>}
      <ol className="spots">
        {list.map((r, i) => (
          <li key={r.spot.id}>
            <button className="spot" onClick={() => onOpen(r.spot.id)}>
              <div className="spot-main">
                <span className={`sign sign-${r.spot.type}`}>{r.spot.type === 'metro' ? 'M' : 'P'}</span>
                <div>
                  <strong>{r.spot.name}</strong>
                  <span className="sub">
                    {r.spot.area}
                    {r.walk != null && <>, {r.walk} min walk</>}
                  </span>
                </div>
                <span className="price">
                  ₹{r.spot.rate[vehicle]}
                  <small>/hr</small>
                </span>
              </div>
              <div className="spot-meta">
                <BayBar occ={r.pred.occ} level={r.pred.level} />
                <span className={`lvl lvl-${r.pred.level}`}>
                  {r.pred.open ? `${LEVEL_TEXT[r.pred.level]}, ~${r.pred.free[vehicle]} free` : 'Closed then'}
                </span>
                {dest && i === 0 && <span className="best">Top pick</span>}
                {r.spot.type === 'host' && <span className="tag">{TYPE_LABEL.host}</span>}
                {r.pred.source === 'report' && <span className="tag live">Reported {r.pred.ageMin} min ago</span>}
              </div>
            </button>
          </li>
        ))}
      </ol>
      <p className="fine">
        Availability is predicted from time of day, day of week, city events and reports from other drivers. Rates are indicative.
      </p>
    </div>
  );
}
