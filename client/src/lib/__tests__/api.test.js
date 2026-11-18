import { apiUrl } from '../api';

describe('apiUrl', () => {
  it('uses the configured backend origin for production API requests', () => {
    vi.stubEnv('VITE_API_URL', 'https://library-api.example.com/');

    expect(apiUrl('/genres')).toBe('https://library-api.example.com/genres');

    vi.unstubAllEnvs();
  });

  it('keeps relative URLs for the local Vite proxy when no backend origin is set', () => {
    vi.stubEnv('VITE_API_URL', '');

    expect(apiUrl('/genres')).toBe('/genres');

    vi.unstubAllEnvs();
  });
});
