// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./jest.config.js');
const { resolve } = require('path');
const root = resolve(__dirname, '../..');

module.exports = {
  displayName: "e2e",
  ...defaultConfig,
	rootDir: root,
	setupFiles: ['dotenv/config', './tests/e2e/Setup.ts']
}
