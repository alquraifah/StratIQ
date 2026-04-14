export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { industry, region, compType, horizon } = req.body;

  if (!industry || !region) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `You are a senior strategy consultant. Analyze market entry opportunity for:
- Industry: ${industry}
- Region: ${region}
- Company Type: ${compType}
- Investment Horizon: ${horizon}

Respond ONLY with a valid JSON object in this exact structure (no markdown, no extra text):
{
  "marketSize": "$XX.XB or $XXM",
  "cagr": "XX.X%",
  "competitiveIndex": "Fragmented or Moderate or Concentrated",
  "entryComplexity": "Low or Medium or High",
  "marketStructure": "one short phrase",
  "score": 75,
  "swot": {
    "s": ["strength 1", "strength 2", "strength 3"],
    "w": ["weakness 1", "weakness 2", "weakness 3"],
    "o": ["opportunity 1", "opportunity 2", "opportunity 3"],
    "t": ["threat 1", "threat 2", "threat 3"]
  },
  "competitors": [
    {"name": "Company A", "description": "brief description", "share": "XX%"},
    {"name": "Company B", "description": "brief description", "share": "XX%"},
    {"name": "Company C", "description": "brief description", "share": "XX%"}
  ],
  "timeline": [
    {"phase": "Phase 1 (0-6M)", "action": "what to do"},
    {"phase": "Phase 2 (6-18M)", "action": "what to do"},
    {"phase": "Phase 3 (18-36M)", "action": "what to do"},
    {"phase": "Phase 4 (36M+)", "action": "what to do"}
  ],
  "trends": ["trend 1", "trend 2", "trend 3", "trend 4"],
  "risks": [
    {"name": "Risk Name", "level": "High", "mitigation": "mitigation strategy"},
    {"name": "Risk Name", "level": "Medium", "mitigation": "mitigation strategy"},
    {"name": "Risk Name", "level": "Low", "mitigation": "mitigation strategy"}
  ],
  "verdict": "One paragraph strategic recommendation."
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: 'OpenAI error', details: err });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: 'Analysis failed', message: error.message });
  }
}
