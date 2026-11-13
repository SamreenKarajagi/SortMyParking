import { useEffect, useState } from 'react';

const KEY = 'smp:v1';

const DEFAULT = {
  vehicle: 'car',
  vehicles: [],
  active: null,
  history: [],
  parked: null,
  reports: {},
  waitlist: { pass: false, host: null },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

// One small local store. Production swaps this for Supabase (see supabase/schema.sql)
// behind the same shape, so components never change.
export function useStore() {
  const [state, setState] = useState(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: the app still works for this session */
    }
  }, [state]);
  const update = (fn) => setState((s) => ({ ...s, ...fn(s) }));
  return [state, update];
}
