// eslint-disable-next-line import/no-extraneous-dependencies
const defaultConfig = require('./jest.config.js');

module.exports = {
  ...defaultConfig,
  reporters: [
    'default',
    'github-actions'
  ],
};
