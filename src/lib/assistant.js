// Saathi, the parking assistant.
// Two layers:
//   1. On-device understanding (this file): parses English, Hinglish and Marathi phrasing,
//      ranks real spots, writes a grounded reply. Free, instant, works offline.
//   2. Live LLM (api/ask.js on Vercel, Groq free tier): rewrites the reply conversationally
//      and can reorder picks, but only among candidate IDs we send. Unknown IDs are dropped.

import { LANDMARKS, SPOTS, TOW_ZONES, TOW_COST } from '../data/pune';
import { predict, betterWindow, LEVEL_TEXT, activeEvent } from './predict';
import { rankSpots } from './rank';
import { towZoneAt } from './geo';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function findLandmark(text) {
  const t = ` ${text.toLowerCase()} `;
  let best = null;
  for (const l of LANDMARKS) {
    for (const a of l.aliases) {
      if (t.includes(a) && (!best || a.length > best.len)) best = { l, len: a.length };
    }
  }
  return best?.l || null;
}

export function parseRequest(text, now = new Date()) {
  const t = ` ${text.toLowerCase().replace(/[?!,]/g, ' ')} `;
  const out = { vehicle: null, when: new Date(now), whenSet: false, dest: findLandmark(t), prefs: {}, durationH: 2 };

  if (/\b(bike|scooter|scooty|activa|two[-\s]?wheeler|2[-\s]?wheeler|2w|motorcycle|bullet|dupahiya)\b/.test(t)) out.vehicle = 'bike';
  else if (/\b(car|four[-\s]?wheeler|4[-\s]?wheeler|4w|suv|sedan|hatchback)\b/.test(t)) out.vehicle = 'car';

  const p = out.prefs;
  if (/cheap|budget|sasta|swast|lowest|kam paise|affordable/.test(t)) p.cheap = true;
  if (/covered|shade|basement|rain|paus|baarish/.test(t)) p.covered = true;
  if (/\bev\b|charg|electric/.test(t)) p.ev = true;
  if (/safe|secure|cctv|late night/.test(t)) p.secure = true;
  if (/metro|park\s*(and|&|n)\s*ride/.test(t)) p.metro = true;
  if (/society|host spot|someone's spot/.test(t)) p.host = true;

  const dur = t.match(/(\d+(?:\.\d)?)\s*(hours|hour|hrs|hr|h|tas|taas|ghante|ghanta)\b/);
  if (dur) out.durationH = Math.min(12, Math.max(1, parseFloat(dur[1])));
  if (/whole day|full day|all day|poora din|divasbhar|office/.test(t)) out.durationH = Math.max(out.durationH, 9);

  const w = out.when;
  let dayShift = null;
  if (/\b(tomorrow|udya|kal)\b/.test(t)) dayShift = 1;
  const dayIdx = DAYS.findIndex((d, i) => t.includes(d) || new RegExp(`\\b${SHORT[i]}\\b`).test(t));
  if (dayIdx >= 0) dayShift = (dayIdx - w.getDay() + 7) % 7;
  if (/weekend/.test(t) && dayShift == null) dayShift = (6 - w.getDay() + 7) % 7;
  if (dayShift != null) {
    w.setDate(w.getDate() + dayShift);
    out.whenSet = true;
  }

  let hour = null;
  let min = 0;
  const ampm = t.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/);
  const at = t.match(/\bat\s+(\d{1,2})(?:[:.](\d{2}))?\b/);
  const baje = t.match(/\b(\d{1,2})\s*(baje|vajta|vajata|la)\b/);
  if (ampm) {
    hour = (Number(ampm[1]) % 12) + (ampm[3] === 'pm' ? 12 : 0);
    min = Number(ampm[2] || 0);
  } else if (at || baje) {
    const m = at || baje;
    hour = Number(m[1]);
    min = Number((at && at[2]) || 0);
    if (hour <= 7) hour += 12; // nobody means 5 am when they say "at 5"
  } else if (/tonight|aaj raat|ratri|raat ko/.test(t)) hour = 20;
  else if (/evening|sandhyakali|sandhyakal|shaam/.test(t)) { hour = 18; min = 30; }
  else if (/morning|sakali|subah/.test(t)) { hour = 9; min = 30; }
  else if (/afternoon|dupari|dopahar|lunch/.test(t)) hour = 13;
  if (hour == null && dayShift != null) {
    // A day without a time: offices mean morning, everything else means evening in Pune.
    hour = out.durationH >= 9 ? 9 : 18;
    min = 30;
  }
  if (hour != null) {
    w.setHours(hour, min, 0, 0);
    out.whenSet = true;
    if (dayShift == null && w < now - 30 * 60000) w.setDate(w.getDate() + 1);
  }
  if (!out.whenSet) out.when = new Date(now);
  // "metro to Shivajinagar from Kothrud": park near where the trip starts
  const from = t.match(/\bfrom\s+(.+)$/);
  if (from) {
    const origin = findLandmark(from[1]);
    if (origin) {
      out.origin = origin;
      out.dest = findLandmark(t.slice(0, from.index)) || out.dest;
      if (out.dest === origin) out.origin = null;
    }
  }
  return out;
}

