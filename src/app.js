// Main application entry point

const express = require('express');
const config = require('./config');
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

const PORT = config.server.port;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PR Review Agent running on port ${PORT}`);
    console.log(`Environment: ${config.server.nodeEnv}`);
    console.log(`Watching ${config.github.watchedRepos.length} repositories`);
  });
}

module.exports = app;
