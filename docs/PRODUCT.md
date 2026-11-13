# SortMyParking: product thinking

Owner: Samreen Karajagi, Product Manager
Status: v1 shipped as a working web app. Next: validate with real Pune drivers.

---

## 1. The problem, in one line

In Pune, the hard part of going out isn't the traffic. It's the last 500 metres, when you circle FC Road looking for a gap, give up, leave the bike on the kerb, and come back to find it towed.

## 2. Why Pune, why now

The numbers say the city keeps adding vehicles much faster than it adds parking.

- Pune RTO registered 3,45,543 new vehicles in FY 2025-26, up from about 3.05 lakh the year before.
- Pune RTO alone crossed 39 lakh registered vehicles by April 2025. Add Pimpri-Chinchwad and the metro region passes 65 lakh.
- Two-wheelers dominate. During Gudi Padwa 2025, 6,510 of 10,170 new registrations were motorcycles.
- Enforcement is real and expensive. A no-parking tow costs roughly ₹736 for a two-wheeler in Pimpri-Chinchwad, and Pune city fines start near ₹785 for bikes and ₹1,071 for cars before repeat penalties.
- The city is finally digitising. PMC approved a Pay and Park policy back in 2018 and is now trialling it on six roads, including JM Road, FC Road, Laxmi Road, Balewadi High Street and Viman Nagar.
- Policy researchers at Pune International Centre argue the 2016 parking policy is outdated and call for demand-based pricing and digital platforms.

So: more vehicles, stricter towing, and a city that is about to put paid parking on its busiest streets. That's the opening. Whoever helps drivers navigate that shift owns the habit.

Sources are listed at the end.

## 3. Who it's for

These are working hypotheses, built from the public reporting above and my own Pune experience. The first job of the case study is to confirm or kill them with real interviews.

| Persona | Situation | What hurts | What "done" looks like |
|---|---|---|---|
| Rohan, 26, bike, IT in Hinjewadi | Daily commute plus weekend FC Road plans | Gets towed twice a year. Never knows which lanes are safe | Parks in under 3 minutes, never towed |
| Meera, 34, car, Kothrud | Laxmi Road shopping, temple visits with parents | Old city lanes, no idea where a lot is, parents can't walk far | Knows the closest legal lot before she leaves home |
| Arjun, 29, car, Viman Nagar | Phoenix on weekends, airport runs | Basement queues on Saturday evenings | Arrives at a time when it's easy, or skips the queue |
| Sunita, 52, owns a society spot in Aundh | Her spot sits empty 10 am to 7 pm | Wasted asset | Earns a few thousand a month without hassle |

Two sides of the market: drivers (demand) and lot owners plus residents with idle spots (supply).

## 4. Jobs to be done

1. When I'm heading somewhere busy, help me know where I'll leave the vehicle before I leave home, so I'm not circling.
2. When I'm about to park on the street, tell me if I'm about to get towed.
3. When I can't find anything close, give me a smart alternative (go earlier, go to the next lot, park at a metro and ride in).
4. When my spot sits empty all day, let me earn from it safely.

## 5. What I built and what I cut

### In v1
- **Find**: destination search, car or bike, "arriving at" time chips, filters (cheapest, covered, EV, park and ride, host spots), ranked list and map.
- **Availability prediction** for 32 lots across the city: odds of finding a slot, a 24-hour busy chart, and a "come at 5 pm instead" nudge.
- **Saathi, the AI assistant**: ask in plain English, Hinglish or Marathi. It picks a lot, explains why, warns about towing zones and suggests a better time.
- **Reserve or pay and park** with a plate check, bill breakdown and a ticket with a QR code, countdown and one-tap extend.
- **Street parking saver**: save where you parked and check it against towing hotspots.
- **Driver reports**: "plenty free / filling / full" updates the estimate for the next 45 minutes.
- **Two fake-door tests**: the ₹99 Pass waitlist and the host earnings calculator. Cheap ways to measure demand before building.
- **Product metrics view** (`#pm`): live funnel and event log, so I can see what users actually do.

### Cut on purpose
- Real-time sensors. Expensive, slow to deploy, and the model plus reports gets most of the value early.
- Live payments. A demo checkout proves the flow. Razorpay test mode comes next.
- A full map SDK. A schematic map drawn from coordinates loads instantly, costs nothing, and hands turn-by-turn off to Google Maps, which everyone already uses.
- Login. Nobody should sign up to find out where to park. Accounts come when they reserve.

