module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  transformIgnorePatterns: ['<rootDir>.*(node_modules)(?!.*meadowlark-.*).*$'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
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
};
