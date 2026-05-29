const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { sendError } = require('../utils/response');
const { redisClient } = require('../config/redis');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', 'No token provided', 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Check if token is blacklisted in Redis
    if (redisClient.isOpen) {
      const isBlacklisted = await redisClient.get(`bl_${token}`);
      if (isBlacklisted) {
        return sendError(res, 'UNAUTHORIZED', 'Token has been invalidated (Logged out)', 401);
      }
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'UNAUTHORIZED', 'Token expired', 401);
    }
    return sendError(res, 'UNAUTHORIZED', 'Invalid token', 401);
  }
};

module.exports = { verifyToken };
