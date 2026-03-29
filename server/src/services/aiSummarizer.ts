import Anthropic from '@anthropic-ai/sdk';

export interface AiSummaryPayload {
  summaryEn: string[];
  summaryTr: string[];
  sentiment: 'HOT' | 'NEUTRAL' | 'CAUTIOUS';
  pitchEn: string;
  pitchTr: string;
  trendingAreas: string[];
  targetPersonaEn: string;
  targetPersonaTr: string;
  objectionKillerEn: string;
  objectionKillerTr: string;
  leadGenQuery: string;
  voiceNoteScript: string;
  fomoTrigger: string;
}

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function generateMarketSummary(headlines: string[]): Promise<AiSummaryPayload | null> {
  const anthropic = getClient();
  if (!anthropic) {
    console.warn('[aiSummarizer] ANTHROPIC_API_KEY not set — skipping AI summary');
    return null;
  }

  const systemPrompt = `You are a senior Dubai real estate market analyst providing concise intelligence briefings for professional brokers. You always respond with raw valid JSON only. Do not include markdown formatting, backticks, or code blocks of any kind. Your entire response must be parseable by JSON.parse() with no pre-processing.`;

  const userPrompt = [
    'Based on these recent UAE/Dubai real estate headlines, produce a market intelligence briefing.',
    '',
    'Return a single raw JSON object with exactly this shape (no markdown, no code fences):',
    '{',
    '  "summaryEn": ["bullet 1", "bullet 2", "bullet 3"],',
    '  "summaryTr": ["madde 1", "madde 2", "madde 3"],',
    '  "sentiment": "HOT",',
    '  "pitchEn": "One sentence broker pitch in English",',
    '  "pitchTr": "One sentence broker pitch in Turkish",',
    '  "trendingAreas": ["Dubai Marina", "Downtown Dubai"],',
    '  "targetPersonaEn": "Exact client profile description in English",',
    '  "targetPersonaTr": "Exact client profile description in Turkish",',
    '  "objectionKillerEn": "One psychological sentence to overcome fears/negative news in English",',
    '  "objectionKillerTr": "One psychological sentence to overcome fears/negative news in Turkish",',
    '  "leadGenQuery": "(\\"CEO\\" OR \\"CFO\\") AND \\"London\\" AND \\"real estate investment\\"",',
    '  "voiceNoteScript": "20 saniyelik sesli mesaj metni Türkçe olarak, köşeli parantez içinde ton yönergeleriyle",',
    '  "fomoTrigger": "Bu hafta satın almak için büyük aciliyet yaratan 1 cümlelik psikolojik tetikleyici"',
    '}',
    '',
    'Rules:',
    '- summaryEn: exactly 3 plain strings (no bullet chars), each a clear actionable market signal',
    '- summaryTr: exactly 3 Turkish translations of summaryEn bullets',
    '- sentiment: exactly one of "HOT", "NEUTRAL", or "CAUTIOUS" based on overall market tone',
    '- pitchEn: a single actionable sentence a broker could say to a client in English',
    '- pitchTr: Turkish translation of pitchEn',
    '- trendingAreas: array of 2–4 specific Dubai area names actually mentioned in the headlines below',
    '- targetPersonaEn: a specific, actionable description of the exact type of client most likely to buy TODAY based on today\'s news (e.g. "Cash buyers from Europe seeking beachfront villas under AED 5M")',
    '- targetPersonaTr: Turkish translation of targetPersonaEn',
    '- objectionKillerEn: a single confident, psychologically compelling sentence a broker can say to neutralize any fear or negative signal in today\'s news',
    '- objectionKillerTr: Turkish translation of objectionKillerEn',
    '- leadGenQuery: a raw English Boolean search string ONLY — example format: ("CEO" OR "Family Office") AND "London" AND "real estate" — NO Google dorks (no site:, intitle:, inurl:), NO pipe characters (|), NO Turkish text, NO explanations or prefixes like "LinkedIn:" or "Google:". Output ONLY the bare Boolean string that can be pasted directly into any search engine.',
    '- voiceNoteScript: a highly conversational, energetic 20-second voice note script written entirely in Turkish. Include bracketed tone directions in Turkish (e.g., [Heyecanlı ve samimi], [Güven vererek], [Aciliyet hissiyle]). The script must reference today\'s specific news. Must feel natural when spoken aloud.',
    '- fomoTrigger: a single devastatingly urgent sentence in Turkish that creates massive psychological FOMO — why this specific week is a once-in-a-year opportunity based on today\'s news. Must feel like insider intelligence.',
    '',
    'Headlines:',
    ...headlines.slice(0, 20).map((h, i) => `${i + 1}. ${h}`),
  ].join('\n');

  try {
    console.log(`[aiSummarizer] Calling Claude API with ${headlines.length} headlines...`);
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const block = message.content[0];
    const raw = block.type === 'text' ? block.text.trim() : null;
    if (!raw) return null;

    // Strip markdown code fences if the model wraps the JSON anyway
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const parsed = JSON.parse(cleaned) as AiSummaryPayload;
      console.log('[aiSummarizer] ✓ Summary generated successfully.');
      return parsed;
    } catch (parseErr) {
      console.error('[aiSummarizer] JSON parse failed. Raw response:', raw);
      return null;
    }
  } catch (err) {
    console.error('[aiSummarizer] API error:', err instanceof Error ? err.message : err);
    return null;
  }
}
