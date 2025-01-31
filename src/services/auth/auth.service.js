const { User } = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');

class AuthService {
  async register(userData) {
    try {
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      const user = await User.create(userData);
      const token = this.generateToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      logger.error('Error in register:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      const token = this.generateToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      logger.error('Error in login:', error);
      throw error;
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      logger.error('Error in validateToken:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
