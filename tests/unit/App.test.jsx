import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
});

test('renders the portfolio and a base-aware resume link without calling the backend', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'Kimberly Sereduck' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Resume PDF' })).toHaveAttribute(
    'href', '/portfolio/assets/aistudio/resume-11-20-again_f670004d.pdf'
  );
  await waitFor(() => expect(screen.getAllByText(/was not found/)).toHaveLength(2));
  expect(fetch.mock.calls.every(([url]) => url.startsWith('https://api.github.com/'))).toBe(true);
});

test('refresh retries the connected GitHub profiles', async () => {
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() => expect(screen.getAllByText(/was not found/)).toHaveLength(2));
  expect(fetch).toHaveBeenCalledTimes(4);
  await user.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(8));
});