## 6. The AI, and why it's built this way

The temptation with AI is to let the model answer everything. For parking, that's dangerous. A chatty model that invents "plenty of slots at FC Road" sends someone to a towing zone. So Saathi has three layers:

1. **Understanding** (on device): parses where, when, which vehicle and what matters ("covered", "cheapest", "whole day", "udya", "5 baje", "from Kothrud") in English, Hinglish and Marathi.
2. **Deciding** (deterministic): a ranking model scores real spots on predicted odds, walk time, price and preferences. Same input, same answer. Every number traces back to data.
3. **Talking** (LLM, Groq free tier, Llama 3.3 70B): rewrites the answer warmly in the user's own register and can reorder picks, but only among IDs we send. Unknown IDs are dropped on the server and again on the client.

If the LLM is down, slow, or out of free quota, the on-device layer answers instantly. The UI labels which one answered ("Live AI" or "On-device AI"), so I can measure the quality gap.

**Availability model v1.** Occupancy = demand curve for the lot's type (office, mall, market, nightlife, transit, college, hospital, residential) by hour and weekday or weekend, plus city events (Ganeshotsav, Diwali shopping), plus fresh driver reports. Then I subtract a 3.5% buffer, because a lot showing 40 free bays out of 1,500 still means circling. Odds never show 100%: an estimate shouldn't pretend to be certain.

**v2.** Replace the hand-tuned curves with curves learned from bookings, reports and lot partner feeds. Reports are the cold-start training signal, which is why reporting is one tap and shows its impact right away ("your report shapes this estimate for 45 minutes").

## 7. How I measure success

**North Star: successful parks per week.** A park counts if a user went to a spot we suggested and didn't report it full, or they reserved and checked in. It captures both sides of the value: we found them a spot, and they trusted us enough to go.

| Layer | Metric | v1 target to validate |
|---|---|---|
| Activation | Set a destination within the first session | 60% |
| Core action | Opened a spot after a search | 45% |
| Conversion | Reserved or paid after opening a spot | 12% |
| AI quality | Saathi answers where the user opened a pick | 40% |
| Trust | Reports agreeing with our prediction | 70% |
| Retention | Week 4 retention for users with 1+ booking | 25% |
| Supply | Host requests per 1,000 weekly users | 5 |

Guardrails: tow complaints from users who followed our advice (target zero), median time to first useful answer under 2 seconds, LLM cost per answer under ₹0.10.

Every metric above is already instrumented. Events land in the local log and, with one environment key, in PostHog's free tier.

## 8. Making money (and saving users money)

Users first: one avoided tow pays for years of booking fees. That's the core pitch.

| Stream | How | Why it fits |
|---|---|---|
| Booking fee | ₹5 bike, ₹10 car per reservation | Small next to a ₹736+ tow |
| Host commission | 15% of host-spot bookings | Unlocks idle society parking, our unique supply |
| SortMyParking Pass | ₹99 a month: no fees, tow alerts, monthly office spots | Turns commuters into subscribers |
| Lot partnerships | Malls and private lots pay for promoted placement, clearly labelled | Lots want to fill off-peak hours |
| B2B | Monthly parking for offices in Hinjewadi, Kharadi, Magarpatta | Big companies already buy this, badly |
| City data | Anonymised demand heatmaps for PMC's Pay and Park rollout | The city needs demand data to price fairly |

**Illustrative month-12 model** (assumptions, not results): 50,000 monthly users, 20% reserve at least once, 2.5 reservations each, average fee ₹7.5. That's about ₹1.9 lakh in fees. Add 1,500 Pass subscribers (₹1.5 lakh) and 300 host spots doing ₹4,000 GMV each at 15% (₹1.8 lakh). Roughly ₹5 lakh a month before B2B. The case study replaces these assumptions with measured conversion.

Costs stay near zero at this stage: Vercel, Groq, Supabase and PostHog all have free tiers that cover early traffic.

## 9. Retention loops

