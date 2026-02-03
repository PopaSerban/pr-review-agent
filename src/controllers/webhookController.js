const logger = require('../utils/logger');

class WebhookController {
  async handlePullRequest(req, res, next) {
    try {
      const { action, pull_request, repository } = req.body;
      
      logger.info(`Processing PR #${pull_request.number}: ${action} in ${repository.full_name}`);
      
      const prData = {
        number: pull_request.number,
        title: pull_request.title,
        body: pull_request.body,
        author: pull_request.user.login,
        headSha: pull_request.head.sha,
        baseBranch: pull_request.base.ref,
        headBranch: pull_request.head.ref,
        repository: {
          owner: repository.owner.login,
          name: repository.name,
          fullName: repository.full_name
        }
      };

      logger.debug(`PR Data: ${JSON.stringify(prData, null, 2)}`);

      res.status(200).json({
        message: 'Webhook received and queued for processing',
        prNumber: prData.number,
        repository: prData.repository.fullName
      });

      logger.info(`Successfully queued PR #${prData.number} for review`);
    } catch (error) {
      logger.error(`Error processing webhook: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new WebhookController();
