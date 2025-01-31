const { Configuration, OpenAIApi } = require('openai');
const logger = require('../utils/logger');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Wrapper class to handle retry logic and rate limits
class OpenAIService {
  static async createCompletion(params, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await openai.createCompletion(params);
      } catch (error) {
        lastError = error;
        if (error.response?.status === 429) { // Rate limit error
          const retryAfter = error.response.headers['retry-after'] || 1;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  static async createChatCompletion(params, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await openai.createChatCompletion(params);
      } catch (error) {
        lastError = error;
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 1;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  static async createImageAnalysis(image, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await openai.createImageAnalysis({
          image,
          model: "gpt-4-vision-preview",
          max_tokens: 300
        });
      } catch (error) {
        lastError = error;
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 1;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }
}

module.exports = OpenAIService;
