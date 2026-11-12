import { Link } from 'react-router-dom';
import useReadingList from '../hooks/useReadingList';

export default function BookCard({ book }) {
  const { addBook, readingList, removeBook } = useReadingList();
  const genreName = book?.genre?.name || 'General';
  const bookId = book?._id || book?.id;
  const isSaved = readingList.some((item) => (item?._id || item?.id) === bookId);

  const handleSaveToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isSaved) {
      removeBook(bookId);
      return;
    }

    addBook(book);
  };

  return (
    <div className="book-card">
      <Link to={`/books/${book._id}`} className="book-card__link" aria-label={`Open details for ${book.title}`}>
        <img
          src={book.coverImage}
          alt={`${book.title} cover`}
          className="book-cover"
          loading="lazy"
        />
        <div className="book-card__body">
          <span className="book-card__genre">{genreName}</span>
          <h3>{book.title}</h3>
          <p>{book.author}</p>
        </div>
      </Link>

      <div className="book-card__actions">
        <button type="button" className="reading-toggle" onClick={handleSaveToggle}>
          {isSaved ? 'Saved' : 'Add to reading list'}
        </button>
      </div>
    </div>
  );
}
