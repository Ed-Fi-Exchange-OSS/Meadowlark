// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('../../../../../tests/config/jest.config');

module.exports = {
  displayName: 'Integration Tests: Mongodb ',
  ...defaultConfig,
  preset: '@shelf/jest-mongodb',
  testMatch: ['**/meadowlark-mongodb-backend/test/integration/**/*.(spec|test).[jt]s?(x)'],
  watchPathIgnorePatterns: ['globalConfig'], // jest-mongodb setup
  coverageThreshold: {
    global: {
      branches: 52,
      functions: 58,
      lines: 60,
      statements: 60,
    },
  },
  workerIdleMemoryLimit: '200MB',
};
