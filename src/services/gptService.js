const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');
const { OpenAIError } = require('../utils/errors');

class GPTService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey
    });
    this.model = config.openai.model;
  }

  async generateCompletion(messages, options = {}) {
    const defaultOptions = {
      model: this.model,
      temperature: 0.7,
      max_tokens: 2000
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      logger.debug(`Calling OpenAI API with model: ${requestOptions.model}`);
      
      const response = await this.client.chat.completions.create({
        ...requestOptions,
        messages
      });

      const completion = response.choices[0].message.content;
      const usage = response.usage;

      logger.info(`OpenAI API call successful. Tokens used: ${usage.total_tokens} (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`);

      return {
        content: completion,
        usage
      };
    } catch (error) {
      logger.error(`OpenAI API error: ${error.message}`);
      
      if (error.status === 429) {
        throw new OpenAIError('OpenAI rate limit exceeded. Please try again later.', 429);
      }
      
      if (error.status === 401) {
        throw new OpenAIError('OpenAI authentication failed. Check your API key.', 401);
      }
      
      if (error.status === 400) {
        throw new OpenAIError(`OpenAI request error: ${error.message}`, 400);
      }
      
      throw new OpenAIError(`OpenAI API error: ${error.message}`, error.status || 500);
    }
  }

  async generateWithRetry(messages, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateCompletion(messages, options);
      } catch (error) {
        lastError = error;
        
        if (error.statusCode === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }
        
        if (error.statusCode === 401 || error.statusCode === 400) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          logger.warn(`OpenAI request failed. Retrying (attempt ${attempt}/${maxRetries})`);
          await this.sleep(1000 * attempt);
        }
      }
    }
    
    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  truncateToTokenLimit(text, maxTokens) {
    const estimatedTokens = this.estimateTokens(text);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    
    const ratio = maxTokens / estimatedTokens;
    const targetLength = Math.floor(text.length * ratio * 0.9);
    
    return text.substring(0, targetLength) + '\n\n[Content truncated due to length]';
  }
}

module.exports = new GPTService();
