const redis = require('redis');
const PREFIX = process.env.DB_NAME + '_' + process.env.NODE_ENV + ':';
let client = redis.createClient({ prefix: PREFIX, host: process.env.REDIS_HOST });
const { promisify } = require('util');
const createAsyncFor = ['get', 'set', 'keys', 'del'];

createAsyncFor.forEach(method => {
  client[`${method}Async`] = promisify(client[method]).bind(client)
});

client.prefix = PREFIX;

module.exports = client;
