// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('../../../../../tests/config/jest.config');

module.exports = {
  displayName: 'Integration Tests: Postgresql',
  ...defaultConfig,
  testMatch: ['**/meadowlark-postgresql-backend/test/integration/**/*.(spec|test).[jt]s?(x)'],
  coverageThreshold: {
    global: {
      branches: 52,
      functions: 58,
      lines: 60,
      statements: 60,
    },
  },
  rootDir: '../../../../../',
  workerIdleMemoryLimit: '200MB',
};
