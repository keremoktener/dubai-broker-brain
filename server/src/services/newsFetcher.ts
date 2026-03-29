import Parser from 'rss-parser';
import { getDb } from '../db/database.js';
import { generateMarketSummary } from './aiSummarizer.js';
import type { AiSummaryPayload } from './aiSummarizer.js';

const parser = new Parser({ timeout: 15000 });

// All major UAE news sites (Gulf News, Arabian Business, Zawya, Khaleej Times,
// Construction Week, The National) block automated RSS fetching via Cloudflare.
// Google News RSS aggregates articles from ALL of those sources and is reliably
// accessible server-side. Each query below is scoped to Dubai/UAE real estate.
const RSS_FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=%22Dubai%22+%22property%22+%22real+estate%22&hl=en-US&gl=AE&ceid=AE:en',
    label: 'Dubai Property & Real Estate',
  },
  {
    url: 'https://news.google.com/rss/search?q=Emaar+OR+Damac+OR+Nakheel+OR+Aldar+real+estate&hl=en-US&gl=AE&ceid=AE:en',
    label: 'UAE Major Developers',
  },
  {
    url: 'https://news.google.com/rss/search?q=%22DLD%22+OR+%22Dubai+Land+Department%22+OR+%22RERA%22+property&hl=en-US&gl=AE&ceid=AE:en',
    label: 'DLD & RERA Regulations',
  },
  {
    url: 'https://news.google.com/rss/search?q=%22off-plan%22+Dubai+OR+%22Dubai+apartment%22+OR+%22Dubai+villa%22&hl=en-US&gl=AE&ceid=AE:en',
    label: 'Dubai Off-Plan & Listings',
  },
];

// Tier 1: article must mention a UAE location
const UAE_LOCATIONS = [
  'dubai', 'uae', 'united arab emirates', 'abu dhabi', 'sharjah',
  'ras al khaimah', 'ajman', 'fujairah',
];

// Tier 2: article must discuss real estate specifically
const PROPERTY_TERMS = [
  'property', 'real estate', 'apartment', 'villa', 'off-plan', 'off plan',
  'mortgage', 'rent', 'rental', 'landlord', 'tenant', 'sqft', 'handover',
  'developer', 'residential', 'commercial', 'freehold',
];

// Bypass — known UAE real estate entities are inherently location + sector specific
const UAE_ENTITIES = [
  'emaar', 'damac', 'nakheel', 'aldar', 'meraas', 'sobha', 'ellington',
  'azizi', 'binghatti', 'deyaar', 'dld', 'dubai land department', 'rera',
  'omniyat', 'select group', 'dubai creek harbour', 'palm jumeirah',
  'downtown dubai', 'dubai hills', 'business bay', 'difc',
];

function isRelevant(title: string, snippet: string): boolean {
  const text = `${title} ${snippet}`.toLowerCase();

  // Fast-pass: article is about a known UAE real estate entity
  if (UAE_ENTITIES.some((e) => text.includes(e))) return true;

  // Otherwise require UAE location + property topic
  const hasLocation = UAE_LOCATIONS.some((l) => text.includes(l));
  const hasProperty = PROPERTY_TERMS.some((p) => text.includes(p));
  return hasLocation && hasProperty;
}

// Google News titles follow "Article Headline - Publisher Name"
function parseTitle(raw: string): { title: string; publisher: string } {
  const sep = raw.lastIndexOf(' - ');
  if (sep !== -1) {
    return { title: raw.slice(0, sep).trim(), publisher: raw.slice(sep + 3).trim() };
  }
  return { title: raw, publisher: 'Google News' };
}

export async function fetchAndStoreNews(): Promise<void> {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO news_articles (guid, title, summary, link, source, published_at)
    VALUES (@guid, @title, @summary, @link, @source, @published_at)
  `);

  let totalFetched = 0;
  let totalInserted = 0;
  let totalFiltered = 0;

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`[newsFetcher] Fetching "${feed.label}"`);
      const result = await parser.parseURL(feed.url);
      totalFetched += result.items.length;

      for (const item of result.items) {
        const guid = item.guid ?? item.link ?? item.title ?? '';
        if (!guid) continue;

        const rawTitle = item.title ?? '';
        const snippet = item.contentSnippet ?? item.content ?? '';

        if (!isRelevant(rawTitle, snippet)) {
          totalFiltered++;
          continue;
        }

        const { title, publisher } = parseTitle(rawTitle);

        const { changes } = insert.run({
          guid,
          title,
          summary: snippet.slice(0, 500) || null,
          link: item.link ?? '',
          source: publisher,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        });
        totalInserted += changes;
      }

      console.log(`[newsFetcher] ✓ "${feed.label}": ${result.items.length} fetched`);
    } catch (err) {
      const detail = err instanceof Error
        ? `${err.message}${(err as NodeJS.ErrnoException).code ? ` (${(err as NodeJS.ErrnoException).code})` : ''}`
        : String(err);
      console.error(`[newsFetcher] ✗ "${feed.label}": ${detail}`);
    }
  }

  console.log(`[newsFetcher] Done. ${totalFetched} fetched → ${totalFiltered} filtered out → ${totalInserted} new saved.`);

  if (totalInserted > 0) {
    const rows = db.prepare(
      'SELECT title FROM news_articles ORDER BY published_at DESC, fetched_at DESC LIMIT 20'
    ).all() as { title: string }[];

    const summary: AiSummaryPayload | null = await generateMarketSummary(rows.map((r) => r.title));
    if (summary) {
      db.prepare(
        'INSERT INTO ai_summaries (summary, article_count) VALUES (?, ?)'
      ).run(JSON.stringify(summary), rows.length);
      console.log('[newsFetcher] AI Market Intelligence Summary stored.');
    }
  }
}
