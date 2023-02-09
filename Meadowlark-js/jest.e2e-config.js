// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./jest.config.js');

module.exports = {
  displayName: "e2e",
  ...defaultConfig,
  reporters: [
    'default',
    'github-actions'
  ],
  globalSetup: './tests/e2e/management/Setup.ts',
  globalTeardown: './tests/e2e/management/Teardown.ts'
}
