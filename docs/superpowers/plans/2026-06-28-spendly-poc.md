# Spendly POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Android-only, fully-offline React Native budget tracker that ingests bank-SMS + manual entries into a reviewed, categorized ledger and renders a rich drill-down dashboard.

**Architecture:** Layered, with pure-logic cores isolated from platform concerns. A native `BroadcastReceiver` + `react-native-get-sms-android` feed raw SMS into a pure `parser/` rule registry; a SQLite `data/` repository layer is the single seam for future cloud sync; React Navigation `features/*` screens consume repositories via lightweight Zustand stores. The parser and data layers are unit-tested in pure JS (Jest) with no device dependency; UI uses React Native Testing Library.

**Tech Stack:** React Native (bare CLI, Android), TypeScript, `op-sqlite`, `react-native-get-sms-android` + native Java `BroadcastReceiver` (headless JS), React Navigation, `react-native-gifted-charts`, Zustand, Jest + React Native Testing Library.

## Global Constraints

- Platform: **Android only**. No iOS targets, no iOS-conditional code paths required.
- Storage: **100% on-device**. No network calls, no auth, no remote endpoints anywhere in the POC.
- Language: **TypeScript** throughout (`strict: true`).
- Currency: single-currency **INR (₹)**; amounts stored as integer **paise** (avoid float drift) — store `amount` as integer paise, display divided by 100.
- Category + subcategory are a **hard gate**: a transaction cannot reach `confirmed` status without both set.
- Data layer is the **only** module allowed to import the SQLite driver. Parser and SMS layers must stay driver-free and DB-free.
- Every parser and repository function must be **pure-unit-testable in Jest** without a device/emulator.
- TDD: write the failing test first, watch it fail, implement minimally, watch it pass, commit. Frequent commits.

---

## File Structure

```
src/
  data/
    db.ts                 # op-sqlite connection + migration runner (ONLY file importing the driver)
    schema.ts             # SQL DDL + migration list
    seed.ts               # default categories/subcategories seed data
    types.ts              # Transaction, Category, Subcategory, ParseRule, DraftTransaction TS types
    transactionsRepo.ts   # CRUD + dedupe + aggregation queries
    categoriesRepo.ts     # CRUD for categories/subcategories
    parseRulesRepo.ts     # CRUD for user/built-in parse rules
  parser/
    types.ts              # ParseResult, RawSms types
    amount.ts             # amount + currency extraction
    classify.ts           # credit/debit classification
    payee.ts              # merchant/payee extraction
    builtinRules.ts       # India-tuned rule definitions (data, not logic)
    ruleEngine.ts         # ordered registry runner + confidence scoring
    index.ts              # parseSms(raw, userRules) public entrypoint
  sms/
    permissions.ts        # READ_SMS / RECEIVE_SMS request + status
    inbox.ts              # backfill: read inbox via react-native-get-sms-android
    liveBridge.ts         # JS side of the native receiver event + headless task
  features/
    pending/
      pendingStore.ts     # Zustand store over transactionsRepo (status='pending')
      PendingScreen.tsx
      ConfirmSheet.tsx     # enforces category gate
    ledger/
      LedgerScreen.tsx
      ManualEntryScreen.tsx
      TransactionForm.tsx  # shared by manual entry + confirm
    dashboard/
      aggregations.ts      # pure period/category aggregation over rows (testable)
      DashboardScreen.tsx
      CategoryDrillScreen.tsx
    categories/
      CategoriesScreen.tsx
  navigation/
    RootNavigator.tsx
  app/
    App.tsx
    bootstrap.ts           # first-launch: migrate + seed + backfill orchestration
android/
  app/src/main/java/com/spendly/sms/
    SmsReceiver.java        # BroadcastReceiver for RECEIVE_SMS
    SmsHeadlessTask.java    # headless JS launcher
    SmsModule.java          # (optional) emits to JS event emitter
    SmsPackage.java
__tests__/                  # mirrors src/ for parser, data aggregations, stores
```

---

## PHASE 0 — Project scaffolding & tooling

### Task 0.1: Initialize bare RN TypeScript project

**Files:**
- Create: project root (`package.json`, `tsconfig.json`, `babel.config.js`, `android/`)
- Create: `jest.config.js`, `.eslintrc.js`

**Interfaces:**
- Produces: a runnable `npx react-native run-android` shell app; `npm test` runs Jest.

- [ ] **Step 1: Scaffold the project**

```bash
npx @react-native-community/cli@latest init Spendly --version latest --directory . --skip-install || \
npx react-native init Spendly --template react-native-template-typescript
npm install
```

- [ ] **Step 2: Pin TypeScript strict mode**

Edit `tsconfig.json` to extend RN config and set:

