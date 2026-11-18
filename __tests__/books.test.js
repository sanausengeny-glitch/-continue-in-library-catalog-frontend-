const {
  startTestServer,
  stopTestServer,
  clearTestData,
  request,
  createUser,
} = require('../test/helpers');
const Genre = require('../models/Genre');

beforeAll(startTestServer);
afterAll(stopTestServer);
beforeEach(clearTestData);

test('librarians can create, list, update, and delete books', async () => {
  const librarian = await createUser('librarian');
  const genre = await Genre.create({ name: 'Admin Fiction', slug: 'admin-fiction' });
  const book = {
    title: 'Admin Book',
    author: 'Admin Author',
    isbn: 'admin-isbn',
    description: 'A book managed through the admin API.',
    coverImage: 'https://example.test/admin-cover.jpg',
    totalCopies: 4,
    availableCopies: 2,
    genre: genre.id,
  };
  const created = await request('/api/books', {
    method: 'POST',
    token: librarian.token,
    body: JSON.stringify(book),
  });
  expect(created.status).toBe(201);
  expect(created.body.data.genre.name).toBe(genre.name);

  const listed = await request('/api/books?limit=20');
  expect(listed.status).toBe(200);
  expect(listed.body.pagination.total).toBe(1);
  expect(listed.body.data[0].title).toBe(book.title);

  const updated = await request(`/api/books/${created.body.data._id}`, {
    method: 'PUT',
    token: librarian.token,
    body: JSON.stringify({ ...book, title: 'Updated Admin Book' }),
  });
  expect(updated.status).toBe(200);
  expect(updated.body.data.title).toBe('Updated Admin Book');

  const deleted = await request(`/api/books/${created.body.data._id}`, {
    method: 'DELETE',
    token: librarian.token,
  });
  expect(deleted.status).toBe(204);
});
