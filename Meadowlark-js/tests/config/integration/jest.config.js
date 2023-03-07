// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./../jest.config.js');
const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  displayName: 'Integration Tests',
  ...defaultConfig,
  transform: tsjPreset.transform,
  preset: '@shelf/jest-mongodb',
  watchPathIgnorePatterns: ['globalConfig'], // jest-mongodb setup
  testMatch: ['<rootDir>/**/integration/**/*.(spec|test).[jt]s?(x)'],
  collectCoverageFrom: ['<rootDir>/packages/**/src/**/*.ts', '<rootDir>/backends/**/src/**/*.ts', '<rootDir>/services/**/src/**/*.ts'],
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
