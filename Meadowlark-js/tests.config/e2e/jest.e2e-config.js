const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  name: "e2e",
  displayName: "E2E Tests",
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
