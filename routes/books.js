const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Genre = require('../models/Genre');
const { books, genres } = require('../lib/catalogData');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBook } = require('../middleware/validate');

const router = express.Router();

const serializeBook = (book) => {
  if (book.genre && typeof book.genre === 'object' && book.genre.name) {
    return {
      ...book,
      genre: { _id: book.genre._id, name: book.genre.name, slug: book.genre.slug },
    };
  }

  const matchingGenre = genres.find((genre) => genre._id === book.genre) || null;

  return {
    ...book,
    genre: matchingGenre
      ? { _id: matchingGenre._id, name: matchingGenre.name, slug: matchingGenre.slug }
      : null,
  };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res, next) => {
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

  if (mongoose.connection.readyState === 1) {
    try {
      const filter = {};
      if (genre) {
        if (!mongoose.isValidObjectId(genre)) {
          return res.status(400).json({
            success: false,
            error: { message: 'genre must be a valid genre id.' },
          });
        }
        filter.genre = genre;
      }
      if (search && String(search).trim()) {
        const expression = new RegExp(escapeRegex(String(search).trim()), 'i');
        filter.$or = [{ title: expression }, { author: expression }];
      }

      const [pagedBooks, total] = await Promise.all([
        Book.find(filter)
          .populate('genre', 'name slug')
          .sort({ title: 1 })
          .skip((pageNumber - 1) * limitNumber)
          .limit(limitNumber)
          .lean(),
        Book.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        data: pagedBooks.map(serializeBook),
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      return next(error);
    }
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

router.get('/:id', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          success: false,
          error: { message: 'Book not found.' },
        });
      }
      const book = await Book.findById(req.params.id).populate('genre', 'name slug').lean();
      if (!book) {
        return res.status(404).json({
          success: false,
          error: { message: 'Book not found.' },
        });
      }
      return res.json({ success: true, data: serializeBook(book) });
    } catch (error) {
      return next(error);
    }
  }

  const book = books.find((entry) => entry._id === req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      error: { message: 'Book not found.' },
    });
  }

  return res.json({ success: true, data: serializeBook(book) });
});

router.post('/', requireAuth, requireRole('librarian'), validateBook, async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      if (!mongoose.isValidObjectId(req.body.genre) || !(await Genre.exists({ _id: req.body.genre }))) {
        return res.status(400).json({
          success: false,
          error: { field: 'genre', message: 'genre must reference an existing genre.' },
        });
      }
      const book = await Book.create(req.body);
      await book.populate('genre', 'name slug');
      return res.status(201).json({ success: true, data: serializeBook(book.toObject()) });
    } catch (error) {
      return next(error);
    }
  }

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

router.put('/:id', requireAuth, requireRole('librarian'), validateBook, async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          success: false,
          error: { message: 'Book not found.' },
        });
      }
      if (!mongoose.isValidObjectId(req.body.genre) || !(await Genre.exists({ _id: req.body.genre }))) {
        return res.status(400).json({
          success: false,
          error: { field: 'genre', message: 'genre must reference an existing genre.' },
        });
      }
      const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate('genre', 'name slug');
      if (!book) {
        return res.status(404).json({
          success: false,
          error: { message: 'Book not found.' },
        });
      }
      return res.json({ success: true, data: serializeBook(book.toObject()) });
    } catch (error) {
      return next(error);
    }
  }

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

router.delete('/:id', requireAuth, requireRole('librarian'), async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          success: false,
          error: { message: 'Book not found.' },
        });
      }
      const book = await Book.findByIdAndDelete(req.params.id);
      if (!book) {
        return res.status(404).json({
          success: false,
          error: { message: 'Book not found.' },
        });
      }
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

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
