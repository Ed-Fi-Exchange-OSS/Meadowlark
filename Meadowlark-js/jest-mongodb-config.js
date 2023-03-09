module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: '4.4.0',
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
