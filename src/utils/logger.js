const winston = require('winston');
const config = require('../config');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(logColors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: consoleFormat
  })
];

if (config.server.nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat
    })
  );
}

const logger = winston.createLogger({
  level: config.server.logLevel,
  levels: logLevels,
  transports,
  exitOnError: false
});

module.exports = logger;
