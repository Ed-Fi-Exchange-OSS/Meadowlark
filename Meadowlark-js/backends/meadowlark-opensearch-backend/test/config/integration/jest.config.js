const rootDir = '../../../../../';
// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require(`${rootDir}/tests/config/jest.config`);

module.exports = {
  displayName: 'Integration Tests: OpenSearch',
  globalSetup: '<rootDir>/backends/meadowlark-opensearch-backend/test/setup/Setup.ts',
  globalTeardown: '<rootDir>/backends/meadowlark-opensearch-backend/test/setup/Teardown.ts',
  ...defaultConfig,
  testMatch: ['**/meadowlark-opensearch-backend/test/integration/**/*.(spec|test).[jt]s?(x)'],
  coverageThreshold: {
    global: {
      branches: 52,
      functions: 58,
      lines: 60,
      statements: 60,
    },
  },
  rootDir,
  workerIdleMemoryLimit: '200MB',
};
