module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@op-engineering/op-sqlite': '<rootDir>/__mocks__/op-sqlite.js',
    'react-native-get-sms-android': '<rootDir>/__mocks__/react-native-get-sms-android.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@op-engineering/op-sqlite|react-native-get-sms-android|@react-navigation|react-native-gifted-charts|react-native-svg|react-native-linear-gradient|react-native-safe-area-context|react-native-screens)/)',
  ],
};
