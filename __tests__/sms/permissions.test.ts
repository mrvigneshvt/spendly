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
