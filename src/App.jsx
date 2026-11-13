import { useEffect, useMemo, useState } from 'react';
import { SPOTS } from './data/pune';
import { predict } from './lib/predict';
import { rankSpots } from './lib/rank';
import { askSaathi } from './lib/assistant';
import { useStore } from './lib/store';
import { track } from './lib/analytics';
import CityMap from './components/CityMap';
import FindPanel, { WHEN_PRESETS } from './components/FindPanel';
import SpotDetail from './components/SpotDetail';
import AskPanel from './components/AskPanel';
import MinePanel from './components/MinePanel';
import BookingSheet from './components/BookingSheet';
import { Spark } from './components/icons';

const TABS = [
  ['find', 'Find'],
  ['ask', 'Ask Saathi'],
  ['mine', 'My parking'],
];

export default function App() {
  const [store, update] = useStore();
  const [tab, setTab] = useState('find');
  const [dest, setDestRaw] = useState(null);
  const [whenKey, setWhenKey] = useState('now');
  const [customWhen, setCustomWhen] = useState(null);
  const [tick, setTick] = useState(0);
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState(null);
  const [booking, setBooking] = useState(null);
  const [chat, setChat] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const vehicle = store.vehicle;

  useEffect(() => {
    track('app_open');
    const t = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const when = useMemo(() => {
    if (whenKey === 'custom' && customWhen) return customWhen;
    return (WHEN_PRESETS.find((p) => p.key === whenKey) || WHEN_PRESETS[0]).make();
  }, [whenKey, customWhen, tick]);

  const preds = useMemo(
    () => Object.fromEntries(SPOTS.map((s) => [s.id, predict(s, when, store.reports[s.id])])),
    [when, store.reports]
  );
  const ranked = useMemo(() => rankSpots(SPOTS, preds, { dest, vehicle, filters }), [preds, dest, vehicle, filters]);

  const setDest = (d) => {
    setDestRaw(d);
    setSelected(null);
    if (d) {
      setFocus({ lat: d.lat, lng: d.lng, k: Date.now() });
      track('destination_set', { dest: d.id, source: 'search' });
    }
  };
  const setVehicle = (v) => update(() => ({ vehicle: v }));

  const openSpot = (id, source = 'list') => {
    const s = SPOTS.find((x) => x.id === id);
    setSelected(id);
    setTab('find');
    setFocus({ lat: s.lat, lng: s.lng, k: Date.now() });
    track('spot_view', { spot: id, source });
  };

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2600); };

  const ask = async (text) => {
    const history = chat.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    setChat((c) => [...c, { role: 'user', text }]);
    setBusy(true);
    track('saathi_ask', { len: text.length });
    const ans = await askSaathi(text, { vehicle, reports: store.reports }, history);
    setBusy(false);
    setChat((c) => [...c, { role: 'bot', text: ans.reply, picks: ans.picks, mode: ans.mode, parsed: ans.parsed, vehicle: ans.parsed.vehicle }]);
    track('saathi_answer', { mode: ans.mode, picks: ans.picks.length, dest: ans.parsed.dest?.id || null });
  };

  // Tapping a pick in chat carries the whole intent over to the map: place, time, vehicle.
  const showPick = (msg, spotId) => {
    const p = msg.parsed;
    if (p.vehicle && p.vehicle !== vehicle) setVehicle(p.vehicle);
    if (p.dest) setDestRaw(p.dest);
    setCustomWhen(p.when);
    setWhenKey(p.whenSet ? 'custom' : 'now');
    setFilters(p.prefs || {});
    track('saathi_pick_open', { spot: spotId });
    openSpot(spotId, 'saathi');
  };

  const startBooking = (spot) => {
    setBooking(spot);
    track('booking_start', { spot: spot.id, vehicle });
  };

  const confirmBooking = (b) => {
    const spot = booking;
    const code = 'SMP-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const rec = { ...b, start: b.start.getTime(), end: b.end.getTime(), spotId: spot.id, vehicle, code, createdAt: Date.now() };
    update((s) => ({
      active: rec,
      history: s.active ? [...s.history, s.active] : s.history,
      vehicles: s.vehicles.some((v) => v.plate === b.plate) ? s.vehicles : [...s.vehicles, { plate: b.plate, type: vehicle }],
    }));
    track('booking_confirm', { spot: spot.id, vehicle, hours: b.hours, amount: b.amount, pay: b.pay });
    setBooking(null);
    setTab('mine');
    flash(spot.type === 'civic' || spot.type === 'transit' ? 'Paid. Show the code at the lot.' : 'Reserved. Your slot is held.');
  };

  const extend = () => {
    const spot = SPOTS.find((s) => s.id === store.active.spotId);
    update((s) => ({ active: { ...s.active, end: s.active.end + 3600000, hours: s.active.hours + 1, amount: s.active.amount + spot.rate[s.active.vehicle] } }));
    track('booking_extend');
    flash('Extended by an hour.');
  };
  const end = () => {
    update((s) => ({ history: [...s.history, s.active], active: null }));
    track('booking_end');
    flash('Parking ended. Drive safe.');
  };

  const report = (spotId, level) => {
    update((s) => ({ reports: { ...s.reports, [spotId]: { level, at: Date.now() } } }));
    track('report_submit', { spot: spotId, level });
  };

  const sel = selected && SPOTS.find((s) => s.id === selected);

  return (
    <div className="app">
      <a className="skip" href="#panel">Skip to results</a>
      <aside className="panel" id="panel">
        <header className="top">
          <div className="brand">
            <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true"><rect width="64" height="64" rx="12" fill="#1546B8" /><rect y="54" width="64" height="10" fill="#FFC21A" /><path d="M0 54h8l-8 10zM16 54h8l-8 10zM32 54h8l-8 10zM48 54h8l-8 10z" fill="#172033" /><path d="M22 14h13a11 11 0 0 1 0 22h-6v10h-7zm7 7v8h6a4 4 0 0 0 0-8z" fill="#fff" /></svg>
            <span>SortMyParking</span>
            <span className="city">पुणे</span>
          </div>
          <nav className="tabs" role="tablist">
            {TABS.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {k === 'ask' && <Spark width="16" height="16" />}
                {l}
                {k === 'mine' && store.active && <i className="dot" aria-label="active booking" />}
              </button>
            ))}
          </nav>
        </header>

        <div className="panel-body">
          {tab === 'find' && !sel && (
            <FindPanel
              dest={dest}
              setDest={setDest}
              vehicle={vehicle}
              setVehicle={setVehicle}
              whenKey={whenKey}
              setWhenKey={(k) => setWhenKey(k)}
              when={when}
              filters={filters}
              setFilters={setFilters}
              ranked={ranked}
              onOpen={openSpot}
            />
          )}
          {tab === 'find' && sel && (
            <SpotDetail
              spot={sel}
              pred={preds[sel.id]}
              when={when}
              vehicle={vehicle}
              dest={dest}
              report={store.reports[sel.id] && Date.now() - store.reports[sel.id].at < 45 * 60000 ? store.reports[sel.id] : null}
              onBack={() => setSelected(null)}
              onReserve={() => startBooking(sel)}
              onReport={(lvl) => report(sel.id, lvl)}
            />
          )}
          {tab === 'ask' && <AskPanel chat={chat} onAsk={ask} busy={busy} vehicle={vehicle} onShow={showPick} />}
          {tab === 'mine' && (
            <MinePanel store={store} update={update} vehicle={vehicle} dest={dest} onFind={() => setTab('find')} onExtend={extend} onEnd={end} track={track} />
          )}
        </div>
        <footer className="foot">
          Built in Pune. <a href="./case-study/">Read the case study</a>
        </footer>
      </aside>

      <main className="mapwrap">
        <CityMap
          spots={SPOTS.filter((s) => s.cap[vehicle] > 0)}
          preds={preds}
          selectedId={selected}
          onSelect={(id) => openSpot(id, 'map')}
          dest={dest}
          parked={store.parked}
          focus={focus}
        />
      </main>

      {booking && (
        <BookingSheet
          spot={booking}
          vehicle={vehicle}
          when={when}
          vehicles={store.vehicles}
          hasPass={false}
          onClose={() => setBooking(null)}
          onConfirm={confirmBooking}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
