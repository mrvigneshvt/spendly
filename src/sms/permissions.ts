import { PermissionsAndroid } from 'react-native';

export type PermissionResult = 'granted' | 'denied' | 'never_ask_again';

async function _requestDetailed(): Promise<PermissionResult> {
  const res = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ]);
  const readResult = res[PermissionsAndroid.PERMISSIONS.READ_SMS];
  const recvResult = res[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS];
  if (readResult === PermissionsAndroid.RESULTS.GRANTED &&
      recvResult === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  if (readResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN || recvResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'never_ask_again';
  return 'denied';
}

export async function requestSmsPermissions(): Promise<boolean> {
  return (await _requestDetailed()) === 'granted';
}

export async function requestSmsPermissionsDetailed(): Promise<PermissionResult> {
  return _requestDetailed();
}

export async function hasSmsPermissions(): Promise<boolean> {
  return (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS)) &&
         (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS));
}
