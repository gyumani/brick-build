import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders tetris game', () => {
  render(<App />);
  const titleElement = screen.getByText(/TETRIS/i);
  expect(titleElement).toBeInTheDocument();
});
