const logger = require('../utils/logger');
const reviewService = require('../services/reviewService');

class WebhookController {
  async handlePullRequest(req, res, next) {
    try {
      const { action, pull_request, repository } = req.body;
      
      logger.info(`Processing PR #${pull_request.number}: ${action} in ${repository.full_name}`);
      
      const owner = repository.owner.login;
      const repo = repository.name;
      const pullNumber = pull_request.number;

      res.status(200).json({
        message: 'Webhook received and queued for processing',
        prNumber: pullNumber,
        repository: repository.full_name
      });

      setImmediate(async () => {
        try {
          const result = await reviewService.processPullRequest(owner, repo, pullNumber);
          logger.info(`Successfully processed PR #${pullNumber}: ${result.analysis.complexity} complexity`);
        } catch (error) {
          logger.error(`Failed to process PR #${pullNumber}: ${error.message}`);
        }
      });

    } catch (error) {
      logger.error(`Error processing webhook: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new WebhookController();
