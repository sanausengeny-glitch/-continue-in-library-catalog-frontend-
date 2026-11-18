const express = require('express');
const mongoose = require('mongoose');
const BorrowRequest = require('../models/BorrowRequest');
const Book = require('../models/Book');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAILY_FINE = 0.25;
const LOAN_PERIOD_DAYS = 14;
const statuses = ['pending', 'approved', 'returned', 'late'];

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const bookId = String(req.body?.bookId || '').trim();
    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({ success: false, error: { message: 'A valid bookId is required.' } });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ success: false, error: { message: 'Book not found.' } });
    }

    if (book.availableCopies <= 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'This book has no available copies.' },
      });
    }

    const requestedAt = new Date();
    const dueAt = new Date(requestedAt.getTime() + LOAN_PERIOD_DAYS * DAY_IN_MS);
    const borrowRequest = await BorrowRequest.create({
      book: book._id,
      user: req.userId,
      requestedAt,
      dueAt,
    });

    await borrowRequest.populate('book', 'title author isbn');
    return res.status(201).json({
      success: true,
      data: borrowRequest,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/', requireAuth, requireRole('librarian'), async (req, res, next) => {
  try {
    const requests = await BorrowRequest.find()
      .populate('book', 'title author isbn')
      .populate('user', 'username email')
      .sort({ requestedAt: -1 });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', requireAuth, requireRole('librarian'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid borrow request id.' } });
    }

    const { status } = req.body || {};
    if (!statuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: `status must be one of: ${statuses.join(', ')}.` },
      });
    }

    const borrowRequest = await BorrowRequest.findById(req.params.id);
    if (!borrowRequest) {
      return res.status(404).json({ success: false, error: { message: 'Borrow request not found.' } });
    }

    borrowRequest.status = status;
    if (status === 'returned') {
      const returnedAt = new Date();
      const overdueDays = Math.max(0, Math.ceil((returnedAt.getTime() - borrowRequest.dueAt.getTime()) / DAY_IN_MS));
      borrowRequest.returnedAt = returnedAt;
      borrowRequest.fine = Math.round(overdueDays * DAILY_FINE * 100) / 100;
    } else {
      borrowRequest.returnedAt = null;
      borrowRequest.fine = 0;
    }

    await borrowRequest.save();
    await borrowRequest.populate('book', 'title author isbn');
    await borrowRequest.populate('user', 'username email');
    return res.json({ success: true, data: borrowRequest });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
