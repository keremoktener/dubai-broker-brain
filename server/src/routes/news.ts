import { Router } from 'express';
import type { Response } from 'express';
import { getDb } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { AiSummaryPayload } from '../services/aiSummarizer.js';

const router = Router();

router.use(authenticateToken);

router.get('/summary', (_req: AuthRequest, res: Response): void => {
  const db = getDb();
  const row = db.prepare(
    'SELECT id, summary, article_count, generated_at FROM ai_summaries ORDER BY generated_at DESC LIMIT 1'
  ).get() as { id: number; summary: string; article_count: number; generated_at: string } | undefined;

  if (!row) {
    res.json(null);
    return;
  }

  try {
    const payload = JSON.parse(row.summary) as AiSummaryPayload;
    res.json({
      id: row.id,
      article_count: row.article_count,
      generated_at: row.generated_at,
      payload,
    });
  } catch {
    console.error('[news/summary] Failed to parse stored summary JSON');
    res.json(null);
  }
});

router.get('/', (_req: AuthRequest, res: Response): void => {
  const db = getDb();
  const articles = db.prepare(`
    SELECT id, title, summary, link, source, published_at, fetched_at
    FROM news_articles
    ORDER BY published_at DESC, fetched_at DESC
    LIMIT 50
  `).all();
  res.json(articles);
});

export default router;
