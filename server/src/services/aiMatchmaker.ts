import Anthropic from '@anthropic-ai/sdk';
import type { MockProperty } from './propertyFetcher.js';

export interface MatchResult {
  bestMatch: string;
  propertyId: string;
  matchScore: number;
  reasoning: string;
  whatsappPitch: string;
}

export interface ClientProfile {
  name: string;
  persona_type: string;
  max_budget: number;
  preferred_areas: string[];
  property_type: string;
  urgency_level: string;
}

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function runAiMatchmaker(
  clientProfile: ClientProfile,
  properties: MockProperty[],
  targetLanguage: 'EN' | 'TR',
): Promise<MatchResult | null> {
  const anthropic = getClient();
  if (!anthropic) {
    console.warn('[aiMatchmaker] ANTHROPIC_API_KEY not set — skipping');
    return null;
  }

  const systemPrompt = targetLanguage === 'TR'
    ? `Sen Dubai'nın en seçkin emlak danışmanısın. Sadece ham, geçerli JSON döndürürsün. Markdown, kod blokları veya backtick kullanmazsın. Tüm yanıtın JSON.parse() ile işlenebilir olmalıdır. KESİNLİKLE YASAK: "Lira" kelimesini ASLA kullanma. Tüm para birimi AED veya Dirham olarak ifade edilir.`
    : `You are Dubai's most elite real estate matchmaker. You respond only with raw valid JSON. No markdown, no code blocks, no backticks. Your entire response must be parseable by JSON.parse(). STRICT RULE: NEVER use the word "Lira". All currency is in AED or Dirham only.`;

  const propertySummaries = properties.map(p =>
    `ID: ${p.id} | ${p.name} | ${p.developer} | ${p.area} | ${p.type} | AED ${p.price.toLocaleString()} | ${p.bedrooms}BR | ${p.sizeSqft} sqft | Completion: ${p.completionYear} | ROI: ${p.roiEstimate}% | Highlights: ${p.highlights.join('; ')}`
  ).join('\n');

  const languageInstructions = targetLanguage === 'TR'
    ? `TÜRKÇE DİL KURALLARI (KESİNLİKLE UYULACAK):
- Akıcı, anadil düzeyinde Türkçe kullan
- Gerçek Türk gayrimenkul terminolojisi: "değer artışı", "kira getirisi", "anahtar teslim", "fırsatçı piyasa", "yatırım cazibesi", "konum avantajı", "sermaye kazancı"
- SIFIR İngilizce kelime karıştırma (Plaza Türkçesi yasak)
- ASLA "Lira" yazma — para birimi her zaman AED veya Dirham
- Tonu: güvenilir, samimi, sofistike bir Türk danışman — asla tercümana benzemesin
- WhatsApp pitchi doğal konuşma diliyle, müşteriye özel referanslarla

ÖRNEK WHATSAPP PİTCHİ (bu yapıyı ve dil tonunu birebir taklit et):
"Kerem Bey merhaba. Tam yatırım profilinize ve 3 Milyon AED bütçenize uygun, Dubai Harbour'da Emaar imzalı bir fırsat önüme düştü. %7.2 net kira getirisi öngörüyoruz ve 60/40 esnek ödeme planı mevcut. Bölgedeki değer artışı hızlanmadan bu projeyi değerlendirmeliyiz. Detayları görüşmek için bugün kısa bir arama yapalım mı?"

WHATSAPP PİTCHİ YAPI KURALLARI:
1. [İsim] Bey/Hanım merhaba — ile başla
2. "Tam profilinize uygun ... bir fırsat önüme düştü" yapısını kullan
3. Somut ROI veya getiri rakamı ver (% olarak)
4. "değer artışı" veya "kira getirisi" gibi bir Türkçe gayrimenkul terimi kullan
5. "Bugün kısa bir arama yapalım mı?" veya benzeri samimi bir CTA ile bitir
6. 3-4 cümle maksimum`
    : `ENGLISH LANGUAGE RULES:
- Use elite Dubai broker tone — confident, authoritative, exclusive
- Reference specific property highlights tied to client's profile
- Convey FOMO and scarcity naturally
- WhatsApp pitch must feel personal, not templated — use client's name and their specific criteria`;

  const userPrompt = `
CLIENT PROFILE:
- Name: ${clientProfile.name}
- Persona: ${clientProfile.persona_type}
- Max Budget: AED ${clientProfile.max_budget.toLocaleString()}
- Preferred Areas: ${clientProfile.preferred_areas.join(', ') || 'Flexible'}
- Property Type: ${clientProfile.property_type}
- Urgency: ${clientProfile.urgency_level}

AVAILABLE PROPERTIES:
${propertySummaries}

${languageInstructions}

Analyze the client profile against all properties. Select the BEST match considering budget fit, area preferences, property type, and persona.

Return ONLY this raw JSON (no markdown, no code fences):
{
  "bestMatch": "<exact property name>",
  "propertyId": "<property id>",
  "matchScore": <integer 60-99>,
  "reasoning": "<2-3 sentences explaining why this is the best match for this specific client — in ${targetLanguage === 'TR' ? 'Turkish' : 'English'}>",
  "whatsappPitch": "<a highly persuasive, personalized WhatsApp message the broker sends to ${clientProfile.name} — in ${targetLanguage === 'TR' ? 'Turkish: follow the ÖRNEK yapısını birebir uygula — [İsim] Bey/Hanım merhaba ile başla, somut ROI ver, Türkçe gayrimenkul terimi kullan, CTA ile bitir. ASLA Lira yazma, SIFIR İngilizce.' : 'English, elite Dubai broker tone — NEVER use the word Lira, all currency in AED'} — 3-4 sentences maximum>"
}`;

  try {
    console.log(`[aiMatchmaker] Running match for ${clientProfile.name} in ${targetLanguage}...`);
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const block = message.content[0];
    const raw = block.type === 'text' ? block.text.trim() : null;
    if (!raw) return null;

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const result = JSON.parse(cleaned) as MatchResult;
      console.log(`[aiMatchmaker] ✓ Match: ${result.bestMatch} (${result.matchScore}%)`);
      return result;
    } catch {
      console.error('[aiMatchmaker] JSON parse failed. Raw:', raw);
      return null;
    }
  } catch (err) {
    console.error('[aiMatchmaker] API error:', err instanceof Error ? err.message : err);
    return null;
  }
}
