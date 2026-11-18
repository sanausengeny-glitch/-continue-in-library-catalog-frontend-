const {
  startTestServer,
  stopTestServer,
  clearTestData,
  request,
  createUser,
} = require('../test/helpers');

beforeAll(startTestServer);
afterAll(stopTestServer);
beforeEach(clearTestData);

test('rejects a booking whose time overlaps an existing booking', async () => {
  const patron = await createUser('patron');
  const booking = {
    space: 'Study Room A',
    date: '2026-11-20',
    startTime: '10:00',
    endTime: '12:00',
  };
  const first = await request('/api/bookings', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify(booking),
  });
  expect(first.status).toBe(201);
  expect(first.body.data.startTime).toBe('10:00');

  const conflict = await request('/api/bookings', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify({ ...booking, startTime: '11:30', endTime: '13:00' }),
  });

  expect(conflict.status).toBe(409);
  expect(conflict.body.error.message).toMatch(/already booked/i);

  const adjacent = await request('/api/bookings', {
    method: 'POST',
    token: patron.token,
    body: JSON.stringify({ ...booking, startTime: '12:00', endTime: '13:00' }),
  });
  expect(adjacent.status).toBe(201);
});
