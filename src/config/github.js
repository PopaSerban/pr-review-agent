const axios = require('axios');
const config = require('./index');
const logger = require('../utils/logger');
const { GitHubApiError } = require('../utils/errors');

const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${config.github.token}`,
    'User-Agent': 'PR-Review-Agent'
  },
  timeout: 30000
});

githubClient.interceptors.response.use(
  (response) => {
    const remaining = response.headers['x-ratelimit-remaining'];
    const limit = response.headers['x-ratelimit-limit'];
    
    if (remaining && limit) {
      logger.debug(`GitHub API rate limit: ${remaining}/${limit} remaining`);
      
      if (parseInt(remaining) < 100) {
        logger.warn(`GitHub API rate limit running low: ${remaining}/${limit}`);
      }
    }
    
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const resetDate = new Date(resetTime * 1000);
        throw new GitHubApiError(
          `GitHub API rate limit exceeded. Resets at ${resetDate.toISOString()}`,
          429
        );
      }
      
      if (status === 401) {
        throw new GitHubApiError('GitHub authentication failed. Check your token.', 401);
      }
      
      if (status === 404) {
        throw new GitHubApiError('GitHub resource not found', 404);
      }
      
      const message = data.message || 'GitHub API error';
      throw new GitHubApiError(message, status);
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new GitHubApiError('GitHub API request timeout', 504);
    }
    
    throw new GitHubApiError('GitHub API request failed', 500);
  }
);

module.exports = githubClient;