const an = (n) => (/^(8|11|18)/.test(String(n)) ? 'an' : 'a');
const rs = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export function fmtTime(d) {
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).replace(' ', ' ');
}

export function fmtWhen(d, now = new Date()) {
  const diff = (d - now) / 60000;
  if (Math.abs(diff) < 15) return 'right now';
  const sameDay = d.toDateString() === now.toDateString();
  const tmr = new Date(now);
  tmr.setDate(tmr.getDate() + 1);
  const day = sameDay ? 'today' : d.toDateString() === tmr.toDateString() ? 'tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'long' });
  return `${day} at ${fmtTime(d)}`;
}

export function localAnswer(text, ctx) {
  const now = new Date();
  const q = parseRequest(text, now);
  const vehicle = q.vehicle || ctx.vehicle;
  const dest = q.dest;

  if (!dest) {
    return {
      parsed: { ...q, vehicle },
      picks: [],
      reply:
        "Tell me where you're headed and I'll find where to leave the vehicle. Try something like \"bike near FC Road at 6 pm\" or \"Phoenix on Saturday evening, covered parking\".",
    };
  }

  const preds = Object.fromEntries(SPOTS.map((s) => [s.id, predict(s, q.when, ctx.reports?.[s.id])]));
  const parkAndRide = q.prefs.metro && q.origin;
  const ranked = rankSpots(SPOTS, preds, { dest: parkAndRide ? q.origin : dest, vehicle, filters: q.prefs, durationH: q.durationH });
  const picks = ranked.filter((r, i) => i === 0 || r.walk <= 20).slice(0, 3);
  const top = picks[0];
  const vWord = vehicle === 'bike' ? 'bike' : 'car';
  const lines = [];

  if (parkAndRide && top) {
    lines.push(
      `Skip the drive into ${dest.name}. Park at ${top.spot.name}, ${top.walk > 1 ? `${top.walk} min from ${q.origin.name}` : `right in ${q.origin.name}`}, for ${rs(top.spot.rate[vehicle])}/hr, then take the metro in. I expect around ${top.pred.free[vehicle]} ${vWord} slots free ${fmtWhen(q.when, now)}.`
    );
    return { parsed: { ...q, vehicle }, picks, reply: lines.join(' ') };
  }

  if (!top) {
    lines.push(`I couldn't find a ${vWord} spot that fits near ${dest.name}. Try removing a filter.`);
    return { parsed: { ...q, vehicle }, picks, reply: lines.join(' ') };
  }

  if (!top.pred.open) {
    lines.push(`Most lots near ${dest.name} are closed ${fmtWhen(q.when, now)}. ${top.spot.name} opens ${top.spot.hours.split(' to ')[0]}. If you're going now, use a 24-hour lot or pick a later time.`);
    return { parsed: { ...q, vehicle }, picks, reply: lines.join(' ') };
  }

  const free = top.pred.free[vehicle];
  lines.push(
    `For ${dest.name} ${fmtWhen(q.when, now)}, go for ${top.spot.name}. ` +
      (top.walk > 1 ? `It's ${an(top.walk)} ${top.walk} min walk` : 'It sits right there') +
      (top.pred.level === 'tight' || top.pred.level === 'full'
        ? `, but it'll be busy, maybe ${free} ${vWord} slots left`
        : `, I expect around ${free} ${vWord} slots free`) +
      `, at ${rs(top.spot.rate[vehicle])}/hr.`
  );

  if (top.relaxed) {
    lines.push("Nothing nearby ticks every box you asked for at that hour, so this is the best fit.");
    const exact = picks.find((p) => !p.relaxed) || ranked.find((p) => !p.relaxed);
    const bw = exact && betterWindow(exact.spot, q.when, vehicle);
    if (bw) lines.push(`If you'd rather use ${exact.spot.name}, get there by ${fmtTime(bw.date)}.`);
  }

  if (!top.relaxed && top.chance < 0.75) {
    const bw = betterWindow(top.spot, q.when, vehicle);
    if (bw) lines.push(`It gets tight then. Arrive by ${fmtTime(bw.date)} and your odds jump to ${Math.round(bw.chance * 100)}%.`);
    else if (picks[1]) lines.push(`It'll be tight, so keep ${picks[1].spot.name} as plan B.`);
  } else if (!top.relaxed && picks[1]) {
    lines.push(`Backup: ${picks[1].spot.name}, ${picks[1].walk} min away${picks[1].relaxed ? ', though it misses one of your asks' : ''}.`);
  }


  const tz = towZoneAt(dest, TOW_ZONES);
  if (tz) lines.push(`Heads up, ${tz.name} sees regular towing drives. Skipping the kerb saves you a fine of around ${rs(TOW_COST[vehicle])} and a trip to the towing yard.`);

  const ev = activeEvent(q.when);
  if (ev) lines.push(`${ev.name} crowds are in, so I've padded these estimates.`);

  return { parsed: { ...q, vehicle }, picks, reply: lines.join(' ') };
}

