/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerSmsHeadlessTask } from './src/sms/liveBridge';

AppRegistry.registerComponent(appName, () => App);
registerSmsHeadlessTask();
