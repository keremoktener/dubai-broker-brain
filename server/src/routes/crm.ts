import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { getMockProperties } from '../services/propertyFetcher.js';
import { runAiMatchmaker } from '../services/aiMatchmaker.js';
import type { ClientProfile } from '../services/aiMatchmaker.js';

const router = Router();

interface ClientRow {
  id: number;
  name: string;
  phone: string | null;
  persona_type: string;
  max_budget: number;
  preferred_areas: string;
  property_type: string;
  urgency_level: string;
  created_at: string;
}

// GET /api/crm/clients — list all clients
router.get('/clients', authenticateToken, (_req: AuthRequest, res: Response): void => {
  const db = getDb();
  const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all() as ClientRow[];
  // Parse preferred_areas JSON for each client
  const parsed = clients.map(c => ({
    ...c,
    preferred_areas: (() => { try { return JSON.parse(c.preferred_areas); } catch { return []; } })(),
  }));
  res.json(parsed);
});

// POST /api/crm/clients — add a new client
router.post('/clients', authenticateToken, (req: Request, res: Response): void => {
  const { name, phone, persona_type, max_budget, preferred_areas, property_type, urgency_level } = req.body as {
    name?: string;
    phone?: string;
    persona_type?: string;
    max_budget?: number;
    preferred_areas?: string[];
    property_type?: string;
    urgency_level?: string;
  };

  if (!name || max_budget === undefined) {
    res.status(400).json({ error: 'name and max_budget are required' });
    return;
  }

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO clients (name, phone, persona_type, max_budget, preferred_areas, property_type, urgency_level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    name,
    phone ?? null,
    persona_type ?? 'investor',
    max_budget,
    JSON.stringify(preferred_areas ?? []),
    property_type ?? 'apartment',
    urgency_level ?? 'medium',
  );

  const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid) as ClientRow;
  res.status(201).json({
    ...newClient,
    preferred_areas: (() => { try { return JSON.parse(newClient.preferred_areas); } catch { return []; } })(),
  });
});

// POST /api/crm/match/:clientId — run AI matchmaker for a client
router.post('/match/:clientId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const clientId = parseInt(req.params.clientId, 10);
  const { targetLanguage } = req.body as { targetLanguage?: string };

  if (isNaN(clientId)) {
    res.status(400).json({ error: 'Invalid clientId' });
    return;
  }

  const lang: 'EN' | 'TR' = targetLanguage === 'TR' ? 'TR' : 'EN';

  const db = getDb();
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) as ClientRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  const profile: ClientProfile = {
    name: row.name,
    persona_type: row.persona_type,
    max_budget: row.max_budget,
    preferred_areas: (() => { try { return JSON.parse(row.preferred_areas); } catch { return []; } })(),
    property_type: row.property_type,
    urgency_level: row.urgency_level,
  };

  const properties = getMockProperties();
  const result = await runAiMatchmaker(profile, properties, lang);

  if (!result) {
    res.status(503).json({ error: 'AI matchmaker unavailable — check ANTHROPIC_API_KEY' });
    return;
  }

  const matchedProperty = properties.find(p => p.id === result.propertyId) ?? null;
  res.json({ ...result, property: matchedProperty });
});

export default router;
