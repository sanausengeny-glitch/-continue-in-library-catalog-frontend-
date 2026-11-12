import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import SearchBar from './components/SearchBar';

describe('SearchBar', () => {
  it('debounces the search callback', () => {
    vi.useFakeTimers();

    try {
      const onSearch = vi.fn();

      render(<SearchBar value="" onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/search books/i);
      fireEvent.change(input, { target: { value: 'dune' } });

      expect(onSearch).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(onSearch).toHaveBeenCalledWith('dune');
    } finally {
      vi.useRealTimers();
    }
  });
});
