// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./../../../tests/config/jest.config');

module.exports = {
  displayName: 'OpenSearch Tests',
  ...defaultConfig,
  globalSetup: './setup/OpenSearchSetup.ts',
  globalTeardown: './setup/OpenSearchTeardown.ts',
  rootDir: './',
  workerIdleMemoryLimit: '200MB',
}
