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
