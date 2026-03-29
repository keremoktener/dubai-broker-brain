/**
 * Clears news_articles and ai_summaries tables, then triggers a fresh fetch.
 * Usage: npm run refresh-news
 *        OR: tsx scripts/refreshNews.ts
 */
import 'dotenv/config';
import { getDb } from '../src/db/database.js';
import { fetchAndStoreNews } from '../src/services/newsFetcher.js';

const db = getDb();

const { changes: deletedArticles } = db.prepare('DELETE FROM news_articles').run();
const { changes: deletedSummaries } = db.prepare('DELETE FROM ai_summaries').run();
console.log(`[refresh] Cleared ${deletedArticles} articles and ${deletedSummaries} AI summaries.`);

console.log('[refresh] Starting fresh fetch...\n');
await fetchAndStoreNews();

const { n: articleCount } = db.prepare('SELECT COUNT(*) as n FROM news_articles').get() as { n: number };
const { n: summaryCount } = db.prepare('SELECT COUNT(*) as n FROM ai_summaries').get() as { n: number };
console.log(`\n[refresh] Complete. DB now has ${articleCount} articles and ${summaryCount} AI summary.`);
