const rootDir = '../../../../../';
// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require(`${rootDir}/tests/config/jest.config`);

module.exports = {
  displayName: 'Integration Tests: meadowlark-core',
  ...defaultConfig,
  testMatch: ['**/meadowlark-core/test/integration/**/*.(spec|test).[jt]s?(x)'],
  watchPathIgnorePatterns: ['globalConfig'], // jest-mongodb setup
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
