// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./../jest.config.js');
const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  displayName: 'Integration Tests',
  ...defaultConfig,
  preset: '@shelf/jest-mongodb',
  testMatch: ['<rootDir>/**/integration/**/*.(spec|test).[jt]s?(x)'],
}
