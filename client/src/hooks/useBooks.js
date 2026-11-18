import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

export default function useBooks({ genre = '', search = '', page = 1, limit = 12 } = {}) {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ page, limit, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));

    if (genre) {
      params.set('genre', genre);
    }

    if (search) {
      params.set('search', search);
    }

    setLoading(true);
    setError('');

    fetch(apiUrl(`/books?${params.toString()}`), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error?.message || 'Unable to load the catalog.');
        }

        return response.json();
      })
      .then((payload) => {
        setBooks(payload.data || []);
        setPagination(payload.pagination || { page, limit, total: 0, totalPages: 0 });
      })
      .catch((fetchError) => {
        if (fetchError.name === 'AbortError') {
          return;
        }

        setBooks([]);
        setError(fetchError.message || 'Something went wrong while loading books.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [genre, limit, page, search]);

  return { books, pagination, loading, error };
}
