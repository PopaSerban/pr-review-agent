const request = require('supertest');
const express = require('express');
const { errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');
const { ValidationError, NotFoundError } = require('../../src/utils/errors');

describe('Error Handler Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('errorHandler', () => {
    it('should handle AppError instances', async () => {
      app.get('/test', (req, res, next) => {
        next(new ValidationError('Invalid data'));
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/test')
        .expect(400);

      expect(response.body.error.message).toBe('Invalid data');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should handle generic errors', async () => {
      app.get('/test', (req, res, next) => {
        next(new Error('Something went wrong'));
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/test')
        .expect(500);

      expect(response.body.error.message).toBe('Something went wrong');
    });

    it('should include stack trace in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      app.get('/test', (req, res, next) => {
        next(new Error('Test error'));
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/test')
        .expect(500);

      expect(response.body.error.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.get('/test', (req, res, next) => {
        next(new Error('Test error'));
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/test')
        .expect(500);

      expect(response.body.error.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler', () => {
    it('should handle 404 errors for unknown routes', async () => {
      app.use(notFoundHandler);
      app.use(errorHandler);

      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body.error.message).toContain('Route not found');
      expect(response.body.error.message).toContain('/unknown-route');
    });
  });
});
