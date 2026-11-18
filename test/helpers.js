const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Booking = require('../models/Booking');
const BorrowRequest = require('../models/BorrowRequest');
const Book = require('../models/Book');
const Genre = require('../models/Genre');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

let mongoServer;
let server;
let baseUrl;

const startTestServer = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
};

const stopTestServer = async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const clearTestData = async () => Promise.all([
  Booking.deleteMany({}),
  BorrowRequest.deleteMany({}),
  Book.deleteMany({}),
  Genre.deleteMany({}),
  User.deleteMany({}),
]);

const request = async (path, { token, ...options } = {}) => {
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const body = response.status === 204 ? null : await response.json();
  return { status: response.status, body, headers: response.headers };
};

const createUser = async (role) => {
  const user = await User.create({
    username: `${role}-${Math.random().toString(36).slice(2, 9)}`,
    email: `${role}-${Math.random().toString(36).slice(2, 9)}@example.test`,
    password: 'password123',
    role,
  });
  return { user, token: signToken(user) };
};

module.exports = {
  startTestServer,
  stopTestServer,
  clearTestData,
  request,
  createUser,
};
