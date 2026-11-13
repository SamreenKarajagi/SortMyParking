import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { fmtTime } from '../lib/assistant';
import { directionsUrl } from '../lib/geo';
import { Navigate } from './icons';

function useNow(ms = 1000) {
  const [n, setN] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setN(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return n;
}

export default function Ticket({ booking, spot, onExtend, onEnd }) {
  const [qr, setQr] = useState('');
  const now = useNow();
  useEffect(() => {
    QRCode.toDataURL(JSON.stringify({ c: booking.code, s: booking.spotId, p: booking.plate, t: booking.end }), {
      margin: 0,
      width: 220,
      color: { dark: '#172033', light: '#ffffff' },
    }).then(setQr);
  }, [booking.code, booking.end]);

  const left = new Date(booking.end) - now;
  const notStarted = new Date(booking.start) - now > 0;
  const mins = Math.max(0, Math.floor(left / 60000));
  const hh = Math.floor(mins / 60);
  const mm = String(mins % 60).padStart(2, '0');
  const ss = String(Math.max(0, Math.floor((left % 60000) / 1000))).padStart(2, '0');
  const low = left < 15 * 60000;

  return (
    <article className="ticket">
      <div className="ticket-top">
        <span className="sign big sign-light">P</span>
        <div>
          <h2>{spot.name}</h2>
          <p>{spot.area}</p>
        </div>
      </div>
      <div className="ticket-perf" aria-hidden="true" />
      <div className="ticket-body">
        <div className="plate">{booking.plate}</div>
        <div className="ticket-grid">
          <div><span>From</span><strong>{fmtTime(new Date(booking.start))}</strong></div>
          <div><span>Until</span><strong>{fmtTime(new Date(booking.end))}</strong></div>
          <div><span>Paid</span><strong>₹{booking.amount}</strong></div>
        </div>
        <div className={`countdown${low ? ' low' : ''}`}>
          {left <= 0 ? (
            <span>Time's up. Extend now to avoid overstay charges.</span>
          ) : notStarted ? (
            <span>Your slot is held from {fmtTime(new Date(booking.start))}</span>
          ) : (
            <>
              <strong>{hh > 0 ? `${hh}:${mm}` : `${mins}`}<small>{hh > 0 ? '' : `:${ss}`}</small></strong>
              <span>{hh > 0 ? 'hours left' : 'minutes left'}</span>
            </>
          )}
        </div>
        <div className="qr">
          {qr && <img src={qr} alt={`Entry code ${booking.code}`} width="132" height="132" />}
          <div>
            <span>Show at the gate</span>
            <code>{booking.code}</code>
          </div>
        </div>
      </div>
      <div className="ticket-actions">
        <button className="btn primary" onClick={onExtend}>Extend 1 hr, ₹{spot.rate[booking.vehicle]}</button>
        <a className="btn" href={directionsUrl(spot)} target="_blank" rel="noreferrer"><Navigate /> Directions</a>
        <button className="btn ghost" onClick={onEnd}>End parking</button>
      </div>
    </article>
  );
}
