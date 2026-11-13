import { TYPE_LABEL, TOW_ZONES } from '../data/pune';
import { LEVEL_TEXT, dayForecast, betterWindow, levelOf } from '../lib/predict';
import { fmtTime, fmtWhen } from '../lib/assistant';
import { directionsUrl, towZoneAt, walkMinutes } from '../lib/geo';
import { Back, Navigate } from './icons';
import BayBar from './BayBar';

const FEAT = { covered: 'Covered', cctv: 'CCTV', ev: 'EV charging', valet: 'Valet', attendant: 'Attendant on site', metro: 'Metro station', gated: 'Gated society' };

export default function SpotDetail({ spot, pred, when, vehicle, dest, onBack, onReserve, onReport, report }) {
  const fc = dayForecast(spot, when);
  const hourNow = when.getHours();
  const bw = betterWindow(spot, when, vehicle);
  const chance = pred.chance(vehicle);
  const tz = towZoneAt(spot, TOW_ZONES);
  const payOnArrival = spot.type === 'civic' || spot.type === 'transit';

  return (
    <div className="detail">
      <button className="back" onClick={onBack}>
        <Back /> All spots
      </button>
      <div className="detail-head">
        <span className={`sign big sign-${spot.type}`}>{spot.type === 'metro' ? 'M' : 'P'}</span>
        <div>
          <h2>{spot.name}</h2>
          <p className="sub">
            {spot.area}, {TYPE_LABEL[spot.type].toLowerCase()}
            {dest && <>, {walkMinutes(spot, dest)} min walk to {dest.name}</>}
          </p>
        </div>
      </div>

      <section className="odds">
        <div className="odds-num">
          <span className="pct">{Math.round(chance * 100)}%</span>
          <span>chance you find a {vehicle} slot {fmtWhen(when)}</span>
        </div>
        <BayBar occ={pred.occ} level={pred.level} size="lg" />
        <p className={`lvl lvl-${pred.level}`}>
          {pred.open ? `${LEVEL_TEXT[pred.level]}. About ${pred.free[vehicle]} of ${spot.cap[vehicle]} ${vehicle} slots free.` : `Closed at that time. Open ${spot.hours}.`}
          {pred.source === 'report' && ` Based on a driver report ${pred.ageMin} min ago.`}
        </p>
        {bw && (
          <p className="tip">
            Arrive at {fmtTime(bw.date)} instead and your odds go up to {Math.round(bw.chance * 100)}%.
          </p>
        )}
      </section>

      <section>
        <h3>How busy it gets</h3>
        <div className="forecast" role="img" aria-label="Hourly occupancy forecast">
          {fc.map((f) => (
            <div key={f.h} className={`fbar${f.h === hourNow ? ' now' : ''}${f.open ? '' : ' closed'}`} title={`${f.h}:00`}>
              <i className={`lvl-bg-${levelOf(f.occ)}`} style={{ height: `${Math.max(6, f.occ * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="fc-axis"><span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span><span>11 pm</span></div>
      </section>

      <section className="facts">
        <div><span>Rate</span><strong>₹{spot.rate[vehicle]}/hr</strong></div>
        <div><span>Open</span><strong>{spot.hours}</strong></div>
        <div><span>Rating</span><strong>{spot.rating.toFixed(1)}</strong></div>
      </section>
      <ul className="feats">
        {spot.feats.map((f) => <li key={f}>{FEAT[f] || f}</li>)}
      </ul>

      {tz && (
        <p className="warn">
          This lot sits inside the {tz.name} towing zone. Park inside the marked bays only, the road outside gets cleared often.
        </p>
      )}

      <div className="actions">
        <button className="btn primary" onClick={onReserve} disabled={!pred.open || spot.cap[vehicle] === 0}>
          {payOnArrival ? `Pay and park, ₹${spot.rate[vehicle]}/hr` : `Reserve for ₹${spot.rate[vehicle]}/hr`}
        </button>
        <a className="btn" href={directionsUrl(spot)} target="_blank" rel="noreferrer">
          <Navigate /> Directions
        </a>
      </div>

      <section className="report">
        <h3>Here right now? Tell other drivers</h3>
        <div className="chips">
          {[['plenty', 'Plenty free'], ['filling', 'Filling up'], ['full', 'Full']].map(([lvl, label]) => (
            <button key={lvl} className={`chip ghost${report?.level === lvl ? ' on' : ''}`} onClick={() => onReport(lvl)}>
              {label}
            </button>
          ))}
        </div>
        {report && <p className="fine">Thanks. Your report shapes this spot's estimate for the next 45 minutes.</p>}
      </section>
    </div>
  );
}
