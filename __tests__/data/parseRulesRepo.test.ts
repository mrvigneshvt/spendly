import { open } from '@op-engineering/op-sqlite';
import { runMigrations, _setDbForTests } from '@/data/db';
import { parseRulesRepo } from '@/data/parseRulesRepo';

let db: any;
beforeEach(() => { db = open({ name: ':memory:' }); _setDbForTests(db); runMigrations(db); });
afterEach(() => { _setDbForTests(null); db.close(); });

test('addRule inserts a user rule; listUserRules returns it', () => {
  const id = parseRulesRepo.addRule({ senderPattern: 'MYBANK', bodyRegex: 'spent', typeHint: 'debit' }, db);
  const rules = parseRulesRepo.listUserRules(db);
  expect(rules).toHaveLength(1);
  expect(rules[0].isBuiltIn).toBe(false);
  expect(rules[0].senderPattern).toBe('MYBANK');
});

test('removeRule deletes a user rule', () => {
  const id = parseRulesRepo.addRule({ senderPattern: 'MYBANK', bodyRegex: 'spent', typeHint: 'debit' }, db);
  parseRulesRepo.removeRule(id, db);
  expect(parseRulesRepo.listUserRules(db)).toHaveLength(0);
});

test('listUserRules only returns user rules (is_built_in=0)', () => {
  parseRulesRepo.addRule({ senderPattern: 'B1', bodyRegex: 'x', typeHint: null }, db);
  // Insert a built-in rule manually
  db.execute("INSERT INTO parse_rules (id,sender_pattern,body_regex,is_built_in) VALUES ('bi1','B2','x',1)");
  const rules = parseRulesRepo.listUserRules(db);
  expect(rules).toHaveLength(1);
  expect(rules[0].id).not.toBe('bi1');
});
