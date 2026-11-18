process.env.FRONTEND_ORIGIN = 'https://library-ui.example.test';

const {
  startTestServer,
  stopTestServer,
  clearTestData,
  request,
  createUser,
} = require('../test/helpers');
const User = require('../models/User');

beforeAll(startTestServer);
afterAll(stopTestServer);
beforeEach(clearTestData);

describe('protected routes', () => {
  test('stores user passwords as hashes', async () => {
    const user = await User.create({
      username: 'hash-check',
      email: 'hash-check@example.test',
      password: 'secret123',
      role: 'patron',
    });

    expect(user.password).not.toBe('secret123');
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  test('reject requests without a token and with an invalid token', async () => {
    const unauthenticated = await request('/api/bookings');
    const invalidToken = await request('/api/bookings', { token: 'not-a-valid-token' });

    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body.error.message).toMatch(/authentication/i);
    expect(invalidToken.status).toBe(401);
    expect(invalidToken.body.error.message).toMatch(/authentication/i);
  });

  test('rejects a patron from librarian-only booking routes', async () => {
    const patron = await createUser('patron');
    const response = await request('/api/bookings', { token: patron.token });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toMatch(/librarian/i);
  });

  test('allows requests from the configured frontend origin', async () => {
    const response = await request('/genres', {
      headers: { Origin: 'https://library-ui.example.test' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://library-ui.example.test');
  });
});
