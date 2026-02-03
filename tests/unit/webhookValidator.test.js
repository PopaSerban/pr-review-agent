const crypto = require('crypto');

jest.mock('../../src/config', () => ({
  github: {
    webhookSecret: 'test-secret',
    watchedRepos: ['owner/repo1', 'owner/repo2']
  },
  server: {
    nodeEnv: 'test',
    logLevel: 'error'
  }
}));

const { verifyWebhookSignature, validatePullRequestEvent } = require('../../src/middleware/webhookValidator');
const { UnauthorizedError } = require('../../src/utils/errors');

describe('Webhook Validator', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = { test: 'data' };
      req.body = payload;
      req.headers['x-github-event'] = 'pull_request';

      const hmac = crypto.createHmac('sha256', 'test-secret');
      const signature = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
      req.headers['x-hub-signature-256'] = signature;

      verifyWebhookSignature(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.githubEvent).toBe('pull_request');
    });

    it('should reject webhook without signature', () => {
      req.headers['x-github-event'] = 'pull_request';

      expect(() => verifyWebhookSignature(req, res, next)).toThrow(UnauthorizedError);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject webhook without event type', () => {
      req.headers['x-hub-signature-256'] = 'sha256=test';

      expect(() => verifyWebhookSignature(req, res, next)).toThrow(UnauthorizedError);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid signature', () => {
      req.body = { test: 'data' };
      req.headers['x-github-event'] = 'pull_request';
      req.headers['x-hub-signature-256'] = 'sha256=invalid';

      expect(() => verifyWebhookSignature(req, res, next)).toThrow(UnauthorizedError);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject signature with wrong length', () => {
      req.body = { test: 'data' };
      req.headers['x-github-event'] = 'pull_request';
      req.headers['x-hub-signature-256'] = 'sha256=short';

      expect(() => verifyWebhookSignature(req, res, next)).toThrow(UnauthorizedError);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validatePullRequestEvent', () => {
    beforeEach(() => {
      req.githubEvent = 'pull_request';
    });

    it('should accept valid PR opened event', () => {
      req.body = {
        action: 'opened',
        repository: { full_name: 'owner/repo1' }
      };

      validatePullRequestEvent(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept synchronize action', () => {
      req.body = {
        action: 'synchronize',
        repository: { full_name: 'owner/repo2' }
      };

      validatePullRequestEvent(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should accept reopened action', () => {
      req.body = {
        action: 'reopened',
        repository: { full_name: 'owner/repo1' }
      };

      validatePullRequestEvent(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should ignore non-PR events', () => {
      req.githubEvent = 'push';
      req.body = { action: 'opened' };

      validatePullRequestEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Event ignored' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should ignore invalid PR actions', () => {
      req.body = {
        action: 'closed',
        repository: { full_name: 'owner/repo1' }
      };

      validatePullRequestEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Action ignored' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should ignore unwatched repositories', () => {
      req.body = {
        action: 'opened',
        repository: { full_name: 'other/repo' }
      };

      validatePullRequestEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Repository not watched' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
