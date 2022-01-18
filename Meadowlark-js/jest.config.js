module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  transformIgnorePatterns: ['<rootDir>.*(node_modules)(?!.*metaed-.*).*$'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['js', 'ts'],
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
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  testTimeout: 6000,
};
