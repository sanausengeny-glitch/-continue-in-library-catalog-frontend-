import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SearchBar from './components/SearchBar';

describe('SearchBar', () => {
  it('debounces the search callback', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    vi.useFakeTimers();

    render(<SearchBar value="" onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/search books/i);
    await user.type(input, 'dune');

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);

    expect(onSearch).toHaveBeenCalledWith('dune');

    vi.useRealTimers();
  });
});
