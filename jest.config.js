module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@op-engineering/op-sqlite|react-native-get-sms-android|@react-navigation|react-native-gifted-charts|react-native-svg|react-native-linear-gradient|react-native-safe-area-context|react-native-screens|react-native|@react-native|@react-native-community|@react-native/js-polyfills|@react-native/normalize-colors)/)',
  ],
};
