const express = require('express');
const Booking = require('../models/Booking');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const isValidDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { space, date, startTime, endTime } = req.body || {};
    if (
      typeof space !== 'string' || !space.trim()
      || typeof date !== 'string' || !isValidDate(date)
      || typeof startTime !== 'string' || !timePattern.test(startTime)
      || typeof endTime !== 'string' || !timePattern.test(endTime)
      || startTime >= endTime
    ) {
      return res.status(400).json({
        success: false,
        error: { message: 'A space, valid date, and an end time after the start time are required.' },
      });
    }

    const existingBookings = await Booking.find({ space: space.trim(), date }).select('startTime endTime').lean();
    const overlaps = existingBookings.some(
      (booking) => startTime < booking.endTime && endTime > booking.startTime,
    );

    if (overlaps) {
      return res.status(409).json({
        success: false,
        error: { message: 'This space is already booked during part of that time.' },
      });
    }

    const booking = await Booking.create({
      space: space.trim(),
      user: req.userId,
      date,
      startTime,
      endTime,
    });

    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
});

router.get('/', requireAuth, requireRole('librarian'), async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email')
      .sort({ date: 1, startTime: 1 })
      .lean();
    return res.json({ success: true, data: bookings });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
