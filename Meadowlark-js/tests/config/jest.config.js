const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  transform: tsjPreset.transform,
  transformIgnorePatterns: ['<rootDir>.*(node_modules)(?!.*meadowlark-.*).*$'],
  modulePathIgnorePatterns: ['dist*', 'docs*'],
  setupFiles: ['dotenv/config'],
  rootDir: '../../..',
};
