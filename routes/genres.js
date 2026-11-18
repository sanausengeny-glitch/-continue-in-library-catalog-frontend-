const express = require('express');
const mongoose = require('mongoose');
const Genre = require('../models/Genre');
const Book = require('../models/Book');
const { genres } = require('../lib/catalogData');
const { validateGenre } = require('../middleware/validate');

const router = express.Router();

const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

router.get('/', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const databaseGenres = await Genre.find().sort({ name: 1 }).lean();
      return res.json({ success: true, data: databaseGenres });
    } catch (error) {
      return next(error);
    }
  }

  return res.json({ success: true, data: genres });
});

router.get('/:id', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          success: false,
          error: { message: 'Genre not found.' },
        });
      }
      const genre = await Genre.findById(req.params.id).lean();
      if (!genre) {
        return res.status(404).json({
          success: false,
          error: { message: 'Genre not found.' },
        });
      }
      return res.json({ success: true, data: genre });
    } catch (error) {
      return next(error);
    }
  }

  const genre = genres.find((entry) => entry._id === req.params.id);

  if (!genre) {
    return res.status(404).json({
      success: false,
      error: { message: 'Genre not found.' },
    });
  }

  return res.json({ success: true, data: genre });
});

router.post('/', validateGenre, async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const genre = await Genre.create({ name: req.body.name.trim(), slug: req.body.slug });
      return res.status(201).json({ success: true, data: genre });
    } catch (error) {
      return next(error);
    }
  }

  const newGenre = {
    _id: `genre-${Date.now()}`,
    name: req.body.name.trim(),
    slug: req.body.slug || slugify(req.body.name),
  };

  genres.push(newGenre);

  return res.status(201).json({ success: true, data: newGenre });
});

router.put('/:id', validateGenre, async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          success: false,
          error: { message: 'Genre not found.' },
        });
      }
      const genre = await Genre.findByIdAndUpdate(
        req.params.id,
        { name: req.body.name.trim(), slug: req.body.slug },
        { new: true, runValidators: true },
      );
      if (!genre) {
        return res.status(404).json({
          success: false,
          error: { message: 'Genre not found.' },
        });
      }
      return res.json({ success: true, data: genre });
    } catch (error) {
      return next(error);
    }
  }

  const index = genres.findIndex((genre) => genre._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Genre not found.' },
    });
  }

  genres[index] = {
    ...genres[index],
    name: req.body.name.trim(),
    slug: req.body.slug || slugify(req.body.name),
  };

  return res.json({ success: true, data: genres[index] });
});

router.delete('/:id', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          success: false,
          error: { message: 'Genre not found.' },
        });
      }
      const existingBooks = await Book.exists({ genre: req.params.id });
      if (existingBooks) {
        return res.status(400).json({
          success: false,
          error: { message: 'This genre cannot be deleted while books still reference it.' },
        });
      }
      const genre = await Genre.findByIdAndDelete(req.params.id);
      if (!genre) {
        return res.status(404).json({
          success: false,
          error: { message: 'Genre not found.' },
        });
      }
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  const index = genres.findIndex((genre) => genre._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Genre not found.' },
    });
  }

  genres.splice(index, 1);
  return res.status(204).send();
});

module.exports = router;
