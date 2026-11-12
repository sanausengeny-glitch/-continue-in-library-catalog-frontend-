const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const validateGenre = (req, res, next) => {
  const { name, slug } = req.body || {};

  if (!name || !String(name).trim()) {
    const error = new Error('name is required.');
    error.statusCode = 400;
    error.field = 'name';
    return next(error);
  }

  req.body.slug = slug ? slugify(slug) : slugify(name);

  return next();
};

const validateBook = (req, res, next) => {
  const { title, author, isbn, description, coverImage, totalCopies, availableCopies, genre } = req.body || {};

  if (!title || !String(title).trim()) {
    const error = new Error('title is required.');
    error.statusCode = 400;
    error.field = 'title';
    return next(error);
  }

  if (!author || !String(author).trim()) {
    const error = new Error('author is required.');
    error.statusCode = 400;
    error.field = 'author';
    return next(error);
  }

  if (!isbn || !String(isbn).trim()) {
    const error = new Error('isbn is required.');
    error.statusCode = 400;
    error.field = 'isbn';
    return next(error);
  }

  if (!description || !String(description).trim()) {
    const error = new Error('description is required.');
    error.statusCode = 400;
    error.field = 'description';
    return next(error);
  }

  if (!coverImage || !String(coverImage).trim()) {
    const error = new Error('coverImage is required.');
    error.statusCode = 400;
    error.field = 'coverImage';
    return next(error);
  }

  if (typeof totalCopies !== 'number' || !Number.isInteger(totalCopies) || totalCopies < 1) {
    const error = new Error('totalCopies must be a positive integer.');
    error.statusCode = 400;
    error.field = 'totalCopies';
    return next(error);
  }

  if (typeof availableCopies !== 'number' || !Number.isInteger(availableCopies) || availableCopies < 0) {
    const error = new Error('availableCopies must be a non-negative integer.');
    error.statusCode = 400;
    error.field = 'availableCopies';
    return next(error);
  }

  if (availableCopies > totalCopies) {
    const error = new Error('availableCopies cannot exceed totalCopies.');
    error.statusCode = 400;
    error.field = 'availableCopies';
    return next(error);
  }

  if (!genre || !String(genre).trim()) {
    const error = new Error('genre is required.');
    error.statusCode = 400;
    error.field = 'genre';
    return next(error);
  }

  return next();
};

module.exports = {
  validateGenre,
  validateBook,
};
