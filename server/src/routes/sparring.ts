import { Router } from 'express';
import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { authenticateToken } from '../middleware/auth.js';
import { getDb } from '../db/database.js';

const router = Router();

router.use(authenticateToken);

interface SparringBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  targetPersona: string;
  newsSummary: string[];
  personaId?: string;
  lang?: 'tr' | 'en';
}

function buildInvestorSystemPrompt(targetPersona: string, newsSummary: string[], personaId?: string, lang: 'tr' | 'en' = 'en'): string {
  const numberedNews = newsSummary.map((item, i) => `${i + 1}. ${item}`).join('\n');

  const personaDescriptions: Record<string, string> = {
    'daily-news': `You are a skeptical, experienced High-Net-Worth investor evaluating a Dubai real estate pitch. You have a net worth of $50M+, you have been burned by overhyped markets before, and you ask tough, realistic questions. You are direct, occasionally dismissive, and base your objections on current market conditions.`,
    'russian-crypto-whale': `You are a Russian crypto billionaire with $200M+ in digital assets looking to diversify into real estate. You are demanding, impatient, and want exclusivity and off-plan opportunities with massive upside. You test the broker's knowledge aggressively. You respond with short, blunt sentences. You are skeptical of anyone who hasn't dealt with UHNW clients before.`,
    'cautious-european-pensioner': `You are a 68-year-old retired Swiss banker with €3M to invest. You are extremely risk-averse, focused on capital preservation and rental yield. You are polite but deeply skeptical of market hype. You ask detailed questions about regulatory risk, exit liquidity, and what happens if property values drop 30%. You move very slowly and need to feel fully safe before committing.`,
    'gulf-family-office': `You are a representative of a Gulf-based family office managing $500M in assets. You think long-term (10-20 year horizon), are focused on wealth preservation and legacy, and prefer Grade A assets in established areas. You are formal, measured, and require proper documentation and process. You will not be rushed.`,
    'aggressive-chinese-developer': `You are a Chinese property developer with construction company backing. You want to buy in bulk (5-10 units minimum), you demand volume discounts, and you are purely numbers-driven. You compare everything to returns in Shanghai and Singapore. You push hard on price and will walk if the math doesn't work instantly.`,
  };

  const personaDesc = personaDescriptions[personaId ?? 'daily-news'] ?? personaDescriptions['daily-news'];

  return `${personaDesc}

Current market context:
${numberedNews}

The broker is targeting: ${targetPersona}

Your role: React to the broker's pitch with realistic investor skepticism. Raise specific objections based on the news above. Never be easily convinced. Make the broker work for it. Keep responses to 2-4 sentences — punchy, realistic, challenging.
${lang === 'tr' ? `Respond in Turkish (Türkçe). Strict linguistic rules — violations are not acceptable:
- Use ONLY native Turkish real estate and finance vocabulary. NEVER mix English words into Turkish grammar.
- BANNED hybrid terms: "scale et", "hold", "hold et", "appreciation", "spec piyasası", "cash flow", "exit et", "flip et", "yield", "pipeline", "off-plan al".
- CORRECT Turkish equivalents: "değer artışı" (appreciation), "elde tutma süresi" (hold period), "yatırım getirisi" or "kira getirisi" (yield/ROI), "nakit akışı" (cash flow), "fırsatçı piyasa" (spec market), "proje aşamasında satın alma" (off-plan), "çıkış stratejisi" (exit strategy), "inşaat aşamasında mülk" (under construction property).
- Speak like a culturally fluent, educated Turkish HNW investor — authoritative, direct, occasionally dismissive, never robotic.
- Grammar must be flawless native Turkish. No code-switching.` : 'Respond in English.'}`;
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { messages, targetPersona, newsSummary } = req.body as SparringBody;

  if (!Array.isArray(messages) || messages.length < 1) {
    res.status(400).json({ error: 'messages must be a non-empty array' });
    return;
  }
  if (!targetPersona || typeof targetPersona !== 'string') {
    res.status(400).json({ error: 'targetPersona is required' });
    return;
  }
  if (!Array.isArray(newsSummary)) {
    res.status(400).json({ error: 'newsSummary must be an array' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'AI service not configured' });
    return;
  }

  const client = new Anthropic({ apiKey });

  const { personaId, lang = 'en' } = req.body as SparringBody;
  const systemPrompt = buildInvestorSystemPrompt(targetPersona, newsSummary, personaId, lang);

  const lastInvestorMessage = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';
  const lastBrokerMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  const coachLangInstruction = lang === 'tr'
    ? `- Türkçe yaz. Anadili Türkçe olan, deneyimli bir gayrimenkul satış koçu gibi yaz.
- KESİNLİKLE İngilizce-Türkçe karışımı kullanma. Yasak hibrit kelimeler: "scale et", "hold", "flip et", "exit et", "yield", "pipeline", "appreciation".
- Doğru Türkçe karşılıkları kullan: "değer artışı", "elde tutma", "yatırım getirisi", "nakit akışı", "çıkış stratejisi", "kira getirisi".
- Psikolojik tekniğin Türkçe adını yaz (örn: "yeniden çerçeveleme", "sosyal kanıt", "kıtlık", "kabul et ve pivot yap").
- Brokerın hemen kullanabileceği somut bir Türkçe örnek cümle ver. Akıcı, doğal, yetkili bir dil kullan.`
    : '- Write in English';

  const coachSystemPrompt = `You are a veteran Dubai real estate sales coach with 20+ years closing high-net-worth deals. Your job is to give the broker one razor-sharp, immediately actionable tip after each investor objection.

Rules:
- 2 sentences max. Be direct. No fluff.
- Name the specific psychological technique (e.g. "reframe", "social proof", "scarcity", "agree-then-pivot")
- Give one concrete example sentence the broker can say RIGHT NOW
${coachLangInstruction}`;

  const coachUserPrompt = `The investor just said: "${lastInvestorMessage || '(opening message — no investor response yet)'}"
The broker pitched: "${lastBrokerMessage}"

What is the single best move for the broker right now?`;

  try {
    const [investorCompletion, coachCompletion] = await Promise.all([
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt,
        messages,
      }),
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: coachSystemPrompt,
        messages: [{ role: 'user', content: coachUserPrompt }],
      }),
    ]);

    const reply = investorCompletion.content[0].type === 'text' ? investorCompletion.content[0].text : '';
    const coachTip = coachCompletion.content[0].type === 'text' ? coachCompletion.content[0].text : '';
    res.json({ reply, coachTip });
  } catch (err) {
    console.error('[sparring] Anthropic API error:', err);
    res.status(502).json({ error: 'AI service request failed' });
  }
});

