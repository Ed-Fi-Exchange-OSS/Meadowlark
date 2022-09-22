const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  transform: tsjPreset.transform,
  testEnvironment: 'node',
  preset: '@shelf/jest-mongodb',
  transformIgnorePatterns: ['<rootDir>.*(node_modules)(?!.*meadowlark-.*).*$'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: ['packages/**/src/**/*.ts', 'backends/**/src/**/*.ts', 'services/**/src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 52,
      functions: 58,
      lines: 60,
      statements: 60,
    },
  },
  modulePathIgnorePatterns: ['dist*', 'docs*'],
  watchPathIgnorePatterns: ['globalConfig'], // jest-mongodb setup
  setupFiles: ['dotenv/config'],
};
