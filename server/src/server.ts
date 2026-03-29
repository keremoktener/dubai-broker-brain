import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import authRouter from './routes/auth.js';
import marketRouter from './routes/market.js';
import newsRouter from './routes/news.js';
import sparringRouter from './routes/sparring.js';
import crmRouter from './routes/crm.js';
import roiRouter from './routes/roi.js';
import deckRouter from './routes/deck.js';
import scrapeRouter from './routes/scrape.js';
import contentRouter from './routes/content.js';
import { getDb } from './db/database.js';
import { fetchAndStoreNews } from './services/newsFetcher.js';

// Initialize DB on startup
getDb();

// Fetch news immediately on startup, then every 4 hours
fetchAndStoreNews().catch((err) => console.error('[newsFetcher] Initial fetch failed:', err));
cron.schedule('0 */4 * * *', () => {
  fetchAndStoreNews().catch((err) => console.error('[newsFetcher] Scheduled fetch failed:', err));
});

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dubai-broker-brain-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/market', marketRouter);
app.use('/api/news', newsRouter);
app.use('/api/sparring', sparringRouter);
app.use('/api/crm', crmRouter);
app.use('/api', roiRouter);
app.use('/api', deckRouter);
app.use('/api', scrapeRouter);
app.use('/api', contentRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Dubai Broker Brain API running on http://localhost:${PORT}`);
});

export default app;
