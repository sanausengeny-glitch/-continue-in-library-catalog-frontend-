import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('No book id was provided.');
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    fetch(`/books/${id}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error?.message || 'Book not found.');
        }

        return response.json();
      })
      .then((payload) => {
        setBook(payload.data || null);
      })
      .catch((fetchError) => {
        if (fetchError.name === 'AbortError') {
          return;
        }

        setError(fetchError.message || 'This book could not be loaded.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <main className="page-shell"><div className="state state--loading">Loading book details…</div></main>;
  }

  if (error || !book) {
    return (
      <main className="page-shell">
        <div className="state state--error">
          {error || 'This book could not be found.'}
        </div>
        <div className="detail-actions">
          <Link to="/" className="back-link">← Back to catalog</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="detail-actions">
        <Link to="/" className="back-link">← Back to catalog</Link>
      </div>

      <article className="book-detail">
        <img src={book.coverImage} alt={`${book.title} cover`} className="book-detail__image" />

        <div className="book-detail__content">
          <span className="book-tag">{book.genre?.name || 'General'}</span>
          <h1>{book.title}</h1>
          <p className="book-detail__author">by {book.author}</p>

          <dl className="book-detail__meta">
            <div>
              <dt>ISBN</dt>
              <dd>{book.isbn}</dd>
            </div>
            <div>
              <dt>Copies</dt>
              <dd>{book.availableCopies} available / {book.totalCopies} total</dd>
            </div>
          </dl>

          <p className="book-detail__description">{book.description}</p>
        </div>
      </article>
    </main>
  );
}
