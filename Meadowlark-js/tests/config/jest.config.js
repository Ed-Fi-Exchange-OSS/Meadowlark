module.exports = {
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  modulePathIgnorePatterns: ['dist*', 'docs*'],
  setupFiles: ['dotenv/config'],
  rootDir: '../../..',
};
