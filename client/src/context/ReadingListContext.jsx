import { createContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'readingList';

export const ReadingListContext = createContext(null);

export function ReadingListProvider({ children }) {
  const [readingList, setReadingList] = useState(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const savedList = window.localStorage.getItem(STORAGE_KEY);
      return savedList ? JSON.parse(savedList) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(readingList));
    }
  }, [readingList]);

  const addBook = (book) => {
    if (!book) {
      return;
    }

    setReadingList((current) => {
      const bookId = book._id || book.id;
      if (!bookId || current.some((item) => (item?._id || item?.id) === bookId)) {
        return current;
      }

      return [...current, book];
    });
  };

  const removeBook = (bookId) => {
    setReadingList((current) => current.filter((item) => (item?._id || item?.id) !== bookId));
  };

  const clearList = () => {
    setReadingList([]);
  };

  const value = useMemo(
    () => ({ readingList, addBook, removeBook, clearList }),
    [readingList],
  );

  return (
    <ReadingListContext.Provider value={value}>
      {children}
    </ReadingListContext.Provider>
  );
}
