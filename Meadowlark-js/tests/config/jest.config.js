module.exports = {
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  modulePathIgnorePatterns: ['dist*', 'docs*'],
  setupFiles: ['dotenv/config'],
  rootDir: '../../..',
};
