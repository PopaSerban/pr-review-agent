const webhookController = require('../../src/controllers/webhookController');

describe('WebhookController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        action: 'opened',
        pull_request: {
          number: 123,
          title: 'Test PR',
          body: 'Test description',
          user: { login: 'testuser' },
          head: { sha: 'abc123', ref: 'feature-branch' },
          base: { ref: 'main' }
        },
        repository: {
          owner: { login: 'testowner' },
          name: 'testrepo',
          full_name: 'testowner/testrepo'
        }
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('handlePullRequest', () => {
    it('should process valid PR webhook', async () => {
      await webhookController.handlePullRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Webhook received and queued for processing',
        prNumber: 123,
        repository: 'testowner/testrepo'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should extract correct PR data', async () => {
      await webhookController.handlePullRequest(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prNumber: 123,
          repository: 'testowner/testrepo'
        })
      );
    });

    it('should handle synchronize action', async () => {
      req.body.action = 'synchronize';

      await webhookController.handlePullRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle reopened action', async () => {
      req.body.action = 'reopened';

      await webhookController.handlePullRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      req.body = {};

      await webhookController.handlePullRequest(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle missing pull_request data', async () => {
      req.body.pull_request = null;

      await webhookController.handlePullRequest(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
