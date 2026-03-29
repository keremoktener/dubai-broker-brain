import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: string;
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.post('/logout', authenticateToken, (_req: AuthRequest, res: Response): void => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
