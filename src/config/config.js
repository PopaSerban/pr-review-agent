const path = require('path');

if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });
} else {
  require('dotenv').config();
}

const config = {
  github: {
    token: process.env.GITHUB_TOKEN,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    watchedRepos: process.env.WATCHED_REPOS || ''
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.GPT_MODEL || 'gpt-4'
  },
  learning: {
    enabled: process.env.ENABLE_LEARNING === 'true',
    knowledgeDir: process.env.KNOWLEDGE_DIR || './knowledge'
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config;
