const request = require('supertest');
const crypto = require('crypto');
const app = require('../../src/app');

describe('Webhook Routes', () => {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'test_secret_123';

  function signPayload(payload) {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    return 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
  }

  describe('POST /api/webhook', () => {
    it('should accept valid PR webhook', async () => {
      const payload = {
        action: 'opened',
        pull_request: {
          number: 1,
          title: 'Test PR',
          body: 'Test description',
          user: { login: 'testuser' },
          head: { sha: 'abc123', ref: 'feature' },
          base: { ref: 'main' }
        },
        repository: {
          owner: { login: 'testowner' },
          name: 'testrepo',
          full_name: 'testowner/testrepo'
        }
      };

      const signature = signPayload(payload);

      const response = await request(app)
        .post('/api/webhook')
        .set('x-hub-signature-256', signature)
        .set('x-github-event', 'pull_request')
        .send(payload)
        .expect(200);

      expect(response.body.message).toContain('queued for processing');
      expect(response.body.prNumber).toBe(1);
    });

    it('should reject webhook without signature', async () => {
      const payload = {
        action: 'opened',
        pull_request: { number: 1 }
      };

      await request(app)
        .post('/api/webhook')
        .set('x-github-event', 'pull_request')
        .send(payload)
        .expect(401);
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = {
        action: 'opened',
        pull_request: { number: 1 }
      };

      await request(app)
        .post('/api/webhook')
        .set('x-hub-signature-256', 'sha256=invalid')
        .set('x-github-event', 'pull_request')
        .send(payload)
        .expect(401);
    });

    it('should ignore non-PR events', async () => {
      const payload = { action: 'created' };
      const signature = signPayload(payload);

      const response = await request(app)
        .post('/api/webhook')
        .set('x-hub-signature-256', signature)
        .set('x-github-event', 'push')
        .send(payload)
        .expect(200);

      expect(response.body.message).toBe('Event ignored');
    });

    it('should ignore invalid PR actions', async () => {
      const payload = {
        action: 'closed',
        repository: { full_name: 'testowner/testrepo' }
      };
      const signature = signPayload(payload);

      const response = await request(app)
        .post('/api/webhook')
        .set('x-hub-signature-256', signature)
        .set('x-github-event', 'pull_request')
        .send(payload)
        .expect(200);

      expect(response.body.message).toBe('Action ignored');
    });

    it('should handle synchronize action', async () => {
      const payload = {
        action: 'synchronize',
        pull_request: {
          number: 2,
          title: 'Updated PR',
          body: 'Updated',
          user: { login: 'testuser' },
          head: { sha: 'def456', ref: 'feature' },
          base: { ref: 'main' }
        },
        repository: {
          owner: { login: 'testowner' },
          name: 'testrepo',
          full_name: 'testowner/testrepo'
        }
      };

      const signature = signPayload(payload);

      const response = await request(app)
        .post('/api/webhook')
        .set('x-hub-signature-256', signature)
        .set('x-github-event', 'pull_request')
        .send(payload)
        .expect(200);

      expect(response.body.prNumber).toBe(2);
    });
  });
});
