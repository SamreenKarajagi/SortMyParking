import { useEffect, useRef, useState } from 'react';
import { Send, Spark } from './icons';
import { LEVEL_TEXT } from '../lib/predict';

const STARTERS = [
  'Bike parking near FC Road at 6 pm',
  'Covered car parking at Phoenix this Saturday evening',
  'Office in Hinjewadi Phase 1 tomorrow, whole day, cheapest',
  'Dagdusheth la jaycha aahe, gaadi kuthe lavu?',
  'Flight from Pune airport tonight, car',
];

export default function AskPanel({ chat, onAsk, busy, vehicle, onShow }) {
  const [text, setText] = useState('');
  const end = useRef(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [chat.length, busy]);

  const submit = (t) => {
    const v = (t ?? text).trim();
    if (!v || busy) return;
    setText('');
    onAsk(v);
  };

  return (
    <div className="ask">
      <div className="ask-intro">
        <span className="saathi-mark"><Spark /></span>
        <div>
          <h1 className="ask-h">Ask Saathi</h1>
          <p className="sub">Tell me where you're going and when, the way you'd tell a friend. English, Hinglish or Marathi all work.</p>
        </div>
      </div>

      <div className="thread" aria-live="polite">
        {chat.length === 0 && (
          <div className="starters">
            {STARTERS.map((s) => (
              <button key={s} className="starter" onClick={() => submit(s)}>{s}</button>
            ))}
          </div>
        )}
        {chat.map((m, i) =>
          m.role === 'user' ? (
            <p key={i} className="msg me">{m.text}</p>
          ) : (
            <div key={i} className="msg bot">
              <p>{m.text}</p>
              {m.picks?.length > 0 && (
                <div className="picks">
                  {m.picks.map((p, j) => (
                    <button key={p.spot.id} className="pick" onClick={() => onShow(m, p.spot.id)}>
                      <span className={`sign sign-${p.spot.type}`}>{p.spot.type === 'metro' ? 'M' : 'P'}</span>
                      <span className="pick-body">
                        <strong>{p.spot.name}</strong>
                        <span className="sub">
                          {p.walk} min walk, ₹{p.spot.rate[m.vehicle || vehicle]}/hr
                        </span>
                        <span className={`lvl lvl-${p.pred.level}`}>{LEVEL_TEXT[p.pred.level]}</span>
                      </span>
                      {j === 0 && <span className="best">Top pick</span>}
                    </button>
                  ))}
                </div>
              )}
              <span className="mode">{m.mode === 'live' ? 'Live AI' : 'On-device AI'}</span>
            </div>
          )
        )}
        {busy && <p className="msg bot typing"><span /><span /><span /></p>}
        <div ref={end} />
      </div>

      <form className="composer" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Car near Ruby Hall at 11 am…" aria-label="Message Saathi" />
        <button className="send" aria-label="Send" disabled={!text.trim() || busy}><Send /></button>
      </form>
    </div>
  );
}
