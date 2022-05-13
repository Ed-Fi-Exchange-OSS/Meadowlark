module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: '4.0.28',
      skipMD5: true,
    },
    autoStart: false,
    instance: {},
    replSet: {
      count: 3,
      storageEngine: 'wiredTiger',
    },
  },
  useSharedDBForAllJestWorkers: true,
};
