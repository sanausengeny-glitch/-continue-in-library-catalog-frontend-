import { render, screen, fireEvent } from '@testing-library/react';
import { useContext } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ReadingListContext, ReadingListProvider } from './ReadingListContext';

function TestConsumer() {
  const { readingList, addBook, removeBook, clearList } = useContext(ReadingListContext);

  return (
    <div>
      <p>{readingList.length}</p>
      <button type="button" onClick={() => addBook({ _id: 'b1', title: 'Dune' })}>add</button>
      <button type="button" onClick={() => removeBook('b1')}>remove</button>
      <button type="button" onClick={() => clearList()}>clear</button>
    </div>
  );
}

describe('ReadingListProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists the list across refreshes and supports add/remove/clear actions', () => {
    render(
      <MemoryRouter>
        <ReadingListProvider>
          <TestConsumer />
        </ReadingListProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('add'));
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('readingList') || '[]')).toHaveLength(1);

    fireEvent.click(screen.getByText('remove'));
    expect(screen.getByText('0')).toBeInTheDocument();

    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('clear'));
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('readingList') || '[]')).toEqual([]);
  });
});
