import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'edumentor.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize schema
export function initSchema() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

// Database helper functions
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as T[];
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return {
    lastInsertRowid: Number(result.lastInsertRowid),
    changes: Number(result.changes),
  };
}

export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN TRANSACTION;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
