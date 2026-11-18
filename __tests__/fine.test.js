const calculateFine = require('../lib/calculateFine');
const {
  startTestServer,
  stopTestServer,
  clearTestData,
  request,
  createUser,
} = require('../test/helpers');
const BorrowRequest = require('../models/BorrowRequest');
const Book = require('../models/Book');
const Genre = require('../models/Genre');

beforeAll(startTestServer);
afterAll(stopTestServer);
beforeEach(clearTestData);

test('charges $0.75 for a return exactly three days after the due date', () => {
  const dueAt = new Date('2026-11-01T09:00:00.000Z');
  const returnedAt = new Date('2026-11-04T09:00:00.000Z');

  expect(calculateFine(dueAt, returnedAt)).toBe(0.75);
});

test('charges nothing when a book is returned before its due date', () => {
  expect(calculateFine(
    new Date('2026-11-04T09:00:00.000Z'),
    new Date('2026-11-01T09:00:00.000Z'),
  )).toBe(0);
});

test('stores the calculated fine when a librarian returns a late book', async () => {
  const patron = await createUser('patron');
  const librarian = await createUser('librarian');
  const genre = await Genre.create({ name: 'Fine Test Fiction', slug: 'fine-test-fiction' });
  const book = await Book.create({
    title: 'Fine Test Book',
    author: 'Test Author',
    isbn: 'fine-test-isbn',
    description: 'A book used to test fine calculation.',
    coverImage: 'https://example.test/cover.jpg',
    totalCopies: 1,
    availableCopies: 1,
    genre: genre._id,
  });
  const dueAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const borrowRequest = await BorrowRequest.create({
    book: book._id,
    user: patron.user._id,
    dueAt,
  });

  const response = await request(`/api/borrow-requests/${borrowRequest.id}`, {
    method: 'PATCH',
    token: librarian.token,
    body: JSON.stringify({ status: 'returned', fine: 0.01 }),
  });
  const expectedFine = Math.round(
    Math.ceil((new Date(response.body.data.returnedAt).getTime() - dueAt.getTime()) / (24 * 60 * 60 * 1000)) * 25,
  ) / 100;

  expect(response.status).toBe(200);
  expect(response.body.data.status).toBe('returned');
  expect(response.body.data.fine).toBe(expectedFine);
  expect(response.body.data.fine).not.toBe(0.01);
});
