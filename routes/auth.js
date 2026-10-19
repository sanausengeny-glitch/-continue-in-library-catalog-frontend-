const express = require('express');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

const router = express.Router();

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  return safeUser;
};

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      const error = new Error('username, email, and password are required.');
      error.statusCode = 400;
      return next(error);
    }

    const existingUser = await User.findOne({
      $or: [{ username: String(username).trim().toLowerCase() }, { email: String(email).trim().toLowerCase() }],
    });

    if (existingUser) {
      const error = new Error('A user with that username or email already exists.');
      error.statusCode = 409;
      return next(error);
    }

    const user = await User.create({
      username: String(username).trim(),
      email: String(email).trim(),
      password: String(password),
      role: 'patron',
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      const error = new Error('email and password are required.');
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      return next(error);
    }

    const isMatch = await user.comparePassword(String(password));

    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      return next(error);
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);

  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

module.exports = router;
