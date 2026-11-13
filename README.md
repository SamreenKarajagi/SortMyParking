# SortMyParking

Find, predict and reserve parking across Pune. Ask Saathi, the AI parking assistant, in English, Hinglish or Marathi.

The product thinking behind every decision is in [docs/PRODUCT.md](docs/PRODUCT.md).

## What it does

- **Find**: search a destination, pick car or bike and when you're arriving. Get lots ranked by your odds of finding a slot, walk time and price.
- **Predict**: a 24-hour busy chart per lot and a nudge when arriving earlier makes it easier.
- **Ask Saathi**: "Dagdusheth la jaycha aahe, gaadi kuthe lavu?" gets a real answer with picks you can tap.
- **Reserve or pay and park**: plate check, bill, QR ticket, countdown, one-tap extend.
- **Avoid towing**: towing zones on the map, warnings in answers, and a street-parking saver that checks where you left the vehicle.
- **Report**: one tap updates availability for everyone for 45 minutes.
- **Product metrics**: open `#pm` to see the funnel and event log.

## Run it

```bash
npm install
npm run dev
```

Works fully offline in on-device AI mode. No keys needed.

## Deploy for free (about 10 minutes)

1. Push this folder to a new GitHub repo.
2. On [vercel.com](https://vercel.com), import the repo. Vercel detects Vite. Click Deploy.
3. Get a free key at [console.groq.com/keys](https://console.groq.com/keys).
4. In Vercel, go to Project, Settings, Environment Variables. Add `GROQ_API_KEY`. Redeploy.
5. Saathi now shows "Live AI" under its answers. Without the key it says "On-device AI" and still works.

Optional: add `VITE_POSTHOG_KEY` from a free [PostHog](https://posthog.com) project to collect real funnels and retention for the case study.

## Free stack

| Need | Tool | Cost |
|---|---|---|
| App | React 18 + Vite | Free |
| Hosting and API | Vercel Hobby (static + serverless `api/ask.js`) | Free |
| LLM | Groq, Llama 3.3 70B | Free tier |
| Analytics | PostHog | Free tier |
| Database (v2) | Supabase, schema in `supabase/schema.sql` | Free tier |
| Map | Hand-drawn schematic SVG from coordinates, Google Maps deep links for directions | Free, no key |
| QR tickets | `qrcode` npm | Free |
| Fonts | Overpass, Overpass Mono, Mukta (self-hosted via Fontsource) | Free |

## How the code is organised

```
api/ask.js               Serverless LLM route with guardrails (Groq)
src/data/pune.js         32 lots, 28 landmarks, towing zones, city events
src/lib/predict.js       Availability model: demand curves + events + reports
src/lib/rank.js          Deterministic ranking (odds, walk, price, preferences)
src/lib/assistant.js     Saathi: parser for English/Hinglish/Marathi, grounded replies, live LLM call
src/lib/store.js         Local state (swap for Supabase later, same shape)
src/lib/analytics.js     Event tracking, local log + PostHog
src/components/          Map, Find, Spot detail, Ask, Booking, Ticket, My parking, PM view
docs/PRODUCT.md          Problem, personas, AI design, metrics, revenue, GTM, roadmap
```

## Honest notes

- Lot locations are real Pune places. Capacities, rates and host spots are demo seed data until partner feeds and real hosts come in.
- Checkout is a demo. No money moves.
- The map is schematic on purpose. Directions open Google Maps.
