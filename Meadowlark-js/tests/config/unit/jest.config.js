// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./../jest.config.js');

module.exports = {
  displayName: 'Unit Tests',
  ...defaultConfig,
  testMatch: ['<rootDir>/**/*.(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ["integration|e2e|profiling|kafka"],
  coverageThreshold: {
    global: {
      branches: 52,
      functions: 58,
      lines: 60,
      statements: 60,
    },
  },
  workerIdleMemoryLimit: '200MB',
}
