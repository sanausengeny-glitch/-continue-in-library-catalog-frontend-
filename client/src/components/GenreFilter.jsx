import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

export default function GenreFilter({ selectedGenre, onSelect }) {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    fetch(apiUrl('/genres'))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load genres.');
        }

        const payload = await response.json();
        if (!ignore) {
          setGenres(payload.data || []);
        }
      })
      .catch((fetchError) => {
        if (!ignore) {
          setError(fetchError.message || 'Could not fetch genres.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <div className="genre-filter">Loading genres…</div>;
  }

  if (error) {
    return <div className="genre-filter genre-filter--error">{error}</div>;
  }

  return (
    <div className="genre-filter" aria-label="Genre filter">
      <button
        type="button"
        className={selectedGenre ? 'genre-pill' : 'genre-pill genre-pill--active'}
        onClick={() => onSelect('')}
      >
        All
      </button>
      {genres.map((genre) => (
        <button
          key={genre._id}
          type="button"
          className={selectedGenre === genre._id ? 'genre-pill genre-pill--active' : 'genre-pill'}
          onClick={() => onSelect(genre._id)}
        >
          {genre.name}
        </button>
      ))}
    </div>
  );
}
