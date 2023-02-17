// eslint-disable-next-line import/no-extraneous-dependencies
const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  transform: tsjPreset.transform,
  preset: '@shelf/jest-mongodb',
  transformIgnorePatterns: ['<rootDir>.*(node_modules)(?!.*meadowlark-.*).*$'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  modulePathIgnorePatterns: ['dist*', 'docs*'],
  watchPathIgnorePatterns: ['globalConfig'], // jest-mongodb setup
  setupFiles: ['dotenv/config'],
  reporters: [
    'default',
    'github-actions'
  ],
};
