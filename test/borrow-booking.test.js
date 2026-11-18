const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const BorrowRequest = require('../models/BorrowRequest');
const Booking = require('../models/Booking');
const Book = require('../models/Book');
const Genre = require('../models/Genre');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

let mongoServer;
let server;
let baseUrl;

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
  return { status: response.status, body };
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

const createBook = async (availableCopies = 3) => {
  const genre = await Genre.create({ name: 'Test Fiction', slug: 'test-fiction' });
  return Book.create({
    title: 'Test Book',
    author: 'Test Author',
    isbn: 'test-isbn',
    description: 'A book used by API tests.',
    coverImage: 'https://example.test/cover.jpg',
    totalCopies: 3,
    availableCopies,
    genre: genre._id,
  });
};

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await mongoose.disconnect();
  await mongoServer.stop();
});

test.beforeEach(async () => {
  await Promise.all([
    BorrowRequest.deleteMany({}),
    Booking.deleteMany({}),
    Book.deleteMany({}),
    Genre.deleteMany({}),
    User.deleteMany({}),
  ]);
});

test('borrow requests require auth, reject unavailable books, and restrict status changes to librarians', async () => {
  const book = await createBook(0);
  const patron = await createUser('patron');

  const unauthenticated = await request('/api/borrow-requests', {
    method: 'POST',
    body: JSON.stringify({ bookId: book.id }),
  });
  assert.equal(unauthenticated.status, 401);

  const unavailable = await request('/api/borrow-requests', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify({ bookId: book.id }),
  });
  assert.equal(unavailable.status, 409);

  book.availableCopies = 3;
  await book.save();
  const created = await request('/api/borrow-requests', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify({ bookId: book.id }),
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.book.title, book.title);
  assert.equal(created.body.data.status, 'pending');
  assert.ok(new Date(created.body.data.dueAt) > new Date(created.body.data.requestedAt));

  const forbidden = await request(`/api/borrow-requests/${created.body.data._id}`, {
    method: 'PATCH',
    token: patron.token,
    body: JSON.stringify({ status: 'returned' }),
  });
  assert.equal(forbidden.status, 403);
});

test('librarian return sets fine from the overdue period and ignores submitted fine', async () => {
  const patron = await createUser('patron');
  const librarian = await createUser('librarian');
  const book = await createBook();
  const created = await request('/api/borrow-requests', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify({ bookId: book.id, fine: 0 }),
  });
  const dueAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  await BorrowRequest.findByIdAndUpdate(created.body.data._id, { dueAt });

  const returned = await request(`/api/borrow-requests/${created.body.data._id}`, {
    method: 'PATCH',
    token: librarian.token,
    body: JSON.stringify({ status: 'returned', fine: 0.01 }),
  });
  const overdueDays = Math.ceil(
    (new Date(returned.body.data.returnedAt).getTime() - dueAt.getTime()) / (24 * 60 * 60 * 1000),
  );
  assert.equal(returned.status, 200);
  assert.equal(returned.body.data.status, 'returned');
  assert.equal(returned.body.data.fine, Math.round(overdueDays * 25) / 100);
  assert.notEqual(returned.body.data.fine, 0.01);
});

test('librarian Book API supports add, list, edit, and delete for admin pages', async () => {
  const librarian = await createUser('librarian');
  const genre = await Genre.create({ name: 'Admin Fiction', slug: 'admin-fiction' });
  const payload = {
    title: 'Admin Book',
    author: 'Admin Author',
    isbn: 'admin-isbn',
    description: 'A book added from the librarian panel.',
    coverImage: 'https://example.test/admin-cover.jpg',
    totalCopies: 4,
    availableCopies: 2,
    genre: genre.id,
  };

  const created = await request('/api/books', {
    method: 'POST',
    token: librarian.token,
    body: JSON.stringify(payload),
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.genre.name, genre.name);

  const listed = await request('/api/books?limit=20');
  assert.equal(listed.status, 200);
  assert.equal(listed.body.pagination.total, 1);
  assert.equal(listed.body.data[0].title, payload.title);
  const listedGenres = await request('/api/genres');
  assert.equal(listedGenres.body.data[0].name, genre.name);

  const updated = await request(`/api/books/${created.body.data._id}`, {
    method: 'PUT',
    token: librarian.token,
    body: JSON.stringify({ ...payload, title: 'Updated Admin Book' }),
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.title, 'Updated Admin Book');

  const deleted = await request(`/api/books/${created.body.data._id}`, {
    method: 'DELETE',
    token: librarian.token,
  });
  assert.equal(deleted.status, 204);
});

test('booking endpoint rejects partial overlaps but accepts adjacent time ranges', async () => {
  const patron = await createUser('patron');
  const payload = {
    space: 'Study Room A',
    date: '2026-11-20',
    startTime: '10:00',
    endTime: '12:00',
  };
  const first = await request('/api/bookings', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify(payload),
  });
  assert.equal(first.status, 201);

  const partialOverlap = await request('/api/bookings', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify({ ...payload, startTime: '11:30', endTime: '13:00' }),
  });
  assert.equal(partialOverlap.status, 409);

  const adjacent = await request('/api/bookings', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify({ ...payload, startTime: '12:00', endTime: '13:00' }),
  });
  assert.equal(adjacent.status, 201);
});
