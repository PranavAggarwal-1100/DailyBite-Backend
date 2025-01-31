const speech = require('@google-cloud/speech');
const fs = require('fs');
const logger = require('../utils/logger');
const aiService = require('./ai.service');
const foodService = require('./food.service');

class VoiceService {
  constructor() {
    this.client = new speech.SpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
  }

  async convertSpeechToText(audioBuffer) {
    try {
      const audio = {
        content: audioBuffer.toString('base64'),
      };
      
      const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
        model: 'default',
        metadata: {
          industryNaicsCodeOfAudio: '722',  // Food Services and Drinking Places
        }
      };
      
      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await this.client.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      return transcription;
    } catch (error) {
      logger.error('Error in convertSpeechToText:', error);
      throw error;
    }
  }

  async processVoiceFoodLog(userId, audioBuffer) {
    try {
      // Convert speech to text
      const transcription = await this.convertSpeechToText(audioBuffer);
      
      // Use AI to extract food items and portions from transcription
      const extractedInfo = await aiService.processNutritionQuery(
        `Extract food items and portions from this text: ${transcription}`,
        { format: 'structured' }
      );

      // Create food log using extracted information
      const foodLog = await foodService.createFoodLog({
        userId,
        foodItem: extractedInfo.foodItem,
        portionSize: extractedInfo.portionSize,
        logDate: new Date(),
        preparation: extractedInfo.preparation
      });

      return {
        transcription,
        foodLog
      };
    } catch (error) {
      logger.error('Error in processVoiceFoodLog:', error);
      throw error;
    }
  }
}

module.exports = new VoiceService();