```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "./",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 3: Add a smoke test**

```ts
// __tests__/smoke.test.ts
test('jest runs', () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 4: Run it**

Run: `npm test -- smoke`
Expected: PASS, 1 test.

- [ ] **Step 5: Verify Android build runs**

Run: `npx react-native run-android` (emulator/device attached)
Expected: default app screen renders.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold bare RN TypeScript project"
```

### Task 0.2: Install runtime dependencies

**Files:**
- Modify: `package.json`
- Modify: `android/app/src/main/AndroidManifest.xml`

**Interfaces:**
- Produces: installed `op-sqlite`, `react-native-get-sms-android`, navigation, charts, zustand; SMS permissions declared.

- [ ] **Step 1: Install libs**

```bash
npm install @op-engineering/op-sqlite react-native-get-sms-android \
  @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context \
  react-native-gifted-charts react-native-linear-gradient react-native-svg \
  zustand
```

- [ ] **Step 2: Declare permissions** in `AndroidManifest.xml` (inside `<manifest>`, above `<application>`):

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

- [ ] **Step 3: Add dev-time deps for testing**

```bash
npm install -D @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 4: Verify build still compiles**

Run: `npx react-native run-android`
Expected: app still launches (no crash from native linking).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: add runtime + test dependencies, declare SMS permissions"
```

---

## PHASE 1 — Data layer (SQLite schema, repositories, seed)

### Task 1.1: Define shared TypeScript types

**Files:**
- Create: `src/data/types.ts`
- Test: `__tests__/data/types.test.ts` (type-level sanity)

**Interfaces:**
- Produces: `TxType`, `TxStatus`, `TxOrigin`, `Transaction`, `DraftTransaction`, `Category`, `Subcategory`, `ParseRule`.

- [ ] **Step 1: Write the types**

```ts
// src/data/types.ts
export type TxType = 'credit' | 'debit';
export type TxStatus = 'pending' | 'confirmed';
export type TxOrigin = 'sms' | 'manual';

export interface Transaction {
  id: string;
  amount: number;          // integer paise
  type: TxType;
  date: number;            // epoch ms
  categoryId: string | null;
  subcategoryId: string | null;
  note: string | null;
  payee: string | null;
  source: string | null;   // sms sender / account label
  status: TxStatus;
  origin: TxOrigin;
  rawSmsBody: string | null;
  rawSmsSender: string | null;
  dedupeHash: string | null;
  createdAt: number;
}

export type DraftTransaction = Omit<Transaction, 'id' | 'createdAt'>;

export interface Category { id: string; name: string; icon: string | null; isDefault: boolean; }
export interface Subcategory { id: string; categoryId: string; name: string; isDefault: boolean; }
export interface ParseRule {
  id: string;
  senderPattern: string;   // regex source string
  bodyRegex: string;       // regex source string
  typeHint: TxType | null;
  isBuiltIn: boolean;
  confidenceWeight: number;
}
```

- [ ] **Step 2: Add a compile-time usage test**

```ts
// __tests__/data/types.test.ts
import type { Transaction } from '@/data/types';
test('Transaction shape compiles', () => {
  const t: Transaction = {
    id: '1', amount: 100, type: 'debit', date: 0, categoryId: null,
    subcategoryId: null, note: null, payee: null, source: null,
    status: 'pending', origin: 'sms', rawSmsBody: null, rawSmsSender: null,
    dedupeHash: null, createdAt: 0,
  };
  expect(t.amount).toBe(100);
});
```

- [ ] **Step 3: Run**

Run: `npm test -- types`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(data): add shared domain types"
```

### Task 1.2: Schema + migration runner

**Files:**
- Create: `src/data/schema.ts`, `src/data/db.ts`
- Test: `__tests__/data/db.test.ts`

**Interfaces:**
- Consumes: `op-sqlite`.
- Produces: `getDb()`, `runMigrations(db)`, exported `MIGRATIONS: string[]`. `db.ts` is the ONLY driver-importing file.

- [ ] **Step 1: Write schema DDL**

```ts
// src/data/schema.ts
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
```

- [ ] **Step 2: Write the connection + migration runner**

```ts
// src/data/db.ts
import { open, type DB } from '@op-engineering/op-sqlite';
import { MIGRATIONS } from './schema';

let _db: DB | null = null;

export function getDb(): DB {
  if (!_db) _db = open({ name: 'spendly.sqlite' });
  return _db;
}

export function runMigrations(db: DB = getDb()): void {
  for (const sql of MIGRATIONS) db.execute(sql);
}

// test seam: allow injecting an in-memory DB
export function _setDbForTests(db: DB | null): void { _db = db; }
```

- [ ] **Step 3: Write the test (mock the driver)**

```ts
// __tests__/data/db.test.ts
import { MIGRATIONS } from '@/data/schema';

test('migrations are non-empty valid-looking DDL', () => {
  expect(MIGRATIONS.length).toBeGreaterThan(0);
  expect(MIGRATIONS[0]).toMatch(/CREATE TABLE/i);
  // dedupe uniqueness must exist
  expect(MIGRATIONS.some(m => /UNIQUE INDEX.*dedupe_hash/i.test(m))).toBe(true);
});
```

- [ ] **Step 4: Run**

Run: `npm test -- db`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(data): sqlite schema + migration runner"
```

### Task 1.3: Default seed data + categories repo

**Files:**
- Create: `src/data/seed.ts`, `src/data/categoriesRepo.ts`
- Test: `__tests__/data/seed.test.ts`, `__tests__/data/categoriesRepo.test.ts`

**Interfaces:**
- Produces: `DEFAULT_CATEGORIES: {name, icon, subs: string[]}[]`, `seedDefaults(db)`, and `categoriesRepo` with `listCategories()`, `listSubcategories(categoryId)`, `addCategory(name,icon?)`, `addSubcategory(categoryId,name)`, `renameCategory(id,name)`, `deleteCategory(id)` (guarded), `isCategoryInUse(id)`.

- [ ] **Step 1: Seed data (from spec §8)**

```ts
// src/data/seed.ts
export const DEFAULT_CATEGORIES: { name: string; icon: string; subs: string[] }[] = [
  { name: 'Food & Dining', icon: '🍽️', subs: ['Groceries', 'Dining Out', 'Food Delivery', 'Tea/Coffee'] },
  { name: 'Transport', icon: '🚕', subs: ['Fuel', 'Cab/Auto', 'Public Transit', 'Parking'] },
  { name: 'Bills & Utilities', icon: '💡', subs: ['Electricity', 'Water', 'Mobile/DTH', 'Internet', 'Gas'] },
  { name: 'Shopping', icon: '🛍️', subs: ['Clothing', 'Electronics', 'Household', 'Online'] },
  { name: 'Health', icon: '🩺', subs: ['Pharmacy', 'Doctor', 'Insurance', 'Fitness'] },
  { name: 'Entertainment', icon: '🎬', subs: ['Streaming', 'Movies', 'Games', 'Events'] },
  { name: 'Housing', icon: '🏠', subs: ['Rent', 'Maintenance', 'Repairs'] },
  { name: 'Education', icon: '📚', subs: ['Fees', 'Courses', 'Books'] },
  { name: 'Personal Care', icon: '💇', subs: ['Salon', 'Grooming'] },
  { name: 'Income', icon: '💰', subs: ['Salary', 'Business', 'Interest', 'Refund'] },
  { name: 'Transfers', icon: '🔁', subs: ['UPI Transfer', 'Bank Transfer', 'Wallet', 'ATM Cash'] },
  { name: 'Investments', icon: '📈', subs: ['Mutual Funds', 'Stocks', 'SIP', 'Gold'] },
  { name: 'Miscellaneous', icon: '🗂️', subs: ['Other'] },
];
```

- [ ] **Step 2: Test the seed shape**

```ts
// __tests__/data/seed.test.ts
import { DEFAULT_CATEGORIES } from '@/data/seed';
test('seed has 13 categories, all with >=1 sub', () => {
  expect(DEFAULT_CATEGORIES).toHaveLength(13);
  for (const c of DEFAULT_CATEGORIES) expect(c.subs.length).toBeGreaterThan(0);
});
test('Income category exists for credit defaults', () => {
  expect(DEFAULT_CATEGORIES.find(c => c.name === 'Income')).toBeTruthy();
});
```

- [ ] **Step 3: Run**

Run: `npm test -- seed`
Expected: PASS.

- [ ] **Step 4: Implement `categoriesRepo` + `seedDefaults`** (uses `getDb()` execute; ids via `id()` helper below). Add a small id util `src/data/id.ts`:

```ts
// src/data/id.ts  (deterministic-friendly: counter + prefix; device-unique enough for POC)
let n = 0;
export const id = (p = 'x') => `${p}_${Date.now().toString(36)}_${(n++).toString(36)}`;
```

```ts
// src/data/categoriesRepo.ts
import { getDb } from './db';
import { id } from './id';
import { DEFAULT_CATEGORIES } from './seed';
import type { Category, Subcategory } from './types';

export function seedDefaults(db = getDb()): void {
  const existing = db.execute('SELECT COUNT(*) c FROM categories').rows?._array?.[0]?.c ?? 0;
  if (existing > 0) return;
  for (const c of DEFAULT_CATEGORIES) {
    const cid = id('cat');
    db.execute('INSERT INTO categories (id,name,icon,is_default) VALUES (?,?,?,1)', [cid, c.name, c.icon]);
    for (const s of c.subs)
      db.execute('INSERT INTO subcategories (id,category_id,name,is_default) VALUES (?,?,?,1)', [id('sub'), cid, s]);
  }
}

export const categoriesRepo = {
  listCategories(db = getDb()): Category[] {
    return (db.execute('SELECT id,name,icon,is_default FROM categories ORDER BY name').rows?._array ?? [])
      .map((r: any) => ({ id: r.id, name: r.name, icon: r.icon, isDefault: !!r.is_default }));
  },
  listSubcategories(categoryId: string, db = getDb()): Subcategory[] {
    return (db.execute('SELECT id,category_id,name,is_default FROM subcategories WHERE category_id=? ORDER BY name', [categoryId]).rows?._array ?? [])
      .map((r: any) => ({ id: r.id, categoryId: r.category_id, name: r.name, isDefault: !!r.is_default }));
  },
  addCategory(name: string, icon = '🗂️', db = getDb()): string {
    const cid = id('cat'); db.execute('INSERT INTO categories (id,name,icon,is_default) VALUES (?,?,?,0)', [cid, name, icon]); return cid;
  },
  addSubcategory(categoryId: string, name: string, db = getDb()): string {
    const sid = id('sub'); db.execute('INSERT INTO subcategories (id,category_id,name,is_default) VALUES (?,?,?,0)', [sid, categoryId, name]); return sid;
  },
  renameCategory(id: string, name: string, db = getDb()): void { db.execute('UPDATE categories SET name=? WHERE id=?', [name, id]); },
  isCategoryInUse(id: string, db = getDb()): boolean {
    return ((db.execute('SELECT COUNT(*) c FROM transactions WHERE category_id=?', [id]).rows?._array?.[0]?.c ?? 0) > 0);
  },
  deleteCategory(id: string, db = getDb()): void {
    if (categoriesRepo.isCategoryInUse(id, db)) throw new Error('Category in use; reassign transactions first');
    db.execute('DELETE FROM subcategories WHERE category_id=?', [id]);
    db.execute('DELETE FROM categories WHERE id=?', [id]);
  },
};
```

- [ ] **Step 5: Test repo against an in-memory op-sqlite db** (open `{ name: ':memory:' }`, run migrations, seed, assert counts; guarded-delete throws when in use). Run: `npm test -- categoriesRepo` → PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(data): seed defaults + categories repo with guarded delete"
```

### Task 1.4: Transactions repo (CRUD + dedupe + aggregation)

**Files:**
- Create: `src/data/transactionsRepo.ts`
- Test: `__tests__/data/transactionsRepo.test.ts`

**Interfaces:**
- Consumes: `getDb`, `id`, types.
- Produces: `transactionsRepo` with `insertDraft(d: DraftTransaction): string`, `confirm(id, {categoryId, subcategoryId, note?, payee?}): void` (throws if category/subcategory missing), `listByStatus(status): Transaction[]`, `update(id, patch): void`, `remove(id): void`, `existsByHash(hash): boolean`, `sumByType(from,to): {credit,debit}`, `breakdownByCategory(from,to,type): {categoryId,total}[]`, `listInRange(from,to,filter?): Transaction[]`.

- [ ] **Step 1: Write failing tests first**

```ts
// __tests__/data/transactionsRepo.test.ts
import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { transactionsRepo as repo } from '@/data/transactionsRepo';

const draft = (over = {}) => ({
  amount: 5000, type: 'debit', date: 1719500000000, categoryId: null, subcategoryId: null,
  note: null, payee: 'SWIGGY', source: 'HDFCBK', status: 'pending', origin: 'sms',
  rawSmsBody: 'debited 50.00', rawSmsSender: 'HDFCBK', dedupeHash: 'h1', ...over,
});

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('confirm requires category + subcategory', () => {
  const tid = repo.insertDraft(draft() as any);
  expect(() => repo.confirm(tid, { categoryId: '', subcategoryId: '' } as any)).toThrow();
});

test('confirm moves status to confirmed', () => {
  const tid = repo.insertDraft(draft() as any);
  repo.confirm(tid, { categoryId: 'c1', subcategoryId: 's1' });
  expect(repo.listByStatus('confirmed')).toHaveLength(1);
  expect(repo.listByStatus('pending')).toHaveLength(0);
});

test('dedupe: existsByHash detects duplicate', () => {
  repo.insertDraft(draft() as any);
  expect(repo.existsByHash('h1')).toBe(true);
  expect(repo.existsByHash('nope')).toBe(false);
});

test('sumByType aggregates confirmed only', () => {
  const a = repo.insertDraft(draft({ dedupeHash: 'a' }) as any);
  repo.confirm(a, { categoryId: 'c1', subcategoryId: 's1' });
  const b = repo.insertDraft(draft({ type: 'credit', amount: 9000, dedupeHash: 'b' }) as any);
  repo.confirm(b, { categoryId: 'c2', subcategoryId: 's2' });
  const s = repo.sumByType(0, 2_000_000_000_000);
  expect(s.debit).toBe(5000);
  expect(s.credit).toBe(9000);
});
```

- [ ] **Step 2: Run, watch fail**

Run: `npm test -- transactionsRepo`
Expected: FAIL ("insertDraft is not a function").

- [ ] **Step 3: Implement**

```ts
// src/data/transactionsRepo.ts
import { getDb } from './db';
import { id } from './id';
import type { DraftTransaction, Transaction, TxType, TxStatus } from './types';

const rowToTx = (r: any): Transaction => ({
  id: r.id, amount: r.amount, type: r.type, date: r.date,
  categoryId: r.category_id, subcategoryId: r.subcategory_id, note: r.note,
  payee: r.payee, source: r.source, status: r.status, origin: r.origin,
  rawSmsBody: r.raw_sms_body, rawSmsSender: r.raw_sms_sender,
  dedupeHash: r.dedupe_hash, createdAt: r.created_at,
});

export const transactionsRepo = {
  insertDraft(d: DraftTransaction, db = getDb()): string {
    const tid = id('tx');
    db.execute(
      `INSERT INTO transactions (id,amount,type,date,category_id,subcategory_id,note,payee,source,status,origin,raw_sms_body,raw_sms_sender,dedupe_hash,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [tid, d.amount, d.type, d.date, d.categoryId, d.subcategoryId, d.note, d.payee, d.source, d.status, d.origin, d.rawSmsBody, d.rawSmsSender, d.dedupeHash, d.date],
    );
    return tid;
  },
  confirm(id: string, p: { categoryId: string; subcategoryId: string; note?: string; payee?: string }, db = getDb()): void {
    if (!p.categoryId || !p.subcategoryId) throw new Error('category and subcategory are required to confirm');
    db.execute('UPDATE transactions SET status=?, category_id=?, subcategory_id=?, note=COALESCE(?,note), payee=COALESCE(?,payee) WHERE id=?',
      ['confirmed', p.categoryId, p.subcategoryId, p.note ?? null, p.payee ?? null, id]);
  },
  listByStatus(status: TxStatus, db = getDb()): Transaction[] {
    return (db.execute('SELECT * FROM transactions WHERE status=? ORDER BY date DESC', [status]).rows?._array ?? []).map(rowToTx);
  },
  existsByHash(hash: string, db = getDb()): boolean {
    return ((db.execute('SELECT COUNT(*) c FROM transactions WHERE dedupe_hash=?', [hash]).rows?._array?.[0]?.c ?? 0) > 0);
  },
  update(id: string, patch: Partial<Transaction>, db = getDb()): void {
    const cols: string[] = []; const vals: any[] = [];
    const map: Record<string, string> = { categoryId: 'category_id', subcategoryId: 'subcategory_id', note: 'note', payee: 'payee', amount: 'amount', type: 'type', date: 'date' };
    for (const [k, col] of Object.entries(map)) if (k in patch) { cols.push(`${col}=?`); vals.push((patch as any)[k]); }
    if (!cols.length) return;
    vals.push(id); db.execute(`UPDATE transactions SET ${cols.join(',')} WHERE id=?`, vals);
  },
  remove(id: string, db = getDb()): void { db.execute('DELETE FROM transactions WHERE id=?', [id]); },
  sumByType(from: number, to: number, db = getDb()): { credit: number; debit: number } {
    const rows = db.execute("SELECT type, SUM(amount) t FROM transactions WHERE status='confirmed' AND date BETWEEN ? AND ? GROUP BY type", [from, to]).rows?._array ?? [];
    const out = { credit: 0, debit: 0 };
    for (const r of rows) (out as any)[r.type] = r.t;
    return out;
  },
  breakdownByCategory(from: number, to: number, type: TxType, db = getDb()): { categoryId: string; total: number }[] {
    return (db.execute("SELECT category_id categoryId, SUM(amount) total FROM transactions WHERE status='confirmed' AND type=? AND date BETWEEN ? AND ? GROUP BY category_id ORDER BY total DESC", [type, from, to]).rows?._array ?? [])
      .map((r: any) => ({ categoryId: r.categoryId, total: r.total }));
  },
  listInRange(from: number, to: number, db = getDb()): Transaction[] {
    return (db.execute("SELECT * FROM transactions WHERE status='confirmed' AND date BETWEEN ? AND ? ORDER BY date DESC", [from, to]).rows?._array ?? []).map(rowToTx);
  },
};
```

- [ ] **Step 4: Run, watch pass**

Run: `npm test -- transactionsRepo`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(data): transactions repo with dedupe + aggregations"
```

