import Anthropic from '@anthropic-ai/sdk';

export type Platform = 'faceless-reel' | 'instagram-carousel' | 'linkedin-post' | 'twitter-thread';

interface BasePayload {
  topic: string;
  imageSearchKeyword: string;
  viralHeadline: string;
}

export interface FacelessReelPayload extends BasePayload {
  scenes: { visualCue: string; textOverlay: string }[];
}

export interface InstagramCarouselPayload extends BasePayload {
  slides: { heading: string; bodyText: string }[];
}

export interface LinkedInPostPayload extends BasePayload {
  postBody: string;
}

export interface TwitterThreadPayload extends BasePayload {
  tweets: { text: string }[];
}

export type ContentPayload =
  | FacelessReelPayload
  | InstagramCarouselPayload
  | LinkedInPostPayload
  | TwitterThreadPayload;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const GLOBAL_PERSONA = `You are an autonomous Dubai real estate content strategist operating inside a wealth management firm. You receive live market headlines and a history of recently covered topics. Your role: choose the single most strategic topic to cover right now, generate institutional-grade content for it, and supply metadata for visuals.

Topic selection rules:
- Review the history to AVOID repeating recent topics.
- 70% probability: choose a topic driven by trending live headlines.
- 30% probability: choose an evergreen investor psychology topic (e.g., capital preservation, scarcity of trophy assets, inflation hedge via real estate).
- ALWAYS frame Dubai positively as an appreciating, bulletproof safe haven. If global news is negative, invert the narrative — use it as proof of Dubai's relative strength and stability.

Tone: emotionally detached, authoritative, institutional. ABSOLUTELY NO emojis, NO hashtags, NO exclamation points, NO asking for engagement.

You always respond with raw valid JSON only. No markdown, no code fences. Your entire response must be parseable by JSON.parse() with no pre-processing.`;

