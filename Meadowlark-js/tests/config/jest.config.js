module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['dist*', 'docs*'],
  setupFiles: ['dotenv/config'],
  rootDir: '../../..',
};
