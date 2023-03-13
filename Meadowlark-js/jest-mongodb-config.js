module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: '4.4.0',
      skipMD5: true,
    },
    autoStart: false,
    instance: { dbName: 'meadowlark' },
    replSet: {
      count: 3,
      storageEngine: 'wiredTiger',
    },
  },
  useSharedDBForAllJestWorkers: true,
};
