const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  displayName: "e2e",
  transform: tsjPreset.transform,
  transformIgnorePatterns: ['<rootDir>.*(node_modules)(?!.*meadowlark-.*).*$'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  reporters: [
    'default',
    'github-actions'
  ],
  modulePathIgnorePatterns: ['dist*', 'docs*'],
  globalSetup: './tests/e2e/setup/Setup.ts',
  globalTeardown: './tests/e2e/setup/Teardown.ts',
  setupFiles: ['dotenv/config']
}