export async function askSaathi(text, ctx, history = []) {
  const local = localAnswer(text, ctx);
  if (!local.picks.length) return { ...local, mode: 'device' };

  const candidates = rankSpots(
    SPOTS,
    Object.fromEntries(SPOTS.map((s) => [s.id, predict(s, local.parsed.when, ctx.reports?.[s.id])])),
    { dest: local.parsed.dest, vehicle: local.parsed.vehicle, filters: local.parsed.prefs, durationH: local.parsed.durationH }
  )
    .slice(0, 6)
    .map((r) => ({
      id: r.spot.id,
      name: r.spot.name,
      area: r.spot.area,
      type: r.spot.type,
      walk_min: r.walk,
      rate_per_hr: r.spot.rate[local.parsed.vehicle],
      predicted_free_slots: r.pred.free[local.parsed.vehicle],
      availability: LEVEL_TEXT[r.pred.level],
      features: r.spot.feats,
    }));

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch('./api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        message: text,
        history: history.slice(-6),
        context: {
          destination: local.parsed.dest.name,
          when: fmtWhen(local.parsed.when),
          vehicle: local.parsed.vehicle,
          candidates,
          grounded_draft: local.reply,
        },
      }),
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('no live model');
    const data = await res.json();
    const valid = (data.pick_ids || []).filter((id) => local.picks.concat(candidates).some((c) => (c.spot?.id || c.id) === id));
    let picks = local.picks;
    if (valid.length) {
      const all = rankSpots(
        SPOTS,
        Object.fromEntries(SPOTS.map((s) => [s.id, predict(s, local.parsed.when, ctx.reports?.[s.id])])),
        { dest: local.parsed.dest, vehicle: local.parsed.vehicle, filters: local.parsed.prefs, durationH: local.parsed.durationH }
      );
      picks = valid.map((id) => all.find((r) => r.spot.id === id)).filter(Boolean).slice(0, 3);
    }
    if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('empty');
    return { ...local, picks, reply: data.reply.trim(), mode: 'live' };
  } catch {
    return { ...local, mode: 'device' };
  }
}
