const rootDir = '../../../../../';
// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require(`${rootDir}/tests/config/jest.config`);

module.exports = {
  displayName: 'Integration Tests: Postgresql',
  ...defaultConfig,
  globalSetup: '<rootDir>/backends/meadowlark-postgresql-backend/test/setup/Setup.ts',
  globalTeardown: '<rootDir>/backends/meadowlark-postgresql-backend/test/setup/Teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/backends/meadowlark-postgresql-backend/test/setup/Global.ts'],
  testMatch: ['**/meadowlark-postgresql-backend/test/integration/**/*.(spec|test).[jt]s?(x)'],
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
