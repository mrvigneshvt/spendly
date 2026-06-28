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
  insertDraft(d: DraftTransaction, db = getDb(), now = Date.now()): string {
    const tid = id('tx');
    db.execute(
      `INSERT INTO transactions (id,amount,type,date,category_id,subcategory_id,note,payee,source,status,origin,raw_sms_body,raw_sms_sender,dedupe_hash,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [tid, d.amount, d.type, d.date, d.categoryId, d.subcategoryId, d.note, d.payee, d.source, d.status, d.origin, d.rawSmsBody, d.rawSmsSender, d.dedupeHash, now],
    );
    return tid;
  },
  confirm(id: string, p: { categoryId: string; subcategoryId: string; note?: string; payee?: string; type?: TxType }, db = getDb()): void {
    if (!p.categoryId || !p.subcategoryId) throw new Error('category and subcategory are required to confirm');
    const cols: string[] = ['status=?', 'category_id=?', 'subcategory_id=?'];
    const vals: any[] = ['confirmed', p.categoryId, p.subcategoryId];
    if ('note' in p) { cols.push('note=?'); vals.push(p.note ?? null); }
    if ('payee' in p) { cols.push('payee=?'); vals.push(p.payee ?? null); }
    if ('type' in p) { cols.push('type=?'); vals.push(p.type); }
    vals.push(id);
    db.execute(`UPDATE transactions SET ${cols.join(',')} WHERE id=?`, vals);
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
    const rows = db.execute('SELECT type, SUM(amount) t FROM transactions WHERE status=? AND date BETWEEN ? AND ? GROUP BY type', ['confirmed', from, to]).rows?._array ?? [];
    const out = { credit: 0, debit: 0 };
    for (const r of rows) (out as any)[r.type] = r.t;
    return out;
  },
  breakdownByCategory(from: number, to: number, type: TxType, db = getDb()): { categoryId: string; total: number }[] {
    return (db.execute('SELECT category_id, SUM(amount) total FROM transactions WHERE status=? AND type=? AND date BETWEEN ? AND ? GROUP BY category_id ORDER BY total DESC', ['confirmed', type, from, to]).rows?._array ?? [])
      .map((r: any) => ({ categoryId: r.category_id, total: r.total }));
  },
  listInRange(from: number, to: number, db = getDb()): Transaction[] {
    return (db.execute('SELECT * FROM transactions WHERE status=? AND date BETWEEN ? AND ? ORDER BY date DESC', ['confirmed', from, to]).rows?._array ?? []).map(rowToTx);
  },
};
