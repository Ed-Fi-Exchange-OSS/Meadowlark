// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./../jest.config.js');

module.exports = {
  displayName: 'Unit Tests',
  ...defaultConfig,
  testMatch: ['<rootDir>/**/*.(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ["integration|e2e"],
}
