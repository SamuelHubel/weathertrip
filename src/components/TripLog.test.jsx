// tests for TripLog component
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TripLog from './TripLog';

const entry = {
  _id: 't1',
  start: { location: 'Denver' },
  end: { location: 'Boulder' },
  createdAt: '2026-04-03T14:00:00Z',
};

describe('TripLog', () => {
  it('renders trip log entries', () => {
    render(<TripLog tripLog={[entry]} onReplot={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Denver → Boulder/ })).toBeInTheDocument();
  });

  it('calls onReplot when an entry is clicked', () => {
    const onReplot = vi.fn();
    render(<TripLog tripLog={[entry]} onReplot={onReplot} />);

    fireEvent.click(screen.getByRole('button', { name: /Denver → Boulder/ }));

    expect(onReplot).toHaveBeenCalledWith(entry);
  });

  it('keeps the keyboard out of the panel until it is opened', () => {
    render(<TripLog tripLog={[entry]} onReplot={vi.fn()} />);
    const header = screen.getByRole('button', { name: /Trip Log/ });
    const body = screen.getByRole('button', { name: /Denver → Boulder/ }).closest('.panel-body');

    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(body).toHaveAttribute('inert');

    fireEvent.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(body).not.toHaveAttribute('inert');
  });
});
