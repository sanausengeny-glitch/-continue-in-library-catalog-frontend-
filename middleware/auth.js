const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'library-dev-secret';

const signToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );

const getTokenFromRequest = (req) => {
  const bearerToken = req.headers.authorization;
  if (bearerToken && bearerToken.startsWith('Bearer ')) {
    return bearerToken.slice(7);
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      const error = new Error('Authentication required.');
      error.statusCode = 401;
      return next(error);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user.toObject();
    req.userId = user._id;
    return next();
  } catch (error) {
    const authError = new Error('Authentication required.');
    authError.statusCode = 401;
    return next(authError);
  }
};

const requireRole = (requiredRole) => (req, res, next) => {
  if (!req.user || req.user.role !== requiredRole) {
    const error = new Error(`Access denied. ${requiredRole} role required.`);
    error.statusCode = 403;
    return next(error);
  }

  return next();
};

module.exports = {
  signToken,
  requireAuth,
  requireRole,
};
