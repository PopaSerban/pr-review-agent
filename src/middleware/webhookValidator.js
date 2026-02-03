const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');

function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];

  if (!signature) {
    logger.warn('Webhook received without signature');
    throw new UnauthorizedError('Missing webhook signature');
  }

  if (!event) {
    logger.warn('Webhook received without event type');
    throw new UnauthorizedError('Missing event type');
  }

  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', config.github.webhookSecret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (signatureBuffer.length !== digestBuffer.length) {
    logger.warn('Webhook signature length mismatch');
    throw new UnauthorizedError('Invalid webhook signature');
  }

  const isValid = crypto.timingSafeEqual(signatureBuffer, digestBuffer);

  if (!isValid) {
    logger.warn('Webhook signature verification failed');
    throw new UnauthorizedError('Invalid webhook signature');
  }

  logger.debug(`Webhook signature verified for event: ${event}`);
  req.githubEvent = event;
  next();
}

function validatePullRequestEvent(req, res, next) {
  const event = req.githubEvent;

  if (event !== 'pull_request') {
    logger.debug(`Ignoring non-PR event: ${event}`);
    return res.status(200).json({ message: 'Event ignored' });
  }

  const action = req.body.action;
  const validActions = ['opened', 'synchronize', 'reopened'];

  if (!validActions.includes(action)) {
    logger.debug(`Ignoring PR action: ${action}`);
    return res.status(200).json({ message: 'Action ignored' });
  }

  const repository = req.body.repository?.full_name;
  const watchedRepos = config.github.watchedRepos;

  if (!watchedRepos.includes(repository)) {
    logger.debug(`Ignoring PR from unwatched repo: ${repository}`);
    return res.status(200).json({ message: 'Repository not watched' });
  }

  logger.info(`Valid PR event: ${action} on ${repository}`);
  next();
}

module.exports = {
  verifyWebhookSignature,
  validatePullRequestEvent
};
