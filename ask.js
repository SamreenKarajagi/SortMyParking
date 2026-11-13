// Vercel serverless function: POST /api/ask
// Live layer for Saathi. Uses Groq's free tier (Llama 3.3 70B) through its
// OpenAI-compatible API. Without GROQ_API_KEY it returns 501 and the app
// falls back to on-device answers, so the product never breaks.
//
// Guardrails:
//  - The model only sees candidate spots ranked by our own model, and must pick from their IDs.
//  - Numbers (slots, prices, walk times) come from our data; the prompt forbids inventing any.
//  - The client drops any ID that isn't in the candidate list.

const SYSTEM = `You are Saathi, the parking assistant inside SortMyParking, an app for Pune, India.
You help people decide where to leave their car or bike.

Rules:
- Only recommend spots from the "candidates" list, by their "id". Never invent a spot, price, slot count or walk time.
- Reply in the user's language and register. If they write Hinglish or Marathi in Latin script, answer in the same mix.
- Be brief and warm, like a local friend: 2 to 4 short sentences, under 80 words. No lists, no markdown, no em dashes.
- Lead with the best pick and why (walk time, odds, price). Mention one backup if useful.
- If the destination is a known towing area, warn them to avoid kerbside parking.
- If availability is "Tight" or "Likely full", say so plainly and suggest arriving earlier or the backup.
- The "grounded_draft" field is a factual draft written by our ranking model. Keep its facts, improve its voice.

Return JSON only: {"reply": string, "pick_ids": string[] (1 to 3 ids, best first)}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(501).json({ error: 'Live model not configured' });

  const { message, history = [], context } = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 500 || !context?.candidates?.length) {
    return res.status(400).json({ error: 'Bad request' });
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          ...history
            .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 600) })),
          { role: 'user', content: JSON.stringify({ message, context }) },
        ],
      }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Model unavailable' });
    const data = await r.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    const ids = new Set(context.candidates.map((c) => c.id));
    return res.status(200).json({
      reply: String(parsed.reply || '').slice(0, 700),
      pick_ids: (parsed.pick_ids || []).filter((id) => ids.has(id)).slice(0, 3),
    });
  } catch {
    return res.status(502).json({ error: 'Model error' });
  }
}
