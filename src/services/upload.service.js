const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/error.middleware');

class UploadService {
  async processFoodPhoto(userId, file) {
    try {
      const filename = `food-${userId}-${Date.now()}.jpeg`;
      
      await sharp(file.buffer)
        .resize(800, 800, {
          fit: sharp.fit.inside,
          withoutEnlargement: true
        })
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`uploads/${filename}`);

      return {
        status: 'success',
        data: {
          filename,
          url: `/uploads/${filename}`
        }
      };
    } catch (error) {
      logger.error('Error processing food photo:', error);
      throw new AppError(500, 'Error processing food photo');
    }
  }

  async processVoiceRecording(userId, file) {
    try {
      const filename = `voice-${userId}-${Date.now()}.wav`;
      await fs.writeFile(`uploads/${filename}`, file.buffer);

      return {
        status: 'success',
        data: {
          filename,
          url: `/uploads/${filename}`,
          mimetype: file.mimetype
        }
      };
    } catch (error) {
      logger.error('Error processing voice recording:', error);
      throw new AppError(500, 'Error processing voice recording');
    }
  }

  async processProgressPhoto(userId, file) {
    try {
      const filename = `progress-${userId}-${Date.now()}.jpeg`;
      
      await sharp(file.buffer)
        .resize(1200, 1200, {
          fit: sharp.fit.inside,
          withoutEnlargement: true
        })
        .toFormat('jpeg')
        .jpeg({ quality: 85 })
        .toFile(`uploads/${filename}`);

      return {
        status: 'success',
        data: {
          filename,
          url: `/uploads/${filename}`
        }
      };
    } catch (error) {
      logger.error('Error processing progress photo:', error);
      throw new AppError(500, 'Error processing progress photo');
    }
  }

  async processProfilePhoto(userId, file) {
    try {
      const filename = `profile-${userId}-${Date.now()}.jpeg`;
      
      await sharp(file.buffer)
        .resize(400, 400, {
          fit: sharp.fit.cover,
          position: 'centre'
        })
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`uploads/${filename}`);

      return {
        status: 'success',
        data: {
          filename,
          url: `/uploads/${filename}`
        }
      };
    } catch (error) {
      logger.error('Error processing profile photo:', error);
      throw new AppError(500, 'Error processing profile photo');
    }
  }

  async deleteFile(filename) {
    try {
      await fs.unlink(`uploads/${filename}`);
      return true;
    } catch (error) {
      logger.error('Error deleting file:', error);
      return false;
    }
  }
}

module.exports = new UploadService();