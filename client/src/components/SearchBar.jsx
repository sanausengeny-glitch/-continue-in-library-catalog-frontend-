import { useEffect, useState } from 'react';

export default function SearchBar({ value, onSearch }) {
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <label className="search-bar" htmlFor="book-search">
      <span className="search-bar__label">Search</span>
      <input
        id="book-search"
        type="search"
        value={query}
        placeholder="Search books"
        onChange={(event) => setQuery(event.target.value)}
      />
    </label>
  );
}
