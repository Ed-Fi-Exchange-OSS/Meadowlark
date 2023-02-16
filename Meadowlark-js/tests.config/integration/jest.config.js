// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./jest.config.js');

module.exports = {
  name: 'integration',
  displayName: 'Integration Tests',
  ...defaultConfig,
  transform: tsjPreset.transform,
  preset: '@shelf/jest-mongodb',
  watchPathIgnorePatterns: ['globalConfig'], // jest-mongodb setup
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/integration/**/?(*.)+(spec|test).ts?(x)'],
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
