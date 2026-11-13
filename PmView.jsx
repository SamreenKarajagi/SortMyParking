import { readEvents, FUNNEL } from '../lib/analytics';

// The product manager's view of this device's session data.
// With PostHog connected, the same events power real cohort funnels and retention.
export default function PmView() {
  const ev = readEvents();
  const count = (name) => ev.filter((e) => e.event === name).length;
  const top = FUNNEL.map(([k, label]) => ({ k, label, n: count(k) }));
  const max = Math.max(1, ...top.map((t) => t.n));
  const ai = ev.filter((e) => e.event === 'saathi_answer');
  const live = ai.filter((e) => e.props.mode === 'live').length;
  const others = ['saathi_pick_open', 'report_submit', 'pass_waitlist_join', 'host_form_open', 'host_listing_submit', 'booking_extend', 'street_park_saved'];

  return (
    <div className="pm">
      <a className="back" href="#">Back to the app</a>
      <h1 className="ask-h">Product metrics</h1>
      <p className="sub">Events from this browser. Connect PostHog (free tier) with VITE_POSTHOG_KEY to see every user.</p>

      <section className="card">
        <h3>Core funnel</h3>
        <ol className="funnel">
          {top.map((t, i) => (
            <li key={t.k}>
              <span>{t.label}</span>
              <div className="fbar-h"><i style={{ width: `${(t.n / max) * 100}%` }} /></div>
              <strong>{t.n}</strong>
              {i > 0 && <em>{top[i - 1].n ? `${Math.round((t.n / top[i - 1].n) * 100)}%` : ''}</em>}
            </li>
          ))}
        </ol>
      </section>

      <section className="stats">
        <div><strong>{ai.length}</strong><span>Saathi answers</span></div>
        <div><strong>{ai.length ? Math.round((live / ai.length) * 100) : 0}%</strong><span>Served by live LLM</span></div>
        <div><strong>{count('saathi_pick_open')}</strong><span>Picks opened from chat</span></div>
      </section>

      <section className="card">
        <h3>Other signals</h3>
        <ul className="sig">
          {others.map((o) => <li key={o}><code>{o}</code><strong>{count(o)}</strong></li>)}
        </ul>
      </section>

      <section className="card">
        <h3>Latest events</h3>
        <ul className="log">
          {ev.slice(-25).reverse().map((e, i) => (
            <li key={i}><code>{e.event}</code><span>{new Date(e.at).toLocaleTimeString('en-IN')}</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