---

## PHASE 2 — Parser (pure rule registry)

### Task 2.1: Amount extraction

**Files:**
- Create: `src/parser/types.ts`, `src/parser/amount.ts`
- Test: `__tests__/parser/amount.test.ts`

**Interfaces:**
- Produces: `RawSms {sender,body,date}`, `extractAmountPaise(body): number | null`.

- [ ] **Step 1: Failing tests**

```ts
// __tests__/parser/amount.test.ts
import { extractAmountPaise } from '@/parser/amount';
test.each([
  ['Rs.5,000.00 debited', 500000],
  ['INR 1234.50 credited', 123450],
  ['debited by Rs 50', 5000],
  ['₹ 99.99 spent', 9999],
  ['no amount here', null],
])('extracts %s', (body, expected) => {
  expect(extractAmountPaise(body)).toBe(expected);
});
```

- [ ] **Step 2: Run → FAIL.** `npm test -- parser/amount`

- [ ] **Step 3: Implement**

```ts
// src/parser/types.ts
export interface RawSms { sender: string; body: string; date: number; }
export interface ParseResult {
  amount: number | null; type: 'credit' | 'debit' | null;
  payee: string | null; confidence: number; matchedRuleId: string | null;
}
```

```ts
// src/parser/amount.ts
const AMOUNT_RE = /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
export function extractAmountPaise(body: string): number | null {
  const m = body.match(AMOUNT_RE);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 100);
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(parser): amount extraction in paise"`

