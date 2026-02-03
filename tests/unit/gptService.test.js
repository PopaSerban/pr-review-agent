const { OpenAIError } = require('../../src/utils/errors');

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }));
});

const gptService = require('../../src/services/gptService');

describe('GPTService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCompletion', () => {
    it('should generate completion successfully', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: { content: 'Test response' }
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      });

      const messages = [{ role: 'user', content: 'Test prompt' }];
      const result = await gptService.generateCompletion(messages);

      expect(result.content).toBe('Test response');
      expect(result.usage.total_tokens).toBe(15);
    });

    it('should handle rate limit errors', async () => {
      const error = new Error('Rate limit exceeded');
      error.status = 429;
      mockCreate.mockRejectedValue(error);

      const messages = [{ role: 'user', content: 'Test' }];

      await expect(
        gptService.generateCompletion(messages)
      ).rejects.toThrow(OpenAIError);
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Invalid API key');
      error.status = 401;
      mockCreate.mockRejectedValue(error);

      const messages = [{ role: 'user', content: 'Test' }];

      await expect(
        gptService.generateCompletion(messages)
      ).rejects.toThrow('OpenAI authentication failed');
    });

    it('should handle bad request errors', async () => {
      const error = new Error('Invalid request');
      error.status = 400;
      mockCreate.mockRejectedValue(error);

      const messages = [{ role: 'user', content: 'Test' }];

      await expect(
        gptService.generateCompletion(messages)
      ).rejects.toThrow(OpenAIError);
    });

    it('should use custom options', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
      });

      const messages = [{ role: 'user', content: 'Test' }];
      await gptService.generateCompletion(messages, { temperature: 0.5, max_tokens: 1000 });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 1000
        })
      );
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens from text length', () => {
      const text = 'a'.repeat(100);
      const tokens = gptService.estimateTokens(text);

      expect(tokens).toBe(25);
    });
  });

  describe('truncateToTokenLimit', () => {
    it('should not truncate text under limit', () => {
      const text = 'Short text';
      const result = gptService.truncateToTokenLimit(text, 100);

      expect(result).toBe(text);
    });

    it('should truncate text over limit', () => {
      const text = 'a'.repeat(1000);
      const result = gptService.truncateToTokenLimit(text, 50);

      expect(result.length).toBeLessThan(text.length);
      expect(result).toContain('[Content truncated due to length]');
    });
  });
});
