module.exports = {
  projects: [
    '<rootDir>/tests/config/unit/jest.config.js',
    '<rootDir>/tests/config/e2e/jest.config.js',
    '<rootDir>/backends/meadowlark-mongodb-backend/test/config/integration/jest.config.js',
    '<rootDir>/backends/meadowlark-opensearch-backend/test/config/integration/jest.config.js',
    '<rootDir>/backends/meadowlark-postgresql-backend/test/config/integration/jest.config.js',
  ],
  coverageThreshold: {
    global: {
      branches: 52,
      functions: 58,
      lines: 60,
      statements: 60,
    },
  },
  reporters: ['default', 'github-actions'],
  collectCoverageFrom: ['packages/**/src/**/*.ts', 'backends/**/src/**/*.ts', 'services/**/src/**/*.ts'],
  workerIdleMemoryLimit: '200MB',
};
