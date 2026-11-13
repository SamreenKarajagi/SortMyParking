import { useState } from 'react';
import { LANDMARKS, SPOTS, TOW_ZONES, TOW_COST } from '../data/pune';
import { directionsUrl, towZoneAt } from '../lib/geo';
import { fmtTime } from '../lib/assistant';
import Ticket from './Ticket';
import { Locate, Close } from './icons';

export default function MinePanel({ store, update, vehicle, dest, onFind, onExtend, onEnd, track }) {
  const active = store.active;
  const spot = active && SPOTS.find((s) => s.id === active.spotId);
  const [hostOpen, setHostOpen] = useState(false);
  const parked = store.parked;
  const parkedZone = parked && towZoneAt(parked, TOW_ZONES);

  const saveParked = () => {
    const fallback = () => {
      const base = dest || LANDMARKS[0];
      update(() => ({ parked: { lat: base.lat, lng: base.lng, at: Date.now(), label: `Near ${base.name}`, approx: true } }));
    };
    track('street_park_saved');
    if (!navigator.geolocation) return fallback();
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => update(() => ({ parked: { lat: pos.coords.latitude, lng: pos.coords.longitude, at: Date.now(), label: 'Where you parked' } })),
        fallback,
        { timeout: 5000, maximumAge: 60000 }
      );
    } catch {
      fallback();
    }
  };

  const hours = store.history.reduce((a, b) => a + b.hours, 0) + (active ? active.hours : 0);

  return (
    <div className="mine">
      <h1 className="ask-h">My parking</h1>

      {active && spot ? (
        <Ticket booking={active} spot={spot} onExtend={onExtend} onEnd={onEnd} />
      ) : (
        <div className="empty-card">
          <p>No active parking. Find a spot and your ticket shows up here, with a countdown and the gate code.</p>
          <button className="btn primary" onClick={onFind}>Find parking</button>
        </div>
      )}

      <section className="card">
        <h3>Parked on the street?</h3>
        {parked ? (
          <>
            <p>
              {parked.label}, since {fmtTime(new Date(parked.at))}.
              {parked.approx && ' Location is approximate because your device didn’t share GPS.'}
            </p>
            {parkedZone ? (
              <p className="warn">You're inside the {parkedZone.name} towing zone. A tow here can cost you about ₹{TOW_COST[vehicle]}. Move to a marked lot if you'll be long.</p>
            ) : (
              <p className="ok">No towing hotspot reported near here. Still, avoid gates, footpaths and yellow-striped kerbs.</p>
            )}
            <div className="actions">
              <a className="btn" href={directionsUrl(parked)} target="_blank" rel="noreferrer">Walk back to it</a>
              <button className="btn ghost" onClick={() => update(() => ({ parked: null }))}>I've left</button>
            </div>
          </>
        ) : (
          <>
            <p>Save the spot so you can find it later, and we'll check it against known towing zones.</p>
            <button className="btn" onClick={saveParked}><Locate /> Save where I parked</button>
          </>
        )}
      </section>

      <section className="stats">
        <div><strong>{store.history.length + (active ? 1 : 0)}</strong><span>Bookings</span></div>
        <div><strong>{hours}</strong><span>Hours parked</span></div>
        <div><strong>{Object.keys(store.reports).length}</strong><span>Reports shared</span></div>
      </section>

      <section className="card pass">
        <h3>SortMyParking Pass</h3>
        <p>₹99 a month. No booking fees, towing-zone alerts, and a reserved monthly spot near Hinjewadi, Kharadi or Magarpatta offices from ₹1,200.</p>
        {store.waitlist.pass ? (
          <p className="ok">You're on the list. We'll message you when Pass opens in your area.</p>
        ) : (
          <button className="btn primary" onClick={() => { update((s) => ({ waitlist: { ...s.waitlist, pass: true } })); track('pass_waitlist_join'); }}>
            Join the Pass waitlist
          </button>
        )}
      </section>

      <section className="card host">
        <h3>Empty spot in your society?</h3>
        <p>Rent it to someone parking nearby while you're at work. You set the hours, we handle payments and verified plates.</p>
        {store.waitlist.host ? (
          <p className="ok">Listing request saved for {store.waitlist.host.area}. Estimated ₹{store.waitlist.host.estimate.toLocaleString('en-IN')} a month.</p>
        ) : (
          <button className="btn" onClick={() => { setHostOpen(true); track('host_form_open'); }}>See what you could earn</button>
        )}
      </section>

      {store.vehicles.length > 0 && (
        <section className="card">
          <h3>Your vehicles</h3>
          <ul className="vehicles">
            {store.vehicles.map((v) => (
              <li key={v.plate}>
                <span className="plate small">{v.plate}</span>
                <span className="sub">{v.type === 'car' ? 'Car' : 'Bike'}</span>
                <button className="icon-btn" aria-label={`Remove ${v.plate}`} onClick={() => update((s) => ({ vehicles: s.vehicles.filter((x) => x.plate !== v.plate) }))}>
                  <Close />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hostOpen && <HostForm onClose={() => setHostOpen(false)} onSave={(h) => { update((s) => ({ waitlist: { ...s.waitlist, host: h } })); track('host_listing_submit', h); setHostOpen(false); }} />}
    </div>
  );
}

function HostForm({ onClose, onSave }) {
  const [area, setArea] = useState('Viman Nagar');
  const [type, setType] = useState('car');
  const [hrs, setHrs] = useState(9);
  const [days, setDays] = useState(22);
  const rate = type === 'car' ? 30 : 10;
  // expected fill 55% of offered hours, host keeps 85%
  const estimate = Math.round(rate * hrs * days * 0.55 * 0.85);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="List your spot" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>List your spot</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Close /></button>
        </div>
        <label className="field">
          <span>Area</span>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {LANDMARKS.map((l) => <option key={l.id}>{l.name}</option>)}
          </select>
        </label>
        <div className="field">
          <span>Spot fits</span>
          <div className="seg">
            <button className={type === 'car' ? 'on' : ''} onClick={() => setType('car')}>A car</button>
            <button className={type === 'bike' ? 'on' : ''} onClick={() => setType('bike')}>Bikes only</button>
          </div>
        </div>
        <label className="field">
          <span>Free for {hrs} hours a day</span>
          <input type="range" min="2" max="14" value={hrs} onChange={(e) => setHrs(+e.target.value)} />
        </label>
        <label className="field">
          <span>{days} days a month</span>
          <input type="range" min="4" max="30" value={days} onChange={(e) => setDays(+e.target.value)} />
        </label>
        <div className="earn">
          <span>You could earn about</span>
          <strong>₹{estimate.toLocaleString('en-IN')}</strong>
          <span>a month at ₹{rate}/hr, after our 15% fee, if it's booked about half the time.</span>
        </div>
        <button className="btn primary wide" onClick={() => onSave({ area, type, hrs, days, estimate })}>Request a listing</button>
      </div>
    </div>
  );
}
