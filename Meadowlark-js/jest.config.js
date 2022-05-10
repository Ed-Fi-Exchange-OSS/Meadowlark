const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  transform: tsjPreset.transform,
  testEnvironment: 'node',
  preset: '@shelf/jest-mongodb',
  transformIgnorePatterns: ['<rootDir>.*(node_modules)(?!.*meadowlark-.*).*$'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: ['packages/**/src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
  modulePathIgnorePatterns: ['dist*', 'docs*'],
  watchPathIgnorePatterns: ['globalConfig'], // jest-mongodb setup
};
