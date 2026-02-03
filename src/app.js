// Main application entry point

const express = require('express');
const config = require('./config');
const routes = require('./routes');
const requestLogger = require('./middleware/logger');
const logger = require('./utils/logger');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use('/api', routes);

const PORT = config.server.port;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`PR Review Agent running on port ${PORT}`);
    logger.info(`Environment: ${config.server.nodeEnv}`);
    logger.info(`Watching ${config.github.watchedRepos.length} repositories`);
  });
}

module.exports = app;
