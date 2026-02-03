const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    error = new AppError(message, statusCode);
  }

  logger.error(`${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (error.stack && process.env.NODE_ENV !== 'production') {
    logger.error(error.stack);
  }

  res.status(error.statusCode).json({
    error: {
      message: error.message,
      statusCode: error.statusCode,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    }
  });
}

function notFoundHandler(req, res, next) {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
}

module.exports = {
  errorHandler,
  notFoundHandler
};
