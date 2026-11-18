import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';

const emptyBook = {
  title: '',
  author: '',
  isbn: '',
  description: '',
  coverImage: '',
  totalCopies: '1',
  availableCopies: '1',
  genre: '',
};

const bookPayload = (book) => ({
  ...book,
  totalCopies: Number(book.totalCopies),
  availableCopies: Number(book.availableCopies),
});

export default function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [form, setForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = async (signal) => {
    const [bookResponse, genreResponse] = await Promise.all([
      apiRequest('/api/books', { signal }),
      apiRequest('/api/genres', { signal }),
    ]);
    setBooks(bookResponse.data || []);
    setGenres(genreResponse.data || []);
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    loadData(controller.signal)
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  const editBook = (book) => {
    setEditingId(book._id);
    setForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      description: book.description || '',
      coverImage: book.coverImage || '',
      totalCopies: String(book.totalCopies),
      availableCopies: String(book.availableCopies),
      genre: book.genre?._id || book.genre || '',
    });
    setError('');
    setNotice('');
  };

  const resetForm = () => {
    setEditingId('');
    setForm({ ...emptyBook, genre: genres[0]?._id || '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await apiRequest(editingId ? `/api/books/${editingId}` : '/api/books', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(bookPayload(form)),
      });
      await loadData();
      resetForm();
      setNotice(editingId ? 'Book updated.' : 'Book added.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) {
      return;
    }

    setError('');
    setNotice('');
    try {
      await apiRequest(`/api/books/${book._id}`, { method: 'DELETE' });
      setBooks((current) => current.filter((entry) => entry._id !== book._id));
      setNotice('Book deleted.');
      if (editingId === book._id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">Librarian tools</p>
        <h1>Manage books</h1>
      </header>

      <section className="admin-panel">
        <h2>{editingId ? 'Edit book' : 'Add a book'}</h2>
        <form className="admin-book-form" onSubmit={handleSubmit}>
          {[
            ['title', 'Title'],
            ['author', 'Author'],
            ['isbn', 'ISBN'],
            ['coverImage', 'Cover image URL'],
            ['totalCopies', 'Total copies'],
            ['availableCopies', 'Available copies'],
          ].map(([name, label]) => (
            <label className="field-group" key={name}>
              <span>{label}</span>
              <input
                name={name}
                type={name.includes('Copies') ? 'number' : 'text'}
                min={name === 'totalCopies' ? '1' : name === 'availableCopies' ? '0' : undefined}
                value={form[name]}
                onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
                required
              />
            </label>
          ))}
          <label className="field-group">
            <span>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
          </label>
          <label className="field-group">
            <span>Genre</span>
            <select
              value={form.genre}
              onChange={(event) => setForm((current) => ({ ...current, genre: event.target.value }))}
              required
            >
              <option value="">Select a genre</option>
              {genres.map((genre) => <option value={genre._id} key={genre._id}>{genre.name}</option>)}
            </select>
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="primary-button" disabled={saving || genres.length === 0}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add book'}
            </button>
            {editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel edit</button>}
          </div>
        </form>
        {error && <p className="state state--error" role="alert">{error}</p>}
        {notice && <p className="booking-success" role="status">{notice}</p>}
      </section>

      <section className="admin-panel">
        <h2>Books</h2>
        {loading ? (
          <div className="state state--loading">Loading books…</div>
        ) : error && books.length === 0 ? (
          <div className="state state--error">{error}</div>
        ) : books.length === 0 ? (
          <div className="state state--empty">No books are in the catalog.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Title</th><th>Author</th><th>Copies</th><th>Genre</th><th>Actions</th></tr></thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.availableCopies} / {book.totalCopies}</td>
                    <td>{book.genre?.name || genres.find((genre) => genre._id === book.genre)?.name || '—'}</td>
                    <td className="admin-actions">
                      <button type="button" className="secondary-button" onClick={() => editBook(book)}>Edit</button>
                      <button type="button" className="danger-button" onClick={() => deleteBook(book)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
