import express from 'express';
import axios from 'axios';
import Parser from 'rss-parser';
import { generateInboundContent, Platform } from '../services/contentGenerator.js';
import { getRecentTopics, saveContentHistory } from '../services/contentHistory.js';

const VALID_PLATFORMS: Platform[] = ['faceless-reel', 'instagram-carousel', 'linkedin-post', 'twitter-thread'];

const RSS_FEEDS = [
  'https://gulfnews.com/rss/business',
  'https://www.arabianbusiness.com/rss',
];

async function fetchDubaiHeadlines(): Promise<string[]> {
  const parser = new Parser();
  for (const feed of RSS_FEEDS) {
    try {
      const result = await parser.parseURL(feed);
      const headlines = (result.items ?? [])
        .slice(0, 15)
        .map((item) => item.title ?? '')
        .filter(Boolean);
      if (headlines.length > 0) {
        console.log(`[content route] Fetched ${headlines.length} headlines from ${feed}`);
        return headlines;
      }
    } catch (err) {
      console.warn(`[content route] RSS feed failed (${feed}):`, err instanceof Error ? err.message : String(err));
    }
  }
  console.warn('[content route] All RSS feeds failed — proceeding with no live headlines');
  return [];
}

async function fetchUnsplashImage(keyword: string): Promise<string | null> {
  const apiKey = process.env.UNSPLASH_API_KEY;
  if (!apiKey) {
    console.warn('[content route] UNSPLASH_API_KEY not set — skipping image fetch');
    return null;
  }
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: keyword, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${apiKey}` },
    });
    const url = res.data?.results?.[0]?.urls?.regular ?? null;
    if (url) console.log(`[content route] Unsplash image fetched for keyword: "${keyword}"`);
    return url;
  } catch (err) {
    console.warn('[content route] Unsplash fetch failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

const router = express.Router();

router.post('/generate-content', async (req, res) => {
  const { platform } = req.body;

  if (!platform || !VALID_PLATFORMS.includes(platform as Platform)) {
    res.status(400).json({
      error: `Missing or invalid field: platform (must be one of: ${VALID_PLATFORMS.join(', ')})`,
    });
    return;
  }

  try {
    // 1. Fetch history and live headlines in parallel
    const [recentTopics, headlines] = await Promise.all([
      Promise.resolve(getRecentTopics(25)),
      fetchDubaiHeadlines(),
    ]);

    // 2. Generate content autonomously
    const content = await generateInboundContent(platform as Platform, recentTopics, headlines);

    // 3. Fetch Unsplash image in parallel with saving history
    const [imageUrl] = await Promise.all([
      fetchUnsplashImage(content.imageSearchKeyword),
      Promise.resolve(saveContentHistory(platform, content.topic)),
    ]);

    // 4. Return everything
    res.json({ ...content, imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[content route] Error:', message);
    res.status(500).json({ error: message });
  }
});

export default router;
