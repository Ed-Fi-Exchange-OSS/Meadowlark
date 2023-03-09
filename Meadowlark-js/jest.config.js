const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  projects: [
    '<rootDir>/tests/config/unit/jest.config.js',
    '<rootDir>/tests/config/integration/jest.config.js',
    '<rootDir>/tests/config/e2e/jest.config.js',
  ],
  workerIdleMemoryLimit: '200MB',
};
