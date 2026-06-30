import { NativeModules } from 'react-native';

const { SmsReader } = NativeModules;

export interface SmsMessage {
  address: string;
  body: string;
  date: number;
}

/**
 * Read SMS inbox via our native SmsReader module.
 * Returns up to `maxCount` messages sorted by date descending.
 */
export function readInboxNative(maxCount?: number): Promise<SmsMessage[]> {
  return SmsReader.list(JSON.stringify({ maxCount: maxCount ?? 2000 }));
}
