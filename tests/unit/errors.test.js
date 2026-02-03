const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  GitHubApiError,
  OpenAIError
} = require('../../src/utils/errors');

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with message and status code', () => {
      const error = new AppError('Test error', 500);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Test error', 500);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create a 400 error', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error with default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create a 404 error with custom message', () => {
      const error = new NotFoundError('User not found');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a 403 error', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });
  });

  describe('GitHubApiError', () => {
    it('should create a GitHub API error with custom status', () => {
      const error = new GitHubApiError('API rate limit exceeded', 429);
      expect(error.message).toBe('API rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('GitHubApiError');
    });

    it('should default to 500 status code', () => {
      const error = new GitHubApiError('GitHub API error');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('OpenAIError', () => {
    it('should create an OpenAI error', () => {
      const error = new OpenAIError('OpenAI API error', 503);
      expect(error.message).toBe('OpenAI API error');
      expect(error.statusCode).toBe(503);
      expect(error.name).toBe('OpenAIError');
    });
  });
});
