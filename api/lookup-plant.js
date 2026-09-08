export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { name, categories } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });

  const prompt = 'You are a gardening reference. For the plant "' + name + '", return ONLY a JSON object (no markdown, no commentary) with this exact shape:\n' +
    '{"name":"common name","sci":"botanical name","category":"one of: ' + (categories || '') + '","light":"short light needs","water":"short watering needs","soil":"short soil needs","spacing":"short spacing guidance","ongoing":"1-2 sentence ongoing care notes","tasks":[{"label":"task name","sm":<start month 1-12>,"em":<end month 1-12>,"how":"2-4 sentence how-to"}]}\n' +
    'Include 3 to 6 seasonal care tasks (e.g. planting, pruning, feeding, harvesting) with realistic Northern Hemisphere month ranges. Respond with raw JSON only.';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: 'upstream error', detail: t });
    }
    const data = await r.json();
    const text = data.content && data.content[0] && data.content[0].text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(502).json({ error: 'no json in response' });
    const parsed = JSON.parse(match[0]);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
