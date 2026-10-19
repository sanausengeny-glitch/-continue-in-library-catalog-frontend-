const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const { requireRole } = require('../middleware/auth');

let mongoServer;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('User model hashes passwords and stores the role enum', async () => {
  const user = new User({
    username: 'patron01',
    email: 'patron@example.com',
    password: 'secret123',
    role: 'patron',
  });

  await user.save();
  assert.notEqual(user.password, 'secret123');
  assert.match(user.password, /^\$2[aby]\$/);
  assert.equal(user.role, 'patron');
});

test('requireRole rejects non-librarians with a 403 response', () => {
  const req = { user: { role: 'patron' } };
  let capturedError;

  const next = (error) => {
    capturedError = error;
  };

  requireRole('librarian')(req, {}, next);

  assert.ok(capturedError);
  assert.equal(capturedError.statusCode, 403);
  assert.match(capturedError.message, /librarian/);
});
