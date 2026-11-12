const express = require('express');
const { books, genres } = require('../lib/catalogData');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBook } = require('../middleware/validate');

const router = express.Router();

const serializeBook = (book) => {
  const matchingGenre = genres.find((genre) => genre._id === book.genre) || null;

  return {
    ...book,
    genre: matchingGenre
      ? { _id: matchingGenre._id, name: matchingGenre.name, slug: matchingGenre.slug }
      : null,
  };
};

router.get('/', (req, res) => {
  const { genre, search, page = '1', limit = '10' } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return res.status(400).json({
      success: false,
      error: { message: 'page must be a positive integer.' },
    });
  }

  if (!Number.isInteger(limitNumber) || limitNumber < 1) {
    return res.status(400).json({
      success: false,
      error: { message: 'limit must be a positive integer.' },
    });
  }

  let filteredBooks = [...books];

  if (genre) {
    filteredBooks = filteredBooks.filter((book) => String(book.genre) === String(genre));
  }

  if (search && String(search).trim()) {
    const term = String(search).trim().toLowerCase();
    filteredBooks = filteredBooks.filter((book) => {
      const title = (book.title || '').toLowerCase();
      const author = (book.author || '').toLowerCase();
      return title.includes(term) || author.includes(term);
    });
  }

  const total = filteredBooks.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limitNumber);
  const start = (pageNumber - 1) * limitNumber;
  const pagedBooks = filteredBooks.slice(start, start + limitNumber);

  return res.json({
    success: true,
    data: pagedBooks.map(serializeBook),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages,
    },
  });
});

router.get('/:id', (req, res) => {
  const book = books.find((entry) => entry._id === req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      error: { message: 'Book not found.' },
    });
  }

  return res.json({ success: true, data: serializeBook(book) });
});

router.post('/', requireAuth, requireRole('librarian'), validateBook, (req, res) => {
  const nextId = `book-${Date.now()}`;
  const newBook = {
    _id: nextId,
    title: req.body.title.trim(),
    author: req.body.author.trim(),
    isbn: req.body.isbn.trim(),
    description: req.body.description.trim(),
    coverImage: req.body.coverImage.trim(),
    totalCopies: Number(req.body.totalCopies),
    availableCopies: Number(req.body.availableCopies),
    genre: req.body.genre,
  };

  books.push(newBook);
  return res.status(201).json({ success: true, data: serializeBook(newBook) });
});

router.put('/:id', requireAuth, requireRole('librarian'), validateBook, (req, res) => {
  const index = books.findIndex((book) => book._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Book not found.' },
    });
  }

  books[index] = {
    ...books[index],
    title: req.body.title.trim(),
    author: req.body.author.trim(),
    isbn: req.body.isbn.trim(),
    description: req.body.description.trim(),
    coverImage: req.body.coverImage.trim(),
    totalCopies: Number(req.body.totalCopies),
    availableCopies: Number(req.body.availableCopies),
    genre: req.body.genre,
  };

  return res.json({ success: true, data: serializeBook(books[index]) });
});

router.delete('/:id', requireAuth, requireRole('librarian'), (req, res) => {
  const index = books.findIndex((book) => book._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Book not found.' },
    });
  }

  books.splice(index, 1);
  return res.status(204).send();
});

module.exports = router;
