const { configBuilder } = require('@8base/webpack-configuration');

const LIBRARY_NAME = 'api-client';

module.exports = configBuilder(__dirname, LIBRARY_NAME);