router.get('/sessions', (req: Request, res: Response): void => {
  const userId = (req as any).user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const db = getDb();
  const rows = db.prepare(
    'SELECT id, title, target_persona, message_count, closing_score, created_at FROM sparring_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(userId);
  res.json(rows);
});

router.post('/sessions', async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { title, targetPersona, newsSummary, messages, personaId } = req.body as {
    title: string;
    targetPersona: string;
    newsSummary: string[];
    messages: Array<{ role: string; content: string; coachTip?: string }>;
    personaId?: string;
  };

  if (!title || !targetPersona || !Array.isArray(messages) || messages.length < 1) {
    res.status(400).json({ error: 'Invalid session data' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let closingScore: number | null = null;
  let missedSignals: string[] = [];
  let veteranRewrite: string | null = null;

  if (apiKey) {
    const client = new Anthropic({ apiKey });
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'BROKER' : 'INVESTOR'}: ${m.content}`)
      .join('\n');

    const analysisPrompt = `You are an elite real estate sales coach. Analyze this broker-investor conversation transcript and return ONLY a raw JSON object — no markdown, no code fences.

Transcript:
${transcript}

Return exactly this shape:
{
  "closingScore": <integer 1-100 representing how close the broker came to closing this deal>,
  "missedSignals": [<array of 2-4 specific strings, each naming an exact moment where the broker missed a buying signal, failed to isolate an objection, or had a clear closing opportunity but didn't take it>],
  "veteranRewrite": "<take the broker's single weakest response and rewrite it as a master closer would — start with BROKER SAID: then VETERAN WOULD SAY:>"
}`;

    try {
      const analysis = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: analysisPrompt }],
      });
      const raw = analysis.content[0].type === 'text' ? analysis.content[0].text.trim() : '';
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        closingScore = typeof parsed.closingScore === 'number' ? parsed.closingScore : null;
        missedSignals = Array.isArray(parsed.missedSignals) ? parsed.missedSignals : [];
        veteranRewrite = typeof parsed.veteranRewrite === 'string' ? parsed.veteranRewrite : null;
      } catch { console.error('[sparring/sessions] analysis JSON parse failed'); }
    } catch (err) { console.error('[sparring/sessions] analysis API error:', err); }
  }

  const db = getDb();
  const result = db.prepare(
    `INSERT INTO sparring_sessions
     (user_id, title, target_persona, news_summary, messages, message_count, closing_score, missed_signals, veteran_rewrite)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    title,
    targetPersona,
    JSON.stringify(newsSummary ?? []),
    JSON.stringify(messages),
    messages.length,
    closingScore,
    JSON.stringify(missedSignals),
    veteranRewrite,
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    closingScore,
    missedSignals,
    veteranRewrite,
  });
});

router.post('/icebreakers', async (req: Request, res: Response): Promise<void> => {
  const { personaId, targetPersona, newsSummary } = req.body as {
    personaId: string;
    targetPersona: string;
    newsSummary: string[];
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(503).json({ error: 'AI service not configured' }); return; }

  const personaNames: Record<string, string> = {
    'daily-news': 'a skeptical HNW investor focused on today\'s market news',
    'russian-crypto-whale': 'a Russian crypto billionaire demanding exclusivity and off-plan upside',
    'cautious-european-pensioner': 'a risk-averse retired Swiss banker focused on yield and capital safety',
    'gulf-family-office': 'a formal Gulf family office representative focused on long-term wealth preservation',
    'aggressive-chinese-developer': 'an ROI-driven Chinese developer who wants bulk deals and instant numbers',
  };

  const personaDesc = personaNames[personaId] ?? personaNames['daily-news'];
  const newsContext = newsSummary.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n');

  const prompt = `You are an elite Dubai real estate sales trainer. Generate exactly 3 opening icebreaker lines for a broker about to pitch to ${personaDesc}.

Context about the investor today: ${targetPersona}
Today's market: ${newsContext}

Return ONLY a raw JSON object — no markdown, no code fences. Each opener must be provided in BOTH English and Turkish:
{
  "direct": "<bold, confident 1-sentence opener in English that immediately states value>",
  "directTr": "<same opener translated naturally into Turkish>",
  "consultative": "<curious, rapport-building opener in English that asks about their goals>",
  "consultativeTr": "<same opener translated naturally into Turkish>",
  "urgency": "<market-news-based opener in English that creates FOMO using today's specific context>",
  "urgencyTr": "<same opener translated naturally into Turkish>"
}`;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (err) {
    console.error('[sparring/icebreakers] error:', err);
    res.status(502).json({ error: 'Failed to generate icebreakers' });
  }
});

export default router;
