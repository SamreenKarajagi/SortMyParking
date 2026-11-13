// Product analytics. Every event lands in a local log (powers the #pm view)
// and, when VITE_POSTHOG_KEY is set, in PostHog's free tier for real cohorts and funnels.

const KEY = 'smp:events';
const PH_KEY = import.meta.env.VITE_POSTHOG_KEY;
const PH_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

function anonId() {
  try {
    let id = localStorage.getItem('smp:anon');
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      localStorage.setItem('smp:anon', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

export function track(event, props = {}) {
  const row = { event, props, at: Date.now() };
  try {
    const log = JSON.parse(localStorage.getItem(KEY) || '[]');
    log.push(row);
    localStorage.setItem(KEY, JSON.stringify(log.slice(-1000)));
  } catch {
    /* ignore */
  }
  if (PH_KEY) {
    fetch(`${PH_HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PH_KEY, event, distinct_id: anonId(), properties: props }),
    }).catch(() => {});
  }
}

export function readEvents() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export const FUNNEL = [
  ['app_open', 'Opened the app'],
  ['destination_set', 'Told us where they’re going'],
  ['spot_view', 'Opened a spot'],
  ['booking_start', 'Started a reservation'],
  ['booking_confirm', 'Reserved'],
];
