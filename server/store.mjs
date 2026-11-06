import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openStore(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS grants (
      email TEXT PRIMARY KEY, active INTEGER NOT NULL, destinations TEXT NOT NULL,
      subject TEXT, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL
    );`);
  return {
    list: () => db.prepare('SELECT * FROM grants ORDER BY email').all().map(decode),
    get: (email) => decode(db.prepare('SELECT * FROM grants WHERE email=?').get(email)),
    save(email, active, destinations, actor) {
      db.prepare(`INSERT INTO grants VALUES (?, ?, ?, NULL, ?, ?)
        ON CONFLICT(email) DO UPDATE SET active=excluded.active, destinations=excluded.destinations,
        updated_at=excluded.updated_at, updated_by=excluded.updated_by`)
        .run(email, active ? 1 : 0, JSON.stringify(destinations), new Date().toISOString(), actor);
    },
    bind(email, subject) {
      db.prepare('UPDATE grants SET subject=? WHERE email=? AND subject IS NULL').run(subject, email);
    },
    close: () => db.close(),
  };
}
function decode(row) {
  return row ? { ...row, active: Boolean(row.active), destinations: JSON.parse(row.destinations) } : null;
}
