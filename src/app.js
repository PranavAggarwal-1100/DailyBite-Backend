require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const {errorHandler} = require('./middlewares/error.middleware');
const logger = require('./utils/logger');
const { initializeUploadDirectories } = require('./utils/init-directories');


const app = express();

initializeUploadDirectories();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api', routes);



// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;
