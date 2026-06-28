import { getDb } from './db';
import { id } from './id';
import type { ParseRule, TxType } from './types';

export const parseRulesRepo = {
  listUserRules(db = getDb()): ParseRule[] {
    return (db.execute('SELECT * FROM parse_rules WHERE is_built_in=0', []).rows?._array ?? [])
      .map((r: any) => ({
        id: r.id,
        senderPattern: r.sender_pattern,
        bodyRegex: r.body_regex,
        typeHint: r.type_hint as TxType | null,
        isBuiltIn: !!r.is_built_in,
        confidenceWeight: r.confidence_weight,
      }));
  },
  addRule(p: { senderPattern: string; bodyRegex: string; typeHint: TxType | null }, db = getDb()): string {
    const rid = id('rule');
    db.execute('INSERT INTO parse_rules (id,sender_pattern,body_regex,type_hint,is_built_in,confidence_weight) VALUES (?,?,?,?,?,?)',
      [rid, p.senderPattern, p.bodyRegex, p.typeHint, 0, 1]);
    return rid;
  },
  removeRule(id: string, db = getDb()): void {
    db.execute('DELETE FROM parse_rules WHERE id=?', [id]);
  },
};
