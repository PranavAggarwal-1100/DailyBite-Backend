const multer = require('multer');
const sharp = require('sharp');
const { AppError } = require('./error.middleware');

// Create multer instance directly
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Not an image! Please upload only images.'), false);
  }
};

// Create multer instance
const multerUpload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const resizeImage = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(800, 800, {
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`uploads/${req.file.filename}`);

  next();
};

module.exports = {
  upload: multerUpload, // Export the multer instance with upload key
  resizeImage
};