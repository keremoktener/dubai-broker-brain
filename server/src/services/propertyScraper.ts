import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

export interface ScrapedProperty {
  propertyName: string;
  purchasePrice: number;
  propertySizeSqft: number;
  expectedAnnualRent: number | null;
  estimatedServiceChargePerSqft: number | null;
}

export async function scrapePropertyUrl(url: string): Promise<ScrapedProperty> {
  try {
    const jinaUrl = 'https://r.jina.ai/' + url;
    const response = await axios.get(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'text',
      },
      timeout: 20000,
    });

    const rawText = String(response.data).replace(/\s+/g, ' ').trim().slice(0, 6000);
    console.log('[propertyScraper] RAW SCRAPE RESULT (First 500 chars):', rawText.substring(0, 500));

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      temperature: 0,
      system:
        'You must output ONLY a raw, valid JSON object. Absolutely NO markdown code blocks (no ```json, no ```), NO conversational text, and NO explanations. Your entire response must be parseable by JSON.parse() with no preprocessing. Extract property details from the provided text. The JSON must have exactly these keys: propertyName (string), purchasePrice (number in AED — never null), propertySizeSqft (number — never null), expectedAnnualRent (number in AED per year — never null), estimatedServiceChargePerSqft (number in AED per sqft per year — never null). If expectedAnnualRent or estimatedServiceChargePerSqft are not explicitly written in the text, you MUST calculate them using these exact rules — do not guess: RULE 1 (estimatedServiceChargePerSqft): If the text mentions luxury branded or hotel residences (e.g. St Regis, Address, Armani, Four Seasons, Bulgari, Dorchester), use 40. If premium or waterfront (e.g. Emaar Beachfront, Dubai Harbour, Palm Jumeirah, Creek Harbour), use 20. Otherwise use 15. RULE 2 (expectedAnnualRent): Calculate from the extracted purchasePrice. If luxury/branded residence, multiply purchasePrice by 0.05. If standard or other, multiply purchasePrice by 0.065. Return only the final calculated integer in the JSON — no explanation.',
      messages: [{ role: 'user', content: rawText }],
    });

    const raw =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/^\s*json\s*/i, '')
      .trim();

    try {
      return JSON.parse(cleaned) as ScrapedProperty;
    } catch {
      throw new Error('Claude returned invalid JSON: ' + raw);
    }
  } catch (err) {
    throw new Error(
      'Scrape failed: ' + (err instanceof Error ? err.message : String(err))
    );
  }
}
