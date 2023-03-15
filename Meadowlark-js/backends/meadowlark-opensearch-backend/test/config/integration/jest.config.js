// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('../../../../../tests/config/jest.config');

module.exports = {
  displayName: 'Integration Tests: OpenSearch',
  globalSetup: './test/setup/Setup.ts',
  globalTeardown: './test/setup/Teardown.ts',
  ...defaultConfig,
  testMatch: ['**/meadowlark-opensearch-backend/test/integration/**/*.(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [],
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
