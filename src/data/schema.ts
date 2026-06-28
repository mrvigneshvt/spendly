export const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS categories (
     id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, is_default INTEGER NOT NULL DEFAULT 0);`,
  `CREATE TABLE IF NOT EXISTS subcategories (
     id TEXT PRIMARY KEY, category_id TEXT NOT NULL, name TEXT NOT NULL,
     is_default INTEGER NOT NULL DEFAULT 0,
     FOREIGN KEY(category_id) REFERENCES categories(id));`,
  `CREATE TABLE IF NOT EXISTS transactions (
     id TEXT PRIMARY KEY, amount INTEGER NOT NULL, type TEXT NOT NULL,
     date INTEGER NOT NULL, category_id TEXT, subcategory_id TEXT,
     note TEXT, payee TEXT, source TEXT,
     status TEXT NOT NULL, origin TEXT NOT NULL,
     raw_sms_body TEXT, raw_sms_sender TEXT, dedupe_hash TEXT,
     created_at INTEGER NOT NULL);`,
  `CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);`,
  `CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_tx_dedupe ON transactions(dedupe_hash) WHERE dedupe_hash IS NOT NULL;`,
  `CREATE TABLE IF NOT EXISTS parse_rules (
     id TEXT PRIMARY KEY, sender_pattern TEXT NOT NULL, body_regex TEXT NOT NULL,
     type_hint TEXT, is_built_in INTEGER NOT NULL DEFAULT 0,
     confidence_weight REAL NOT NULL DEFAULT 1);`,
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);`,
];