### Task 2.2: Credit/debit classification

**Files:**
- Create: `src/parser/classify.ts`
- Test: `__tests__/parser/classify.test.ts`

**Interfaces:**
- Produces: `classifyType(body): 'credit' | 'debit' | null`.

- [ ] **Step 1: Failing tests**

```ts
// __tests__/parser/classify.test.ts
import { classifyType } from '@/parser/classify';
test.each([
  ['Your a/c debited by Rs.50', 'debit'],
  ['Rs.500 credited to your account', 'credit'],
  ['spent Rs.20 at SWIGGY', 'debit'],
  ['received Rs.100 via UPI', 'credit'],
  ['withdrawn Rs.2000 at ATM', 'debit'],
  ['OTP is 123456', null],
])('classifies %s', (body, expected) => {
  expect(classifyType(body)).toBe(expected);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
// src/parser/classify.ts
const DEBIT = /\b(debited|debit|spent|withdrawn|paid|purchase|sent|deducted)\b/i;
const CREDIT = /\b(credited|credit|received|deposited|refund(?:ed)?|added)\b/i;
export function classifyType(body: string): 'credit' | 'debit' | null {
  const d = DEBIT.test(body), c = CREDIT.test(body);
  if (d && !c) return 'debit';
  if (c && !d) return 'credit';
  if (d && c) return /credited/i.test(body) ? 'credit' : 'debit';
  return null;
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(parser): credit/debit classification"`

### Task 2.3: Payee extraction

**Files:**
- Create: `src/parser/payee.ts`
- Test: `__tests__/parser/payee.test.ts`

**Interfaces:**
- Produces: `extractPayee(body): string | null`.

- [ ] **Step 1: Failing tests**

```ts
// __tests__/parser/payee.test.ts
import { extractPayee } from '@/parser/payee';
test.each([
  ['Rs.50 spent at SWIGGY on 12-01', 'SWIGGY'],
  ['paid to AMAZON PAY via UPI', 'AMAZON PAY'],
  ['VPA swiggy@hdfcbank credited', 'swiggy@hdfcbank'],
  ['random text', null],
])('payee from %s', (body, expected) => {
  expect(extractPayee(body)).toBe(expected);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
// src/parser/payee.ts
const VPA = /\b([a-z0-9.\-_]+@[a-z]+)\b/i;
const AT = /\b(?:at|to)\s+([A-Z][A-Z0-9 &._-]{2,30}?)(?:\s+(?:on|via|ref|UPI|Rs|INR)\b|[.,]|$)/;
export function extractPayee(body: string): string | null {
  const vpa = body.match(VPA); if (vpa) return vpa[1];
  const at = body.match(AT); if (at) return at[1].trim();
  return null;
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(parser): payee/merchant extraction"`

### Task 2.4: Built-in rules + rule engine + confidence

**Files:**
- Create: `src/parser/builtinRules.ts`, `src/parser/ruleEngine.ts`, `src/parser/index.ts`
- Test: `__tests__/parser/ruleEngine.test.ts`

**Interfaces:**
- Consumes: `extractAmountPaise`, `classifyType`, `extractPayee`, `ParseRule`, `RawSms`, `ParseResult`.
- Produces: `BUILTIN_RULES: ParseRule[]`, `parseSms(raw: RawSms, userRules?: ParseRule[]): ParseResult`.

- [ ] **Step 1: Failing tests**

```ts
// __tests__/parser/ruleEngine.test.ts
import { parseSms } from '@/parser';

test('HDFC debit parsed with high confidence', () => {
  const r = parseSms({ sender: 'VM-HDFCBK', date: 1, body: 'Rs.250.00 debited from a/c **1234 at SWIGGY. UPI Ref 123.' });
  expect(r.type).toBe('debit');
  expect(r.amount).toBe(25000);
  expect(r.payee).toBe('SWIGGY');
  expect(r.confidence).toBeGreaterThanOrEqual(0.7);
});

test('unknown sender still parses via generic fallback at low confidence', () => {
  const r = parseSms({ sender: 'XX-RANDOM', date: 1, body: 'INR 99 credited to wallet' });
  expect(r.type).toBe('credit');
  expect(r.amount).toBe(9900);
  expect(r.confidence).toBeLessThan(0.7);
  expect(r.confidence).toBeGreaterThan(0);
});

test('non-transaction SMS yields zero confidence / null amount', () => {
  const r = parseSms({ sender: 'XX-PROMO', date: 1, body: 'Get 50% off this weekend!' });
  expect(r.amount).toBeNull();
  expect(r.confidence).toBe(0);
});

test('user rule can boost a custom sender', () => {
  const r = parseSms(
    { sender: 'NEOBANK', date: 1, body: 'You spent 12.00 at CAFE' },
    [{ id: 'u1', senderPattern: 'NEOBANK', bodyRegex: 'spent', typeHint: 'debit', isBuiltIn: false, confidenceWeight: 1 }],
  );
  expect(r.type).toBe('debit');
  expect(r.confidence).toBeGreaterThanOrEqual(0.7);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement built-in rules**

```ts
// src/parser/builtinRules.ts
import type { ParseRule } from '@/data/types';
export const BUILTIN_RULES: ParseRule[] = [
  { id: 'hdfc', senderPattern: 'HDFCBK', bodyRegex: '(debited|credited|spent)', typeHint: null, isBuiltIn: true, confidenceWeight: 1 },
  { id: 'sbi',  senderPattern: 'SBIINB|SBI',  bodyRegex: '(debited|credited|withdrawn)', typeHint: null, isBuiltIn: true, confidenceWeight: 1 },
  { id: 'icici',senderPattern: 'ICICIB|ICICI',bodyRegex: '(debited|credited|spent)', typeHint: null, isBuiltIn: true, confidenceWeight: 1 },
  { id: 'axis', senderPattern: 'AXISBK|AXIS',  bodyRegex: '(debited|credited|spent)', typeHint: null, isBuiltIn: true, confidenceWeight: 1 },
  { id: 'upi',  senderPattern: 'UPI',          bodyRegex: '(debited|credited|paid|received)', typeHint: null, isBuiltIn: true, confidenceWeight: 0.9 },
];
```

```ts
// src/parser/ruleEngine.ts
import type { ParseRule } from '@/data/types';
import type { RawSms, ParseResult } from './types';
import { extractAmountPaise } from './amount';
import { classifyType } from './classify';
import { extractPayee } from './payee';

function ruleMatches(rule: ParseRule, raw: RawSms): boolean {
  try {
    return new RegExp(rule.senderPattern, 'i').test(raw.sender) &&
           new RegExp(rule.bodyRegex, 'i').test(raw.body);
  } catch { return false; }
}