- **The ticket loop.** Countdown plus one-tap extend means users come back during every booking.
- **The report loop.** Reporting improves the estimate others see. More reports, better predictions, more trust, more users.
- **The host loop.** Every host spot is supply competitors don't have, and hosts tell their society WhatsApp groups.
- **The habit loop.** Saved vehicles and plans for regular places ("Office in Hinjewadi tomorrow") make the second visit faster than the first.

## 10. Go to market in Pune

1. **Start where pain is sharpest.** FC Road, JM Road, Laxmi Road, Phoenix and Hinjewadi Phase 1. Towing hotspots and weekend crunches.
2. **Ride the Pay and Park rollout.** When PMC switches roads to paid parking, people will search for how it works. Be the answer.
3. **Seed supply through societies.** Pitch RWAs in Aundh, Viman Nagar and Kalyani Nagar, where homes sit next to busy streets.
4. **Festival moments.** Ganeshotsav and Diwali shopping guides ("where to park for Dagdusheth this week") are shareable and seasonal.
5. **Colleges and IT parks.** Ambassadors at FC, COEP and Symbiosis. Office admin teams in Hinjewadi for B2B.

## 11. Risks and how I'd handle them

| Risk | Mitigation |
|---|---|
| Predictions wrong early | Show odds, not promises. Label "predicted". Weight reports heavily. Track agreement rate weekly |
| Not enough reports | One-tap reporting, visible impact, small rewards via Pass credit |
| LLM hallucination | Model can only choose among our IDs. Deterministic fallback. All numbers from data |
| Host trust and safety | Verified plates, KYC hosts, ratings, insurance partner before scale |
| Lot partners don't share data | Start with driver reports and booking data, which we own |
| Free-tier limits | On-device AI answers by default when quota runs out. No user ever sees an error |

## 12. Roadmap

- **Now (v1):** prediction, Saathi, reservations, reports, street saver, fake doors.
- **Next 6 weeks:** real accounts (Supabase), Razorpay test mode, PWA notifications for "15 minutes left", 20 user interviews, 200 test users.
- **Next quarter:** first 5 lot partners, first 50 host spots, learned availability curves, Marathi interface.
- **Later:** PMC Pay and Park integration, office B2B, EV charging slot booking.

## 13. What the case study will measure

- 15 to 20 interviews across the four personas, with a short survey (time spent searching, tows in the last year, willingness to pay).
- Usability test of three tasks: plan a Saturday Phoenix trip, find bike parking on FC Road, reserve and extend.
- Funnel and retention from real users through PostHog.
- Prediction accuracy: compare our estimate to driver reports.
- Fake-door results: Pass waitlist rate and host form completion.

## Sources

- [Pune RTO surpasses revenue target, FY 2025-26 (Free Press Journal)](https://www.freepressjournal.in/pune/pune-rto-surpasses-revenue-target-collects-1922-crore-in-2025-26)
- [Pune's vehicle count crosses 39 lakh (Free Press Journal)](https://www.freepressjournal.in/pune/punes-vehicle-count-crosses-39-lakh-worsening-traffic-electric-vehicle-sales-decline)
- [How India moves: Pune's roads and two-wheeler traffic (Down To Earth)](https://www.downtoearth.org.in/air/how-india-moves-punes-roads-buckle-under-an-explosion-of-two-wheeler-traffic)
- [Gudi Padwa 2025 vehicle registrations (Punekar News)](https://www.punekarnews.in/?p=201983)
- [PMC to roll out Pay and Park, trial on six roads (Free Press Journal)](https://www.freepressjournal.in/pune/pune-pmc-to-finally-roll-out-pay-park-policy-after-seven-years-trial-on-six-roads)
- [Pimpri-Chinchwad towing fines (The Bridge Chronicle)](https://www.thebridgechronicle.com/news/no-parking-pimpri-chinchwad-police-to-fine-736-for-two-wheelers-972-for-four-wheelers)
- [No parking fine in Pune (TATA AIG)](https://www.tataaig.com/knowledge-center/two-wheeler-insurance/no-parking-fine-in-pune)
- [Towards a new parking policy for Pune (Pune International Centre)](https://puneinternationalcentre.org/?p=25312)
- [Parking chaos at Balewadi High Street (Free Press Journal)](https://www.freepressjournal.in/amp/pune/pune-news-parking-chaos-at-balewadi-high-street-leaves-visitors-frustrated)
