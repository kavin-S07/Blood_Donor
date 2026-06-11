const morgan = require('morgan');

const logger = morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
);

module.exports = logger;
