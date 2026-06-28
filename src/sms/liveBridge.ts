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