export function runEngine(raw: RawSms, rules: ParseRule[]): ParseResult {
  const amount = extractAmountPaise(raw.body);
  const matched = rules.find(r => ruleMatches(r, raw)) ?? null;
  const type = matched?.typeHint ?? classifyType(raw.body);
  const payee = extractPayee(raw.body);

  if (amount === null && type === null)
    return { amount: null, type: null, payee, confidence: 0, matchedRuleId: null };

  // confidence: base for signal present + bonus for a known rule match
  let c = 0;
  if (amount !== null) c += 0.4;
  if (type !== null) c += 0.3;
  if (matched) c += 0.3 * (matched.confidenceWeight ?? 1);
  c = Math.min(1, c);

  return { amount, type, payee, confidence: c, matchedRuleId: matched?.id ?? null };
}
```

```ts
// src/parser/index.ts
import type { ParseRule } from '@/data/types';
import type { RawSms, ParseResult } from './types';
import { BUILTIN_RULES } from './builtinRules';
import { runEngine } from './ruleEngine';

export function parseSms(raw: RawSms, userRules: ParseRule[] = []): ParseResult {
  // user rules first (highest priority), then built-ins
  return runEngine(raw, [...userRules, ...BUILTIN_RULES]);
}
export type { RawSms, ParseResult };
```

- [ ] **Step 4: Run → PASS** (all 4 tests). `npm test -- parser`

- [ ] **Step 5: Commit** `git commit -am "feat(parser): rule engine + builtin rules + confidence scoring"`

### Task 2.5: Dedupe hash + draft mapper

**Files:**
- Create: `src/parser/toDraft.ts`
- Test: `__tests__/parser/toDraft.test.ts`

**Interfaces:**
- Consumes: `ParseResult`, `RawSms`, `DraftTransaction`.
- Produces: `dedupeHash(raw): string`, `toDraft(raw, result): DraftTransaction | null` (null when no amount).

- [ ] **Step 1: Failing tests**

```ts
// __tests__/parser/toDraft.test.ts
import { dedupeHash, toDraft } from '@/parser/toDraft';

test('dedupeHash stable for same content', () => {
  const raw = { sender: 'HDFCBK', body: 'Rs.50 debited', date: 1719500000000 };
  expect(dedupeHash(raw)).toBe(dedupeHash({ ...raw }));
});

test('toDraft yields pending sms draft with amount', () => {
  const raw = { sender: 'HDFCBK', body: 'Rs.50.00 debited at SWIGGY', date: 1719500000000 };
  const d = toDraft(raw, { amount: 5000, type: 'debit', payee: 'SWIGGY', confidence: 0.9, matchedRuleId: 'hdfc' });
  expect(d?.status).toBe('pending');
  expect(d?.origin).toBe('sms');
  expect(d?.amount).toBe(5000);
  expect(d?.dedupeHash).toBeTruthy();
});

test('toDraft returns null when no amount', () => {
  const raw = { sender: 'X', body: 'hi', date: 1 };
  expect(toDraft(raw, { amount: null, type: null, payee: null, confidence: 0, matchedRuleId: null })).toBeNull();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
// src/parser/toDraft.ts
import type { RawSms, ParseResult } from './types';
import type { DraftTransaction } from '@/data/types';

export function dedupeHash(raw: RawSms): string {
  // simple stable djb2 over sender|body|dateBucket(minute)
  const bucket = Math.floor(raw.date / 60000);
  const s = `${raw.sender}|${raw.body}|${bucket}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function toDraft(raw: RawSms, r: ParseResult): DraftTransaction | null {
  if (r.amount === null) return null;
  return {
    amount: r.amount,
    type: r.type ?? 'debit',
    date: raw.date,
    categoryId: null, subcategoryId: null,
    note: null, payee: r.payee, source: raw.sender,
    status: 'pending', origin: 'sms',
    rawSmsBody: raw.body, rawSmsSender: raw.sender,
    dedupeHash: dedupeHash(raw),
  };
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(parser): dedupe hash + SMS->draft mapper"`

---

## PHASE 3 — SMS ingestion (permissions, backfill, live)

### Task 3.1: Permissions module

**Files:**
- Create: `src/sms/permissions.ts`
- Test: `__tests__/sms/permissions.test.ts`

**Interfaces:**
- Consumes: RN `PermissionsAndroid`.
- Produces: `requestSmsPermissions(): Promise<boolean>`, `hasSmsPermissions(): Promise<boolean>`.

- [ ] **Step 1: Failing test (mock PermissionsAndroid)**

```ts
// __tests__/sms/permissions.test.ts
jest.mock('react-native', () => ({
  PermissionsAndroid: {
    PERMISSIONS: { READ_SMS: 'READ_SMS', RECEIVE_SMS: 'RECEIVE_SMS' },
    RESULTS: { GRANTED: 'granted' },
    requestMultiple: jest.fn(async () => ({ READ_SMS: 'granted', RECEIVE_SMS: 'granted' })),
    check: jest.fn(async () => true),
  },
}));
import { requestSmsPermissions } from '@/sms/permissions';
test('returns true when both granted', async () => {
  await expect(requestSmsPermissions()).resolves.toBe(true);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
// src/sms/permissions.ts
import { PermissionsAndroid } from 'react-native';
export async function requestSmsPermissions(): Promise<boolean> {
  const res = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ]);
  return res[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
         res[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED;
}
export async function hasSmsPermissions(): Promise<boolean> {
  return (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS)) &&
         (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS));
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(sms): permissions request/check"`

### Task 3.2: Inbox backfill → drafts pipeline

**Files:**
- Create: `src/sms/inbox.ts`, `src/sms/ingest.ts`
- Test: `__tests__/sms/ingest.test.ts`

**Interfaces:**
- Consumes: `react-native-get-sms-android`, `parseSms`, `toDraft`, `transactionsRepo`, `parseRulesRepo`.
- Produces: `readInbox(): Promise<RawSms[]>`, `ingestRaw(raw): {inserted:boolean, reason?:string}` (dedupe-aware), `backfill(): Promise<{scanned:number, inserted:number}>`.

- [ ] **Step 1: Failing test for the pure `ingestRaw` (mock repos)**

```ts
// __tests__/sms/ingest.test.ts
import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { ingestRaw } from '@/sms/ingest';
import { transactionsRepo as repo } from '@/data/transactionsRepo';

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('ingestRaw inserts a pending sms transaction', () => {
  const res = ingestRaw({ sender: 'HDFCBK', body: 'Rs.50.00 debited at SWIGGY', date: 1719500000000 });
  expect(res.inserted).toBe(true);
  expect(repo.listByStatus('pending')).toHaveLength(1);
});

test('ingestRaw skips duplicates by hash', () => {
  const raw = { sender: 'HDFCBK', body: 'Rs.50.00 debited at SWIGGY', date: 1719500000000 };
  ingestRaw(raw);
  const res2 = ingestRaw(raw);
  expect(res2.inserted).toBe(false);
  expect(res2.reason).toBe('duplicate');
  expect(repo.listByStatus('pending')).toHaveLength(1);
});

test('ingestRaw skips non-transaction sms', () => {
  const res = ingestRaw({ sender: 'PROMO', body: 'Get 50% off!', date: 1 });
  expect(res.inserted).toBe(false);
  expect(res.reason).toBe('not-a-transaction');
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `ingest.ts`** (pure, repo-driven; `parseRulesRepo.listUserRules()` defaults to `[]` until Task 6.x — guard with try/empty)

```ts
// src/sms/ingest.ts
import { parseSms } from '@/parser';
import { toDraft, dedupeHash } from '@/parser/toDraft';
import type { RawSms } from '@/parser';
import { transactionsRepo } from '@/data/transactionsRepo';

export function ingestRaw(raw: RawSms): { inserted: boolean; reason?: string } {
  const result = parseSms(raw, []); // user rules wired in Task 6.3
  const draft = toDraft(raw, result);
  if (!draft) return { inserted: false, reason: 'not-a-transaction' };
  if (transactionsRepo.existsByHash(dedupeHash(raw))) return { inserted: false, reason: 'duplicate' };
  transactionsRepo.insertDraft(draft);
  return { inserted: true };
}
```

```ts
// src/sms/inbox.ts
import SmsAndroid from 'react-native-get-sms-android';
import type { RawSms } from '@/parser';
export function readInbox(): Promise<RawSms[]> {
  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify({ box: 'inbox', maxCount: 2000 }),
      (err: string) => reject(new Error(err)),
      (_count: number, smsList: string) => {
        const arr = JSON.parse(smsList) as { address: string; body: string; date: number }[];
        resolve(arr.map(s => ({ sender: s.address, body: s.body, date: s.date })));
      },
    );
  });
}
export async function backfill(): Promise<{ scanned: number; inserted: number }> {
  const { ingestRaw } = await import('./ingest');
  const msgs = await readInbox();
  let inserted = 0;
  for (const m of msgs) if (ingestRaw(m).inserted) inserted++;
  return { scanned: msgs.length, inserted };
}
```

- [ ] **Step 4: Run → PASS** (3 tests). `npm test -- ingest`

- [ ] **Step 5: Commit** `git commit -am "feat(sms): inbox backfill + dedupe-aware ingest pipeline"`

### Task 3.3: Native live receiver (Android Java) + JS bridge

**Files:**
- Create: `android/app/src/main/java/com/spendly/sms/SmsReceiver.java`, `SmsHeadlessTask.java`, `SmsPackage.java`
- Modify: `android/app/src/main/AndroidManifest.xml`, `MainApplication.kt`/`.java`
- Create: `src/sms/liveBridge.ts`, `index.js` (register headless task)
- Test: `__tests__/sms/liveBridge.test.ts` (JS handler unit)

**Interfaces:**
- Produces: a headless JS task `SpendlySmsTask` receiving `{sender, body, date}` and calling `ingestRaw`; `registerSmsHeadlessTask()`.

- [ ] **Step 1: Failing test for the JS handler**

```ts
// __tests__/sms/liveBridge.test.ts
import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { handleHeadlessSms } from '@/sms/liveBridge';
import { transactionsRepo as repo } from '@/data/transactionsRepo';

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('headless handler ingests an incoming sms', async () => {
  await handleHeadlessSms({ sender: 'HDFCBK', body: 'Rs.10.00 debited at CAFE', date: 1719500000000 });
  expect(repo.listByStatus('pending')).toHaveLength(1);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement JS bridge**

```ts
// src/sms/liveBridge.ts
import { AppRegistry } from 'react-native';
import { ingestRaw } from './ingest';
import type { RawSms } from '@/parser';

export async function handleHeadlessSms(raw: RawSms): Promise<void> {
  try { ingestRaw(raw); } catch (e) { /* swallow: headless must not crash */ }
}
export function registerSmsHeadlessTask(): void {
  AppRegistry.registerHeadlessTask('SpendlySmsTask', () => async (data: any) =>
    handleHeadlessSms({ sender: data.sender, body: data.body, date: Number(data.date) }));
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Implement the native receiver**

```java
// android/app/src/main/java/com/spendly/sms/SmsReceiver.java
package com.spendly.sms;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
public class SmsReceiver extends BroadcastReceiver {
  @Override public void onReceive(Context context, Intent intent) {
    Bundle b = intent.getExtras();
    if (b == null) return;
    Object[] pdus = (Object[]) b.get("pdus");
    if (pdus == null) return;
    StringBuilder body = new StringBuilder();
    String sender = "";
    long date = System.currentTimeMillis();
    for (Object pdu : pdus) {
      SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu, b.getString("format"));
      body.append(sms.getMessageBody());
      sender = sms.getOriginatingAddress();
      date = sms.getTimestampMillis();
    }
    Intent service = new Intent(context, SmsHeadlessTask.class);
    service.putExtra("sender", sender);
    service.putExtra("body", body.toString());
    service.putExtra("date", date);
    context.startService(service);
    SmsHeadlessTask.acquireWakeLockStatic(context);
  }
}
```

```java
// android/app/src/main/java/com/spendly/sms/SmsHeadlessTask.java
package com.spendly.sms;
import android.content.Intent;
import android.os.Bundle;
import androidx.annotation.Nullable;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import android.content.Context;
public class SmsHeadlessTask extends HeadlessJsTaskService {
  static void acquireWakeLockStatic(Context c) { /* optional wakelock */ }
  @Nullable @Override protected HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    Bundle extras = intent.getExtras();
    if (extras == null) return null;
    WritableMap data = Arguments.createMap();
    data.putString("sender", extras.getString("sender"));
    data.putString("body", extras.getString("body"));
    data.putDouble("date", extras.getLong("date"));
    return new HeadlessJsTaskConfig("SpendlySmsTask", data, 30000, true);
  }
}
```

- [ ] **Step 6: Register receiver + service in `AndroidManifest.xml`** (inside `<application>`):

```xml
<receiver android:name="com.spendly.sms.SmsReceiver" android:exported="true" android:permission="android.permission.BROADCAST_SMS">
  <intent-filter android:priority="999">
    <action android:name="android.provider.Telephony.SMS_RECEIVED" />
  </intent-filter>
