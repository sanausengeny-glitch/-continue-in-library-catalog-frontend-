import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useReadingList from '../hooks/useReadingList';
import { apiRequest } from '../lib/api';

export default function ReadingListPanel() {
  const { readingList, removeBook } = useReadingList();
  const { isAuthenticated } = useAuth();
  const [pendingBookId, setPendingBookId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestBook = async (bookId) => {
    setPendingBookId(bookId);
    setMessage('');
    setError('');

    try {
      await apiRequest('/api/borrow-requests', {
        method: 'POST',
        body: JSON.stringify({ bookId }),
      });
      setMessage('Borrow request submitted.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingBookId('');
    }
  };

  return (
    <aside className="reading-list">
      <h2>Reading list</h2>
      {message && <p className="booking-success" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {readingList.length === 0 ? (
        <p className="reading-list__empty">Your reading list is empty.</p>
      ) : (
        <ul className="reading-list__items">
          {readingList.map((book) => (
            <li key={book._id || book.id}>
              <span>{book.title}</span>
              <div className="reading-list__actions">
                {isAuthenticated ? (
                  <button
                    type="button"
                    disabled={Boolean(pendingBookId)}
                    onClick={() => requestBook(book._id || book.id)}
                  >
                    {pendingBookId === (book._id || book.id) ? 'Requesting…' : 'Borrow'}
                  </button>
                ) : (
                  <Link to="/login" className="reading-list__login">Log in to borrow</Link>
                )}
                <button type="button" onClick={() => removeBook(book._id || book.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
