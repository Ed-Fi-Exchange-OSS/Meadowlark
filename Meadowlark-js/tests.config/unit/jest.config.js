// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./jest.config.js');

module.exports = {
  name: 'unit',
  displayName: 'Unit Tests',
  ...defaultConfig,
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: "integration|e2e",
  collectCoverageFrom: ['packages/**/src/**/*.ts', 'backends/**/src/**/*.ts', 'services/**/src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 52,
      functions: 58,
      lines: 60,
      statements: 60,
    },
  },
}
