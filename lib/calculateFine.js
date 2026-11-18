const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAILY_FINE = 0.25;

const calculateFine = (dueAt, returnedAt) => {
  const overdueDays = Math.max(
    0,
    Math.ceil((new Date(returnedAt).getTime() - new Date(dueAt).getTime()) / DAY_IN_MS),
  );
  return Math.round(overdueDays * DAILY_FINE * 100) / 100;
};

module.exports = calculateFine;
