import { getDb } from '../db/database.js';

interface HistoryRow {
  id: number;
  platform: string;
  topic: string;
  created_at: string;
}

export function getRecentTopics(limit = 25): string[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT topic FROM content_history ORDER BY created_at DESC LIMIT ?'
  ).all(limit) as HistoryRow[];
  return rows.map((r) => r.topic);
}

export function saveContentHistory(platform: string, topic: string): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO content_history (platform, topic) VALUES (?, ?)'
  ).run(platform, topic);
}
