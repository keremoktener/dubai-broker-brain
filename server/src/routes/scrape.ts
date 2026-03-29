import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { scrapePropertyUrl } from '../services/propertyScraper.js';

const router = Router();

router.post(
  '/scrape-property',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const { url } = req.body as { url?: unknown };

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url is required' });
      return;
    }

    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: 'Invalid URL' });
      return;
    }

    try {
      const result = await scrapePropertyUrl(url);
      res.json(result);
    } catch (err) {
      res
        .status(500)
        .json({
          error: 'Scrape failed',
          detail: err instanceof Error ? err.message : String(err),
        });
    }
  }
);

export default router;
