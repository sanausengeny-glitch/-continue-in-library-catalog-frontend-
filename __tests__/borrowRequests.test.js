const {
  startTestServer,
  stopTestServer,
  clearTestData,
  request,
  createUser,
} = require('../test/helpers');
const Book = require('../models/Book');
const Genre = require('../models/Genre');

beforeAll(startTestServer);
afterAll(stopTestServer);
beforeEach(clearTestData);

test('requires a patron token and rejects borrowing books with no available copies', async () => {
  const unauthenticated = await request('/api/borrow-requests', {
    method: 'POST',
    body: JSON.stringify({ bookId: '507f1f77bcf86cd799439011' }),
  });
  expect(unauthenticated.status).toBe(401);

  const patron = await createUser('patron');
  const genre = await Genre.create({ name: 'Unavailable Fiction', slug: 'unavailable-fiction' });
  const book = await Book.create({
    title: 'Unavailable Book',
    author: 'Test Author',
    isbn: 'unavailable-book-isbn',
    description: 'A book with no remaining copies.',
    coverImage: 'https://example.test/cover.jpg',
    totalCopies: 1,
    availableCopies: 0,
    genre: genre._id,
  });
  const response = await request('/api/borrow-requests', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify({ bookId: book.id }),
  });

  expect(response.status).toBe(409);
  expect(response.body.error.message).toMatch(/no available copies/i);
});

test('creates a pending borrow request with a 14-day due date', async () => {
  const patron = await createUser('patron');
  const genre = await Genre.create({ name: 'Available Fiction', slug: 'available-fiction' });
  const book = await Book.create({
    title: 'Available Book',
    author: 'Test Author',
    isbn: 'available-book-isbn',
    description: 'A book that can be borrowed.',
    coverImage: 'https://example.test/cover.jpg',
    totalCopies: 2,
    availableCopies: 2,
    genre: genre._id,
  });

  const response = await request('/api/borrow-requests', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify({ bookId: book.id }),
  });

  expect(response.status).toBe(201);
  expect(response.body.data.status).toBe('pending');
  expect(response.body.data.book.title).toBe(book.title);
  expect(new Date(response.body.data.dueAt).getTime() - new Date(response.body.data.requestedAt).getTime())
    .toBe(14 * 24 * 60 * 60 * 1000);
});
