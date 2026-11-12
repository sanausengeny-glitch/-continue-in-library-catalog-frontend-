const express = require('express');
const { genres } = require('../lib/catalogData');
const { validateGenre } = require('../middleware/validate');

const router = express.Router();

const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

router.get('/', (req, res) => {
  return res.json({ success: true, data: genres });
});

router.get('/:id', (req, res) => {
  const genre = genres.find((entry) => entry._id === req.params.id);

  if (!genre) {
    return res.status(404).json({
      success: false,
      error: { message: 'Genre not found.' },
    });
  }

  return res.json({ success: true, data: genre });
});

router.post('/', validateGenre, (req, res) => {
  const newGenre = {
    _id: `genre-${Date.now()}`,
    name: req.body.name.trim(),
    slug: req.body.slug || slugify(req.body.name),
  };

  genres.push(newGenre);

  return res.status(201).json({ success: true, data: newGenre });
});

router.put('/:id', validateGenre, (req, res) => {
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

router.delete('/:id', (req, res) => {
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
