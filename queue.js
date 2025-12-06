// queue.js
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL);

const filaCartoes = new Queue('cartoes', { connection });

module.exports = filaCartoes;
