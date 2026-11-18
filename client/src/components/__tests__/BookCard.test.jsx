import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReadingListProvider } from '../../context/ReadingListContext';
import BookCard from '../BookCard';

const book = {
  _id: 'book-dune',
  title: 'Dune',
  author: 'Frank Herbert',
  coverImage: 'https://example.test/dune.jpg',
  genre: { name: 'Science Fiction' },
};

describe('BookCard', () => {
  it('renders book details and adds the book to the reading list', () => {
    render(
      <MemoryRouter>
        <ReadingListProvider>
          <BookCard book={book} />
        </ReadingListProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
    expect(screen.getByText('Science Fiction')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add to reading list' }));

    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('readingList'))).toEqual([book]);
  });
});
