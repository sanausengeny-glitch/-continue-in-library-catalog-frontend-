import { useMemo, useState } from 'react';
import BookCard from '../components/BookCard';
import GenreFilter from '../components/GenreFilter';
import ReadingListPanel from '../components/ReadingListPanel';
import SearchBar from '../components/SearchBar';
import useBooks from '../hooks/useBooks';

export default function CatalogPage() {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { books, pagination, loading, error } = useBooks({
    genre: selectedGenre,
    search: searchTerm,
    page,
  });

  const emptyMessage = useMemo(() => {
    if (selectedGenre && searchTerm) {
      return 'No books match the selected genre and search term.';
    }

    if (selectedGenre) {
      return 'No books are available in this genre right now.';
    }

    if (searchTerm) {
      return 'No books match your search.';
    }

    return 'No books are available in the catalog at the moment.';
  }, [searchTerm, selectedGenre]);

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Explore the collection</p>
          <h1>Library Catalog</h1>
        </div>
      </header>

      <section className="toolbar" aria-label="Catalog controls">
        <SearchBar value={searchTerm} onSearch={(value) => {
          setPage(1);
          setSearchTerm(value);
        }} />
        <GenreFilter
          selectedGenre={selectedGenre}
          onSelect={(value) => {
            setPage(1);
            setSelectedGenre(value);
          }}
        />
      </section>

      <div className="catalog-layout">
        <div className="catalog-main">
          {loading ? (
            <div className="state state--loading">Loading books…</div>
          ) : error ? (
            <div className="state state--error">{error}</div>
          ) : books.length === 0 ? (
            <div className="state state--empty">{emptyMessage}</div>
          ) : (
            <>
              <section className="catalog-grid" aria-live="polite">
                {books.map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </section>

              {pagination.totalPages > 1 && (
                <div className="pagination" aria-label="Book pagination">
                  <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    Previous
                  </button>
                  <span>
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <ReadingListPanel />
      </div>
    </main>
  );
}
