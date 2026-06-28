import type { ParseRule } from '@/data/types';
import type { RawSms, ParseResult } from './types';
import { BUILTIN_RULES } from './builtinRules';
import { runEngine } from './ruleEngine';

export function parseSms(raw: RawSms, userRules: ParseRule[] = []): ParseResult {
  // user rules first (highest priority), then built-ins
  return runEngine(raw, [...userRules, ...BUILTIN_RULES]);
}

export type { RawSms, ParseResult };
