const githubClient = require('../config/github');
const logger = require('../utils/logger');

class GitHubService {
  async getPullRequest(owner, repo, pullNumber) {
    logger.info(`Fetching PR #${pullNumber} from ${owner}/${repo}`);
    
    const response = await githubClient.get(
      `/repos/${owner}/${repo}/pulls/${pullNumber}`
    );
    
    return response.data;
  }

  async getPullRequestFiles(owner, repo, pullNumber) {
    logger.info(`Fetching files for PR #${pullNumber} from ${owner}/${repo}`);
    
    const response = await githubClient.get(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/files`
    );
    
    return response.data;
  }

  async getPullRequestDiff(owner, repo, pullNumber) {
    logger.info(`Fetching diff for PR #${pullNumber} from ${owner}/${repo}`);
    
    const response = await githubClient.get(
      `/repos/${owner}/${repo}/pulls/${pullNumber}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3.diff'
        }
      }
    );
    
    return response.data;
  }

  async createReview(owner, repo, pullNumber, reviewData) {
    logger.info(`Creating review for PR #${pullNumber} in ${owner}/${repo}`);
    
    const response = await githubClient.post(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
      reviewData
    );
    
    return response.data;
  }

  async addReviewComment(owner, repo, pullNumber, commentData) {
    logger.info(`Adding comment to PR #${pullNumber} in ${owner}/${repo}`);
    
    const response = await githubClient.post(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/comments`,
      commentData
    );
    
    return response.data;
  }

  async requestReviewers(owner, repo, pullNumber, reviewers) {
    logger.info(`Requesting reviewers for PR #${pullNumber} in ${owner}/${repo}`);
    
    const response = await githubClient.post(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/requested_reviewers`,
      { reviewers }
    );
    
    return response.data;
  }

  async getAuthenticatedUser() {
    logger.info('Fetching authenticated user info');
    
    const response = await githubClient.get('/user');
    
    return response.data;
  }

  async checkRepoAccess(owner, repo) {
    logger.info(`Checking access to ${owner}/${repo}`);
    
    try {
      const response = await githubClient.get(`/repos/${owner}/${repo}`);
      return { hasAccess: true, repo: response.data };
    } catch (error) {
      return { hasAccess: false, error: error.message };
    }
  }
}

module.exports = new GitHubService();
