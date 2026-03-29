import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { getDb } from '../db/database.js';
import bcrypt from 'bcryptjs';

beforeAll(async () => {
  const db = getDb();
  const hash = await bcrypt.hash('dubai2024!', 12);
  db.prepare(`INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`)
    .run('admin@dubaibrokerbrain.com', hash, 'Admin User', 'admin');
});

describe('POST /api/auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'somepass' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notreal@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dubaibrokerbrain.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with token and user for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dubaibrokerbrain.com', password: 'dubai2024!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'admin@dubaibrokerbrain.com', role: 'admin' });
  });
});

describe('Protected Routes — 401 without token', () => {
  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/market/summary returns 401 without token', async () => {
    const res = await request(app).get('/api/market/summary');
    expect(res.status).toBe(401);
  });

  it('GET /api/market/leads returns 401 without token', async () => {
    const res = await request(app).get('/api/market/leads');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });

  it('returns 200 on /api/auth/me with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dubaibrokerbrain.com', password: 'dubai2024!' });
    const { token } = loginRes.body as { token: string };

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin@dubaibrokerbrain.com');
  });
});
