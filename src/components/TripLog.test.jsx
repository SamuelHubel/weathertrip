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

  it('renders nothing when there are no trips', () => {
    const { container } = render(<TripLog tripLog={[]} onReplot={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
