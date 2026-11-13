import { walkMinutes } from './geo';

const matches = (s, f) =>
  (!f.covered || s.feats.includes('covered')) &&
  (!f.ev || s.feats.includes('ev')) &&
  (!f.metro || s.type === 'metro') &&
  (!f.host || s.type === 'host');

// Ranking is deterministic on purpose: the LLM explains and converses,
// but it never invents a spot or a number. Every pick traces back to this score.
export function rankSpots(spots, preds, { dest, vehicle, filters = {}, durationH = 2 }) {
  const rows = spots
    .filter((s) => s.cap[vehicle] > 0)
    .map((s) => {
      const p = preds[s.id];
      const walk = dest ? walkMinutes(s, dest) : null;
      const chance = p.chance(vehicle);
      const cost = s.rate[vehicle] * durationH;
      let score = chance * 60;
      if (dest) score -= walk * (filters.metro ? 0.15 : 1.6);
      score -= cost * (filters.cheap ? 0.35 : 0.08);
      if (s.feats.includes('covered')) score += filters.covered ? 6 : 1;
      if (filters.secure && s.feats.includes('cctv')) score += 6;
      score += (s.rating - 3.5) * 2;
      const reasons = [];
      if (walk != null) reasons.push(`${walk} min walk`);
      if (chance > 0.85) reasons.push('easy to find a slot');
      else if (chance > 0.6) reasons.push('decent odds');
      if (s.feats.includes('covered')) reasons.push('covered');
      if (s.type === 'metro') reasons.push('metro next door');
      return { spot: s, pred: p, walk, chance, cost, score, reasons, relaxed: !matches(s, filters) };
    })
    .sort((a, b) => b.score - a.score);

  if (!dest) {
    // No destination yet: show a varied, citywide shortlist instead of ten metro lots in a row.
    const seen = {};
    const varied = [];
    const rest = [];
    for (const r of rows.filter((r) => !r.relaxed)) {
      seen[r.spot.type] = (seen[r.spot.type] || 0) + 1;
      (seen[r.spot.type] <= 2 ? varied : rest).push(r);
    }
    return [...varied, ...rest];
  }

  const limit = filters.metro ? 200 : 20;
  const near = rows.filter((r) => r.walk <= limit);
  // Never recommend a lot that's closed when you arrive, unless every nearby lot is closed.
  const openNear = near.filter((r) => r.pred.open);
  const reachable = openNear.length ? openNear : near;
  let pool = reachable.filter((r) => !r.relaxed);
  // Not enough exact matches nearby, or the matches are all jammed? Mix in close
  // alternatives that miss a filter (flagged), rather than sending someone 35 minutes away.
  const jammed = pool.length > 0 && pool.every((r) => r.chance < 0.3);
  if (dest && (pool.length < 3 || jammed)) {
    const extra = reachable.filter((r) => r.relaxed).slice(0, 3);
    pool = [...pool, ...extra].sort((a, b) => b.score - (b.relaxed ? 15 : 0) - (a.score - (a.relaxed ? 15 : 0)));
  }
  if (pool.length === 0 && dest) return [...rows].sort((a, b) => a.walk - b.walk).slice(0, 3);
  return pool;
}
