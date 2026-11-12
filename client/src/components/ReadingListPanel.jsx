import useReadingList from '../hooks/useReadingList';

export default function ReadingListPanel() {
  const { readingList, removeBook } = useReadingList();

  return (
    <aside className="reading-list">
      <h2>Reading list</h2>

      {readingList.length === 0 ? (
        <p className="reading-list__empty">Your reading list is empty.</p>
      ) : (
        <ul className="reading-list__items">
          {readingList.map((book) => (
            <li key={book._id || book.id}>
              <span>{book.title}</span>
              <button type="button" onClick={() => removeBook(book._id || book.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
