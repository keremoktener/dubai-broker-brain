import { Router } from 'express';
import type { Response } from 'express';
import { getDb } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/summary', (_req: AuthRequest, res: Response): void => {
  const db = getDb();

  const areaBreakdown = db.prepare(`
    SELECT area,
           AVG(price_per_sqft) as avg_price_sqft,
           SUM(transactions) as total_transactions,
           SUM(volume) as total_volume
    FROM market_data
    WHERE date >= date('now', '-7 days')
    GROUP BY area
    ORDER BY total_volume DESC
  `).all();

  const dailyTotals = db.prepare(`
    SELECT date,
           SUM(transactions) as total_transactions,
           AVG(price_per_sqft) as avg_price_sqft,
           SUM(volume) as total_volume
    FROM market_data
    WHERE date >= date('now', '-30 days')
    GROUP BY date
    ORDER BY date ASC
  `).all();

  res.json({ areaBreakdown, dailyTotals });
});

router.get('/leads', (_req: AuthRequest, res: Response): void => {
  const db = getDb();
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json(leads);
});

export default router;
