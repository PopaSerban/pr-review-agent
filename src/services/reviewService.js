const githubService = require('./githubService');
const logger = require('../utils/logger');
const Review = require('../models/Review');

class ReviewService {
  async fetchPullRequestData(owner, repo, pullNumber) {
    logger.info(`Fetching complete PR data for #${pullNumber} in ${owner}/${repo}`);

    try {
      const [pullRequest, files, diff] = await Promise.all([
        githubService.getPullRequest(owner, repo, pullNumber),
        githubService.getPullRequestFiles(owner, repo, pullNumber),
        githubService.getPullRequestDiff(owner, repo, pullNumber)
      ]);

      const prData = {
        number: pullRequest.number,
        title: pullRequest.title,
        body: pullRequest.body || '',
        author: pullRequest.user.login,
        state: pullRequest.state,
        headSha: pullRequest.head.sha,
        baseBranch: pullRequest.base.ref,
        headBranch: pullRequest.head.ref,
        createdAt: pullRequest.created_at,
        updatedAt: pullRequest.updated_at,
        files: files.map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch || ''
        })),
        diff: diff,
        stats: {
          totalFiles: files.length,
          totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
          totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
          totalChanges: files.reduce((sum, f) => sum + f.changes, 0)
        }
      };

      logger.info(`Fetched PR data: ${prData.stats.totalFiles} files, ${prData.stats.totalChanges} changes`);

      return prData;
    } catch (error) {
      logger.error(`Failed to fetch PR data: ${error.message}`);
      throw error;
    }
  }

  async analyzePullRequest(prData) {
    logger.info(`Analyzing PR #${prData.number}`);

    const analysis = {
      hasLargeFiles: prData.files.some(f => f.changes > 500),
      hasMultipleFiles: prData.files.length > 5,
      hasManyChanges: prData.stats.totalChanges > 1000,
      fileTypes: this.getFileTypes(prData.files),
      complexity: this.calculateComplexity(prData)
    };

    logger.debug(`PR Analysis: ${JSON.stringify(analysis, null, 2)}`);

    return analysis;
  }

  getFileTypes(files) {
    const types = new Set();
    files.forEach(file => {
      const ext = file.filename.split('.').pop();
      if (ext) types.add(ext);
    });
    return Array.from(types);
  }

  calculateComplexity(prData) {
    const { totalFiles, totalChanges } = prData.stats;
    
    if (totalChanges > 1000 || totalFiles > 20) {
      return 'high';
    } else if (totalChanges > 300 || totalFiles > 10) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  async postReview(owner, repo, pullNumber, review) {
    logger.info(`Posting review to PR #${pullNumber} in ${owner}/${repo}`);

    try {
      const reviewData = review.toGitHubReview();
      const result = await githubService.createReview(owner, repo, pullNumber, reviewData);
      
      logger.info(`Successfully posted review to PR #${pullNumber}`);
      return result;
    } catch (error) {
      logger.error(`Failed to post review: ${error.message}`);
      throw error;
    }
  }

  async processPullRequest(owner, repo, pullNumber) {
    logger.info(`Processing PR #${pullNumber} in ${owner}/${repo}`);

    const prData = await this.fetchPullRequestData(owner, repo, pullNumber);
    const analysis = await this.analyzePullRequest(prData);
    
    const review = new Review(prData, analysis);
    await this.postReview(owner, repo, pullNumber, review);

    return {
      prData,
      analysis,
      review
    };
  }
}

module.exports = new ReviewService();
