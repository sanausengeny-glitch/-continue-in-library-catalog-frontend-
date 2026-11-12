import { useContext } from 'react';
import { ReadingListContext } from '../context/ReadingListContext';

export default function useReadingList() {
  const context = useContext(ReadingListContext);

  if (!context) {
    throw new Error('useReadingList must be used within a ReadingListProvider');
  }

  return context;
}