function buildPrompt(
  platform: Platform,
  recentTopics: string[],
  headlines: string[],
): { system: string; user: string } {
  const historyBlock = recentTopics.length > 0
    ? `RECENT TOPICS COVERED (do not repeat these):\n${recentTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : 'RECENT TOPICS COVERED: None yet.';

  const headlinesBlock = headlines.length > 0
    ? `LIVE DUBAI REAL ESTATE HEADLINES:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
    : 'LIVE HEADLINES: Not available. Use your knowledge of current Dubai market dynamics.';

  const baseInstructions = [
    historyBlock,
    '',
    headlinesBlock,
    '',
    'Based on the above, choose one strategic topic. Then generate content for it.',
    '',
    'Your JSON response MUST include these base fields in addition to the platform-specific fields:',
    '- "topic": a concise 5-10 word description of the topic you chose (e.g., "Palm Jumeirah villa prices surge 40% YoY")',
    '- "imageSearchKeyword": 1-3 words for an Unsplash stock photo search that matches the topic (e.g., "dubai marina", "luxury interior", "palm jumeirah aerial", "dubai skyline night")',
    '- "viralHeadline": a punchy 5-10 word hook in ALL CAPS, no punctuation at end',
  ].join('\n');

  switch (platform) {
    case 'faceless-reel':
      return {
        system: GLOBAL_PERSONA,
        user: [
          baseInstructions,
          '',
          'Return a single raw JSON object with exactly this shape:',
          '{',
          '  "topic": "...",',
          '  "imageSearchKeyword": "...",',
          '  "viralHeadline": "...",',
          '  "scenes": [',
          '    { "visualCue": "...", "textOverlay": "..." },',
          '    { "visualCue": "...", "textOverlay": "..." },',
          '    { "visualCue": "...", "textOverlay": "..." },',
          '    { "visualCue": "...", "textOverlay": "..." }',
          '  ]',
          '}',
          '',
          'Platform rules:',
          '- scenes: exactly 4 objects.',
          '- visualCue: cinematic dark-luxury B-roll. E.g.: "Slow-motion tracking shot of a dark blue BMW i5 M60 at golden hour in Dubai Marina". Highly specific and cinematic.',
          '- textOverlay: max 8 words. Scene 1 MUST be a contrarian hook. Scenes 2-4 deliver hard data or facts.',
        ].join('\n'),
      };

    case 'instagram-carousel':
      return {
        system: GLOBAL_PERSONA,
        user: [
          baseInstructions,
          '',
          'Return a single raw JSON object with exactly this shape:',
          '{',
          '  "topic": "...",',
          '  "imageSearchKeyword": "...",',
          '  "viralHeadline": "...",',
          '  "slides": [',
          '    { "heading": "...", "bodyText": "..." },',
          '    { "heading": "...", "bodyText": "..." },',
          '    { "heading": "...", "bodyText": "..." },',
          '    { "heading": "...", "bodyText": "..." },',
          '    { "heading": "...", "bodyText": "..." }',
          '  ]',
          '}',
          '',
          'Platform rules:',
          '- slides: exactly 5 objects.',
          '- Slide 1: brutal data-backed hook. heading = provocative statement with specific number. bodyText (2-3 sentences) = raw data.',
          '- Slides 2-4: raw market intelligence with figures, percentages, area names.',
          '- Slide 5: cold institutional verdict. No call-to-action.',
        ].join('\n'),
      };

    case 'linkedin-post':
      return {
        system: GLOBAL_PERSONA,
        user: [
          baseInstructions,
          '',
          'Return a single raw JSON object with exactly this shape:',
          '{',
          '  "topic": "...",',
          '  "imageSearchKeyword": "...",',
          '  "viralHeadline": "...",',
          '  "postBody": "..."',
          '}',
          '',
          'Platform rules:',
          '- postBody: 200-300 words. Broetry format: 1-2 sentences per paragraph, \\n\\n between paragraphs.',
          '- First line: attack a generic widely-held market belief. Blunt and contrarian.',
          '- Middle: 3-point list of hard data facts prefixed with "- ".',
          '- End: single cold declarative institutional sentence. Not a question. Not a CTA.',
        ].join('\n'),
      };

    case 'twitter-thread':
      return {
        system: GLOBAL_PERSONA,
        user: [
          baseInstructions,
          '',
          'Return a single raw JSON object with exactly this shape:',
          '{',
          '  "topic": "...",',
          '  "imageSearchKeyword": "...",',
          '  "viralHeadline": "...",',
          '  "tweets": [',
          '    { "text": "..." },',
          '    { "text": "..." },',
          '    { "text": "..." },',
          '    { "text": "..." }',
          '  ]',
          '}',
          '',
          'Platform rules:',
          '- tweets: exactly 4 objects, each under 280 characters.',
          '- Tweet 1 (Hook): contrarian statement with a specific data point.',
          '- Tweet 2-3 (Data): hard facts with numbers, percentages, area names.',
          '- Tweet 4 (Conclusion): cold institutional verdict.',
        ].join('\n'),
      };
  }
}

export async function generateInboundContent(
  platform: Platform,
  recentTopics: string[],
  headlines: string[],
): Promise<ContentPayload> {
  const anthropic = getClient();
  const { system, user } = buildPrompt(platform, recentTopics, headlines);

  console.log(`[contentGenerator] Generating autonomous content for platform: ${platform}`);

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2500,
    temperature: 0.7,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const block = message.content[0];
  const raw = block.type === 'text' ? block.text.trim() : null;

  if (!raw) throw new Error('[contentGenerator] Empty response from Claude API');

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const parsed = JSON.parse(cleaned) as ContentPayload;
    console.log(`[contentGenerator] Done. Topic chosen: "${parsed.topic}"`);
    return parsed;
  } catch (parseErr) {
    console.error('[contentGenerator] JSON parse failed. Raw response:', raw);
    throw new Error(`[contentGenerator] Failed to parse Claude response as JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
  }
}