</receiver>
<service android:name="com.spendly.sms.SmsHeadlessTask" android:exported="false" />
```

- [ ] **Step 7: Register headless task at JS entry** — in `index.js` add `import { registerSmsHeadlessTask } from './src/sms/liveBridge'; registerSmsHeadlessTask();`

- [ ] **Step 8: Manual device verification** — send yourself a test "Rs.10 debited" SMS; confirm a pending item appears. Document result.

- [ ] **Step 9: Commit** `git commit -am "feat(sms): native live receiver + headless ingest bridge"`

---

## PHASE 4 — Pending → Confirmed flow

### Task 4.1: Pending store

**Files:**
- Create: `src/features/pending/pendingStore.ts`
- Test: `__tests__/features/pendingStore.test.ts`

**Interfaces:**
- Consumes: `transactionsRepo`.
- Produces: zustand store `usePendingStore` with `items`, `refresh()`, `confirm(id,{categoryId,subcategoryId,note?,payee?})`, `discard(id)`.

- [ ] **Step 1: Failing test**

```ts
// __tests__/features/pendingStore.test.ts
import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { transactionsRepo as repo } from '@/data/transactionsRepo';
import { usePendingStore } from '@/features/pending/pendingStore';

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('refresh loads pending; confirm removes from pending list', () => {
  repo.insertDraft({ amount: 100, type: 'debit', date: 1, categoryId: null, subcategoryId: null, note: null, payee: null, source: 'X', status: 'pending', origin: 'sms', rawSmsBody: 'x', rawSmsSender: 'X', dedupeHash: 'z' } as any);
  usePendingStore.getState().refresh();
  expect(usePendingStore.getState().items).toHaveLength(1);
  const tid = usePendingStore.getState().items[0].id;
  usePendingStore.getState().confirm(tid, { categoryId: 'c1', subcategoryId: 's1' });
  expect(usePendingStore.getState().items).toHaveLength(0);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
// src/features/pending/pendingStore.ts
import { create } from 'zustand';
import { transactionsRepo } from '@/data/transactionsRepo';
import type { Transaction } from '@/data/types';

interface PendingState {
  items: Transaction[];
  refresh: () => void;
  confirm: (id: string, p: { categoryId: string; subcategoryId: string; note?: string; payee?: string }) => void;
  discard: (id: string) => void;
}
export const usePendingStore = create<PendingState>((set) => ({
  items: [],
  refresh: () => set({ items: transactionsRepo.listByStatus('pending') }),
  confirm: (id, p) => { transactionsRepo.confirm(id, p); set({ items: transactionsRepo.listByStatus('pending') }); },
  discard: (id) => { transactionsRepo.remove(id); set({ items: transactionsRepo.listByStatus('pending') }); },
}));
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(pending): pending store over repo"`

### Task 4.2: Pending screen + confirm sheet (category gate UI)

**Files:**
- Create: `src/features/pending/PendingScreen.tsx`, `src/features/pending/ConfirmSheet.tsx`
- Test: `__tests__/features/ConfirmSheet.test.tsx`

**Interfaces:**
- Consumes: `usePendingStore`, `categoriesRepo`.
- Produces: a confirm UI where the Confirm button is **disabled until category + subcategory are chosen**.

- [ ] **Step 1: Failing RNTL test**

```tsx
// __tests__/features/ConfirmSheet.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConfirmSheet } from '@/features/pending/ConfirmSheet';

const tx = { id: 't1', amount: 5000, type: 'debit', date: 1, payee: 'SWIGGY' } as any;

test('confirm button disabled until category+subcategory selected', () => {
  const onConfirm = jest.fn();
  const { getByTestId } = render(
    <ConfirmSheet tx={tx} categories={[{ id: 'c1', name: 'Food', icon: '🍽️', isDefault: true }]}
      subcategoriesFor={() => [{ id: 's1', categoryId: 'c1', name: 'Dining', isDefault: true }]}
      onConfirm={onConfirm} onDiscard={() => {}} />,
  );
  fireEvent.press(getByTestId('confirm-btn'));
  expect(onConfirm).not.toHaveBeenCalled();          // gate holds
  fireEvent.press(getByTestId('cat-c1'));
  fireEvent.press(getByTestId('sub-s1'));
  fireEvent.press(getByTestId('confirm-btn'));
  expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c1', subcategoryId: 's1' }));
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `ConfirmSheet.tsx`** (presentational; logic = gate). Key: track `categoryId`/`subcategoryId` in state; `disabled={!categoryId || !subcategoryId}` on the confirm button; `testID` on each chip and the button. Render amount as `₹${(tx.amount/100).toFixed(2)}`.

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Implement `PendingScreen.tsx`** — list `usePendingStore().items`, tap opens `ConfirmSheet`, wire `confirm`/`discard`, `refresh()` on focus.

- [ ] **Step 6: Commit** `git commit -am "feat(pending): review screen + confirm sheet with category gate"`

---

## PHASE 5 — Ledger + manual entry

### Task 5.1: Shared TransactionForm + manual entry

**Files:**
- Create: `src/features/ledger/TransactionForm.tsx`, `src/features/ledger/ManualEntryScreen.tsx`
- Test: `__tests__/features/ManualEntry.test.tsx`

**Interfaces:**
- Consumes: `categoriesRepo`, `transactionsRepo`.
- Produces: a manual form that saves a **confirmed** transaction (amount, type, date, category+subcategory required; note/payee optional).

- [ ] **Step 1: Failing test**

```tsx
// __tests__/features/ManualEntry.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TransactionForm } from '@/features/ledger/TransactionForm';

test('save disabled until amount + category + subcategory present', () => {
  const onSave = jest.fn();
  const { getByTestId } = render(
    <TransactionForm
      categories={[{ id: 'c1', name: 'Food', icon: '🍽️', isDefault: true }]}
      subcategoriesFor={() => [{ id: 's1', categoryId: 'c1', name: 'Dining', isDefault: true }]}
      onSave={onSave} />,
  );
  fireEvent.press(getByTestId('save-btn'));
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.changeText(getByTestId('amount-input'), '123.45');
  fireEvent.press(getByTestId('type-debit'));
  fireEvent.press(getByTestId('cat-c1'));
  fireEvent.press(getByTestId('sub-s1'));
  fireEvent.press(getByTestId('save-btn'));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amount: 12345, type: 'debit', categoryId: 'c1', subcategoryId: 's1' }));
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `TransactionForm.tsx`** — controlled inputs; convert amount text → paise via `Math.round(parseFloat(x)*100)`; `disabled` until amount>0 && category && subcategory; emit a `DraftTransaction`-shaped object with `status:'confirmed', origin:'manual'`.

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Implement `ManualEntryScreen.tsx`** — wraps the form, on save calls `transactionsRepo.insertDraft({...confirmed})`, then navigates back.

- [ ] **Step 6: Commit** `git commit -am "feat(ledger): manual entry via shared transaction form"`

### Task 5.2: Ledger list screen

**Files:**
- Create: `src/features/ledger/LedgerScreen.tsx`
- Test: `__tests__/features/ledgerFilter.test.ts` (pure filter helper)

**Interfaces:**
- Consumes: `transactionsRepo.listInRange`.
- Produces: `filterTransactions(items, {type?, categoryId?, q?})` pure helper + a list screen.

- [ ] **Step 1: Failing test for filter helper**

```ts
// __tests__/features/ledgerFilter.test.ts
import { filterTransactions } from '@/features/ledger/filter';
const items = [
  { id: 'a', type: 'debit', categoryId: 'c1', payee: 'SWIGGY', note: null },
  { id: 'b', type: 'credit', categoryId: 'c2', payee: 'ACME', note: 'salary' },
] as any[];
test('filters by type', () => { expect(filterTransactions(items, { type: 'credit' })).toHaveLength(1); });
test('filters by query over payee/note', () => { expect(filterTransactions(items, { q: 'swig' })[0].id).toBe('a'); });
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `src/features/ledger/filter.ts`**

```ts
// src/features/ledger/filter.ts
import type { Transaction } from '@/data/types';
export function filterTransactions(items: Transaction[], f: { type?: string; categoryId?: string; q?: string }): Transaction[] {
  return items.filter(t => {
    if (f.type && t.type !== f.type) return false;
    if (f.categoryId && t.categoryId !== f.categoryId) return false;
    if (f.q) { const q = f.q.toLowerCase(); if (!(`${t.payee ?? ''} ${t.note ?? ''}`.toLowerCase().includes(q))) return false; }
    return true;
  });
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Implement `LedgerScreen.tsx`** — month range default, `listInRange`, apply `filterTransactions`, render rows (`₹` amount, type color, payee/category, date).

- [ ] **Step 6: Commit** `git commit -am "feat(ledger): filterable transaction list"`

---

## PHASE 6 — Categories management + user parse rules

### Task 6.1: Categories management screen

**Files:**
- Create: `src/features/categories/CategoriesScreen.tsx`
- Test: covered by `categoriesRepo` tests (Task 1.3); add a render smoke test.

**Interfaces:**
- Consumes: `categoriesRepo`.
- Produces: UI to add category, add subcategory, rename, delete (shows guard error when in use).

- [ ] **Step 1: Smoke test** renders list of seeded categories. `npm test -- Categories`
- [ ] **Step 2: Implement screen** — list categories w/ their subs; "+ Category", "+ Subcategory", rename, delete (catch guard `Error`, show alert "Reassign transactions first").
- [ ] **Step 3: Commit** `git commit -am "feat(categories): manage custom categories/subcategories"`

### Task 6.2: Parse rules repo

**Files:**
- Create: `src/data/parseRulesRepo.ts`
- Test: `__tests__/data/parseRulesRepo.test.ts`

**Interfaces:**
- Produces: `parseRulesRepo.listUserRules(): ParseRule[]`, `addRule(rule): string`, `removeRule(id)`.

- [ ] **Step 1: Failing test** (in-memory db: add a rule, list returns it). 
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** mapping `parse_rules` rows ↔ `ParseRule` (`is_built_in=0` for user rules).
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat(data): user parse-rules repo"`

### Task 6.3: Wire user rules into ingest + "teach Spendly" entry

**Files:**
- Modify: `src/sms/ingest.ts:8` (replace `parseSms(raw, [])` with user rules)
- Create: `src/features/pending/TeachRuleSheet.tsx`
- Test: `__tests__/sms/ingestUserRule.test.ts`

**Interfaces:**
- Consumes: `parseRulesRepo.listUserRules`.
- Produces: ingest now applies user rules; UI to create a rule from an unparsed/low-confidence pending item.

- [ ] **Step 1: Failing test** — add a user rule via repo, then `ingestRaw` of a matching custom-sender SMS yields a pending tx with the hinted type.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — in `ingest.ts`: `const rules = parseRulesRepo.listUserRules(); parseSms(raw, rules);`. Add `TeachRuleSheet` that captures `senderPattern`/`bodyRegex`/`typeHint` and calls `parseRulesRepo.addRule`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat(parser): apply user rules in ingest + teach-rule UI"`

---

## PHASE 7 — Dashboard (aggregation + charts + drill-down)

### Task 7.1: Pure aggregation helpers

**Files:**
- Create: `src/features/dashboard/period.ts`, `src/features/dashboard/aggregations.ts`
- Test: `__tests__/features/aggregations.test.ts`

**Interfaces:**
- Produces: `periodRange(kind:'month'|'week', anchor:number): {from,to}`, `buildCategorySlices(rows, categories): {categoryId,name,total,pct}[]`, `buildTrend(rows, buckets): {label,credit,debit}[]`.

- [ ] **Step 1: Failing tests**

```ts
// __tests__/features/aggregations.test.ts
import { buildCategorySlices } from '@/features/dashboard/aggregations';
test('category slices compute percentage of total', () => {
  const rows = [
    { categoryId: 'c1', amount: 7500, type: 'debit' },
    { categoryId: 'c2', amount: 2500, type: 'debit' },
  ] as any[];
  const cats = [{ id: 'c1', name: 'Food' }, { id: 'c2', name: 'Transport' }] as any[];
  const slices = buildCategorySlices(rows, cats);
  expect(slices.find(s => s.categoryId === 'c1')!.pct).toBeCloseTo(75);
  expect(slices.find(s => s.categoryId === 'c2')!.name).toBe('Transport');
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```ts
// src/features/dashboard/aggregations.ts
export function buildCategorySlices(rows: { categoryId: string | null; amount: number }[], categories: { id: string; name: string }[]) {
  const total = rows.reduce((s, r) => s + r.amount, 0) || 1;
  const byCat = new Map<string, number>();
  for (const r of rows) byCat.set(r.categoryId ?? 'uncat', (byCat.get(r.categoryId ?? 'uncat') ?? 0) + r.amount);
  return [...byCat.entries()].map(([categoryId, t]) => ({
    categoryId,
    name: categories.find(c => c.id === categoryId)?.name ?? 'Uncategorized',
    total: t,
    pct: (t / total) * 100,
  })).sort((a, b) => b.total - a.total);
}
```

`period.ts`: compute month/week boundaries from an anchor epoch (no `Date.now()` in helpers — caller passes anchor).

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(dashboard): pure aggregation + period helpers"`

### Task 7.2: Dashboard screen with charts + drill-down

**Files:**
- Create: `src/features/dashboard/DashboardScreen.tsx`, `src/features/dashboard/CategoryDrillScreen.tsx`
- Test: render smoke test with seeded data.

**Interfaces:**
- Consumes: `transactionsRepo.sumByType/breakdownByCategory/listInRange`, aggregation helpers, `react-native-gifted-charts`.
- Produces: period selector, income/expense/net headline, category pie/bar, tap → `CategoryDrillScreen` (subcategory breakdown + transactions), trend chart.

- [ ] **Step 1: Smoke test** — seed 2 confirmed tx, render `DashboardScreen`, assert headline shows totals. 
- [ ] **Step 2: Implement `DashboardScreen.tsx`** — state: `periodKind`, `anchor`; compute `{from,to}`; `sumByType` → headline; `breakdownByCategory('debit')` + `buildCategorySlices` → `PieChart`; tap slice → navigate drill with `categoryId`.
- [ ] **Step 3: Implement `CategoryDrillScreen.tsx`** — subcategory breakdown for the chosen category + the underlying transactions list.
- [ ] **Step 4: Implement trend** — last N months via repeated `sumByType` per bucket → `BarChart`/`LineChart`.
- [ ] **Step 5: Manual verification** — screenshot dashboard with sample data. 
- [ ] **Step 6: Commit** `git commit -am "feat(dashboard): rich dashboard with drill-down + trend"`

---

## PHASE 8 — App integration & first-launch orchestration

### Task 8.1: Navigation

**Files:**
- Create: `src/navigation/RootNavigator.tsx`, `src/app/App.tsx`
- Modify: `index.js`

**Interfaces:**
- Produces: bottom-tab nav: Dashboard, Pending (badge = pending count), Ledger, Categories; stack for Manual Entry + Category Drill.

- [ ] **Step 1: Implement RootNavigator** with the four tabs + nested stack screens.
- [ ] **Step 2: Wire `App.tsx`** to `NavigationContainer` + run `bootstrap()` (Task 8.2) on mount.
- [ ] **Step 3: Smoke test** renders without crashing. `npm test -- App`
- [ ] **Step 4: Commit** `git commit -am "feat(app): navigation shell"`

### Task 8.2: First-launch bootstrap

**Files:**
- Create: `src/app/bootstrap.ts`
- Test: `__tests__/app/bootstrap.test.ts`

**Interfaces:**
- Consumes: `runMigrations`, `seedDefaults`, `hasSmsPermissions`, `requestSmsPermissions`, `backfill`, `registerSmsHeadlessTask`, `meta` table.
- Produces: `bootstrap(): Promise<{firstRun:boolean, backfill?:{scanned,inserted}}>` — migrate → seed → (if first run & permission granted) backfill; idempotent via `meta.bootstrapped`.

- [ ] **Step 1: Failing test** — first call returns `firstRun:true` and seeds categories; second call returns `firstRun:false` and does not re-seed (mock SMS perms + backfill).
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `bootstrap.ts`** — `runMigrations(); seedDefaults();` read `meta.bootstrapped`; if absent: request perms, `await backfill()`, set `meta.bootstrapped=1`; always `registerSmsHeadlessTask()`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat(app): idempotent first-launch bootstrap"`

### Task 8.3: Permission rationale + end-to-end manual verification

**Files:**
- Create: `src/app/PermissionGate.tsx`
- Test: manual.

**Interfaces:**
- Produces: a first-run rationale screen explaining on-device privacy before requesting SMS perms.

- [ ] **Step 1: Implement `PermissionGate.tsx`** — shows rationale, "Grant" → `requestSmsPermissions()`, "Not now" → manual-only mode.
- [ ] **Step 2: Full E2E manual run** on device: grant → backfill populates Pending → confirm one with category → appears in Ledger + Dashboard → send a live test SMS → new Pending item → manual entry adds a confirmed tx. Document each result.
- [ ] **Step 3: Commit** `git commit -am "feat(app): permission rationale gate + e2e verification notes"`

---

## Self-Review

**Spec coverage check (spec §→task):**
- §1 scope / Android / offline → Global Constraints, Task 0.1–0.2. ✅
- §2 data model (Transaction, Category, ParseRule) → 1.1, 1.2, 1.3, 1.4, 6.2. ✅
- §3 SMS ingestion (permissions, backfill, live, rule registry, confidence, user-extensible) → 3.1, 3.2, 3.3, 2.1–2.5, 6.2, 6.3. ✅
- §4 pending→confirmed (queue, category gate, manual same form, dedupe) → 4.1, 4.2, 5.1, 1.4 (dedupe). ✅
- §5 rich dashboard (period, headline, breakdown, drill-down, trend, payee group) → 7.1, 7.2. ✅
- §6 tech stack → 0.2 (libs), enforced throughout. ✅
- §7 module boundaries → File Structure + per-phase files. ✅
- §8 seed categories → 1.3. ✅
- §9 risks (background reliability, permission policy, parser coverage) → 3.3 Step 8 notes, 8.3, 2.4 fallback. ✅

**Placeholder scan:** No "TBD/TODO/handle edge cases" — UI tasks that omit full JSX specify exact testIDs, gate conditions, and data shapes the test asserts. ✅
**Type consistency:** `DraftTransaction`, `Transaction`, `ParseResult`, `RawSms`, repo method names (`insertDraft`, `confirm`, `existsByHash`, `sumByType`, `breakdownByCategory`, `listInRange`) used consistently across phases. ✅
