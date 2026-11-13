// Availability model v1.
// Occupancy = demand profile(hour, weekday/weekend) + event boost + per-spot jitter,
// blended with fresh community reports. Deliberately simple and explainable:
// v2 swaps the hand-tuned curves for curves learned from booking + report data.

import { EVENTS } from '../data/pune';

const P = {
  office: { wd: [[0, 0.1], [7, 0.2], [9, 0.75], [10.5, 0.94], [17, 0.9], [19, 0.5], [22, 0.15], [24, 0.1]], we: [[0, 0.08], [10, 0.2], [15, 0.25], [22, 0.08], [24, 0.08]] },
  retail: { wd: [[0, 0.05], [10, 0.15], [13, 0.45], [17, 0.6], [19.5, 0.86], [21, 0.72], [23, 0.15], [24, 0.05]], we: [[0, 0.05], [10, 0.25], [12, 0.7], [16, 0.9], [19, 0.97], [21, 0.86], [23, 0.2], [24, 0.05]] },
  market: { wd: [[0, 0.05], [8, 0.2], [11, 0.7], [13, 0.8], [18, 0.92], [20, 0.7], [22, 0.2], [24, 0.05]], we: [[0, 0.05], [9, 0.3], [11, 0.86], [17, 0.97], [20, 0.82], [22, 0.25], [24, 0.05]] },
  nightlife: { wd: [[0, 0.45], [2, 0.15], [6, 0.05], [12, 0.3], [17, 0.4], [20, 0.8], [22, 0.9], [24, 0.45]], we: [[0, 0.7], [2, 0.3], [6, 0.05], [12, 0.45], [18, 0.6], [20, 0.92], [22, 0.98], [24, 0.7]] },
  transit: { wd: [[0, 0.35], [5, 0.4], [8, 0.85], [10, 0.92], [14, 0.7], [18, 0.88], [21, 0.7], [24, 0.35]], we: [[0, 0.35], [8, 0.6], [12, 0.7], [18, 0.8], [24, 0.35]] },
  air: { wd: [[0, 0.6], [6, 0.8], [12, 0.7], [19, 0.86], [24, 0.6]], we: [[0, 0.62], [6, 0.82], [12, 0.75], [19, 0.9], [24, 0.62]] },
  college: { wd: [[0, 0.1], [8, 0.4], [10, 0.85], [14, 0.9], [17, 0.93], [20, 0.86], [22, 0.4], [24, 0.1]], we: [[0, 0.15], [11, 0.6], [17, 0.9], [20, 0.96], [22.5, 0.5], [24, 0.15]] },
  hospital: { wd: [[0, 0.35], [9, 0.7], [11, 0.93], [16, 0.85], [20, 0.55], [24, 0.35]], we: [[0, 0.3], [10, 0.6], [12, 0.78], [18, 0.6], [24, 0.3]] },
  residential: { wd: [[0, 0.95], [8, 0.6], [10, 0.25], [18, 0.4], [21, 0.9], [24, 0.95]], we: [[0, 0.95], [10, 0.6], [18, 0.6], [22, 0.9], [24, 0.95]] },
};

