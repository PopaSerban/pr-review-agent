const config = require('./config');

function parseWatchedRepos(reposString) {
  if (!reposString || reposString.trim() === '') {
    return [];
  }

  return reposString
    .split(',')
    .map(repo => repo.trim())
    .filter(repo => repo.length > 0);
}

function validateRepoFormat(repo) {
  const repoPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
  return repoPattern.test(repo);
}

function validateConfig() {
  const errors = [];

  if (!config.github.token) {
    errors.push('GITHUB_TOKEN is required');
  }

  if (!config.github.webhookSecret) {
    errors.push('GITHUB_WEBHOOK_SECRET is required');
  }

  const watchedRepos = parseWatchedRepos(config.github.watchedRepos);
  if (watchedRepos.length === 0) {
    errors.push('WATCHED_REPOS is required (format: owner/repo,owner/repo2)');
  }

  watchedRepos.forEach(repo => {
    if (!validateRepoFormat(repo)) {
      errors.push(`Invalid repo format: ${repo} (expected: owner/repo)`);
    }
  });

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return {
    ...config,
    github: {
      ...config.github,
      watchedRepos: watchedRepos
    }
  };
}

module.exports = {
  validateConfig,
  parseWatchedRepos,
  validateRepoFormat
};
