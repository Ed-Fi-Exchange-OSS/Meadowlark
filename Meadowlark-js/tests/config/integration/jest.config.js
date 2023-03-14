// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./../jest.config.js');

module.exports = {
  displayName: 'Integration Tests',
  ...defaultConfig,
  projects: [
    '<rootDir>/backends/meadowlark-opensearch-backend/test/jest.config.js',
  ],
  preset: '@shelf/jest-mongodb',
  testMatch: ['<rootDir>/**/integration/**/*.(spec|test).[jt]s?(x)'],
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
