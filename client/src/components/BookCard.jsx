import { Link } from 'react-router-dom';

export default function BookCard({ book }) {
  const genreName = book?.genre?.name || 'General';

  return (
    <Link to={`/books/${book._id}`} className="book-card" aria-label={`Open details for ${book.title}`}>
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
  );
}
