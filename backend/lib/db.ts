import { Database } from 'tjs:sqlite'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  doc TEXT NOT NULL DEFAULT '',
  markdown TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  kept_until INTEGER,
  archived_at INTEGER
);
CREATE INDEX IF NOT EXISTS notes_updated ON notes(updated_at);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(title, markdown, content='notes', content_rowid='rowid');
CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, markdown) VALUES (new.rowid, new.title, new.markdown);
END;
CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, markdown) VALUES ('delete', old.rowid, old.title, old.markdown);
END;
CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE OF title, markdown ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, markdown) VALUES ('delete', old.rowid, old.title, old.markdown);
  INSERT INTO notes_fts(rowid, title, markdown) VALUES (new.rowid, new.title, new.markdown);
END;
`

/**
 * Opens the notes database, creating the folder and schema if needed.
 * @param dir - Folder holding scratchpad.db.
 * @return The open database.
 */
export async function openDb(dir: string): Promise<Database> {
  await tjs.makeDir(dir, { recursive: true })
  const db = new Database(`${dir}/scratchpad.db`)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec(SCHEMA)
  return db
}

/**
 * Runs a statement once and finalizes it.
 * @param db - The database.
 * @param sql - SQL with ? placeholders.
 * @param params - Values for the placeholders, in order.
 */
export function run(db: Database, sql: string, ...params: unknown[]): void {
  const st = db.prepare(sql)
  try {
    st.run(...params)
  } finally {
    st.finalize()
  }
}

/**
 * Runs a query once and returns every row.
 * @param db - The database.
 * @param sql - SQL with ? placeholders.
 * @param params - Values for the placeholders, in order.
 * @return Every matching row.
 */
export function all<T = Record<string, any>>(db: Database, sql: string, ...params: unknown[]): T[] {
  const st = db.prepare(sql)
  try {
    return st.all(...params) as T[]
  } finally {
    st.finalize()
  }
}
