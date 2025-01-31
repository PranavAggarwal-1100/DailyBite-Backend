const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function initializeUploadDirectories() {
  const uploadDirs = [
    'uploads',
    'uploads/food',
    'uploads/voice',
    'uploads/progress',
    'uploads/profile'
  ];

  uploadDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      } catch (error) {
        logger.error(`Error creating directory ${dir}:`, error);
      }
    }
  });
}

module.exports = {
  initializeUploadDirectories
};