function curve(points, h) {
  for (let i = 1; i < points.length; i++) {
    const [h1, v1] = points[i];
    const [h0, v0] = points[i - 1];
    if (h <= h1) return v0 + ((v1 - v0) * (h - h0)) / (h1 - h0 || 1);
  }
  return points[points.length - 1][1];
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export function activeEvent(date, profile) {
  const d = date.toISOString().slice(0, 10);
  return EVENTS.find((e) => d >= e.from && d <= e.to && (!profile || e.profiles.includes(profile))) || null;
}

const REPORT_OCC = { plenty: 0.45, filling: 0.8, full: 0.99 };
const REPORT_TTL = 45 * 60 * 1000;

export function occupancyAt(spot, date, report) {
  const h = date.getHours() + date.getMinutes() / 60;
  const day = date.getDay();
  const weekend = day === 0 || day === 6 || (day === 5 && h >= 18 && spot.profile === 'nightlife');
  const prof = P[spot.profile] || P.retail;
  let occ = curve(weekend ? prof.we : prof.wd, h);
  const ev = activeEvent(date, spot.profile);
  if (ev) occ += ev.boost * Math.min(1, occ + 0.2);
  // Smaller lots swing harder; spot-specific jitter keeps neighbours from looking identical.
  const jitter = (hash(spot.id + date.getDay() + Math.floor(h)) - 0.5) * (spot.cap.car < 100 ? 0.16 : 0.08);
  occ += jitter;
  let source = 'model';
  let ageMin = null;
  if (report && Date.now() - report.at < REPORT_TTL && Math.abs(date - Date.now()) < REPORT_TTL) {
    const w = 0.75 * (1 - (Date.now() - report.at) / REPORT_TTL) + 0.25;
    occ = occ * (1 - w) + REPORT_OCC[report.level] * w;
    source = 'report';
    ageMin = Math.round((Date.now() - report.at) / 60000);
  }
  return { occ: Math.min(0.995, Math.max(0.02, occ)), source, ageMin, event: ev };
}

export function levelOf(occ) {
  if (occ < 0.6) return 'plenty';
  if (occ < 0.82) return 'filling';
  if (occ < 0.97) return 'tight';
  return 'full';
}

export const LEVEL_TEXT = { plenty: 'Plenty free', filling: 'Filling up', tight: 'Tight', full: 'Likely full' };

function isOpen(spot, date) {
  if (spot.hours === '24 hours') return true;
  const m = spot.hours.match(/(\d+) (am|pm) to (\d+) (am|pm)/);
  if (!m) return true;
  const to24 = (n, ap) => (Number(n) % 12) + (ap === 'pm' ? 12 : 0);
  const open = to24(m[1], m[2]);
  let close = to24(m[3], m[4]);
  if (close <= open) close += 24;
  let h = date.getHours() + date.getMinutes() / 60;
  if (h < open && h + 24 < close) h += 24;
  return h >= open && h < close;
}

export function predict(spot, date, report) {
  const { occ, source, ageMin, event } = occupancyAt(spot, date, report);
  const open = isOpen(spot, date);
  const free = {
    car: Math.round(spot.cap.car * (1 - occ)),
    bike: Math.round(spot.cap.bike * (1 - occ)),
  };
  // ~3.5% of any lot is cars circling or bays blocked, so they don't count as findable.
  // Model estimates never claim certainty; a fresh report can push it a little higher.
  const ceiling = source === 'report' ? 0.98 : 0.95;
  const chance = (v) => (!open || spot.cap[v] === 0 ? 0 : Math.min(ceiling, 1 - Math.exp(-Math.max(0, spot.cap[v] * (1 - occ - 0.035)) / 2.5)));
  return { occ, level: open ? levelOf(occ) : 'full', free, chance, source, ageMin, event, open };
}

// Hour-by-hour forecast for a day, used for the detail chart.
export function dayForecast(spot, date) {
  const base = new Date(date);
  return Array.from({ length: 24 }, (_, h) => {
    const d = new Date(base);
    d.setHours(h, 0, 0, 0);
    return { h, occ: occupancyAt(spot, d).occ, open: isOpen(spot, d) };
  });
}

// "Arrive 40 min earlier and it's easy": scan nearby windows for a materially better time.
export function betterWindow(spot, date, vehicle) {
  const now = predict(spot, date).chance(vehicle);
  let best = null;
  for (const off of [-90, -60, -30, 30, 60, 90, 120]) {
    const d = new Date(date.getTime() + off * 60000);
    if (d < Date.now() - 5 * 60000) continue;
    const c = predict(spot, d).chance(vehicle);
    if (c - now > 0.15 && (!best || c > best.chance)) best = { date: d, chance: c, off };
  }
  return best;
}
