// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('../jest.config.js');

module.exports = {
  displayName: 'E2E Tests',
  ...defaultConfig,
  testMatch: ['<rootDir>/**/e2e/**/*.(spec|test).[jt]s?(x)'],
  globalSetup: './tests/e2e/setup/SetupTestEnvironment.ts',
  globalTeardown: './tests/e2e/setup/TeardownTestEnvironment.ts',
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
