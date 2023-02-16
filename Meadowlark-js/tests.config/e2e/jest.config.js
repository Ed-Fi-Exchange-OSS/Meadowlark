// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./../jest.config.js');

module.exports = {
  displayName: "E2E Tests",
  ...defaultConfig,
  rootDir: '../..',
  testMatch: ['<rootDir>/**/e2e/**/*.(spec|test).[jt]s?(x)'],
  reporters: [
    'default',
    'github-actions'
  ],
  globalSetup: './tests/e2e/management/Setup.ts',
  globalTeardown: './tests/e2e/management/Teardown.ts',
  collectCoverageFrom: ['packages/**/src/**/*.ts', 'backends/**/src/**/*.ts', 'services/**/src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 52,
      functions: 58,
      lines: 60,
      statements: 60,
    },
  }
}
