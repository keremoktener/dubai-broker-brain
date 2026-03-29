import { getDb } from '../db/database.js';

interface HistoryRow {
  id: number;
  platform: string;
  topic: string;
  category: string;
  created_at: string;
}

interface HistoryRecord {
  id: number;
  platform: string;
  topic: string;
  category: string;
  created_at: string;
}

export function getRecentTopics(limit = 25): string[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT topic FROM content_history ORDER BY created_at DESC LIMIT ?'
  ).all(limit) as HistoryRow[];
  return rows.map((r) => r.topic);
}

export function saveContentHistory(platform: string, topic: string, category: string = ''): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO content_history (platform, topic, category) VALUES (?, ?, ?)'
  ).run(platform, topic, category);
}

export function getAllHistory(limit = 100): HistoryRecord[] {
  const db = getDb();
  return db.prepare(
    'SELECT id, platform, topic, category, created_at FROM content_history ORDER BY created_at DESC LIMIT ?'
  ).all(limit) as HistoryRecord[];
}
