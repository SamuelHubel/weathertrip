// src/components/TripInput.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import TripInput from './TripInput';
import { vi } from 'vitest';
import fetchTrip from '../services/tripService';

vi.mock('../services/tripService', () => ({ default: vi.fn() }));

test('disables submit button when inputs are empty', () => {
    render(<TripInput addTrip={vi.fn()} />);
    expect(screen.getByText(/PLOT ROUTE/i)).toBeDisabled();
});

test('enables submit button when both inputs are filled', () => {
    render(<TripInput addTrip={vi.fn()} />);
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Denver' } });
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Boulder' } });
    expect(screen.getByText(/PLOT ROUTE/i)).not.toBeDisabled();
});

test('shows the error the server sent', async () => {
    fetchTrip.mockRejectedValue({ response: { data: { error: 'Too many requests, try again later' } } });
    render(<TripInput addTrip={vi.fn()} />);
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Denver' } });
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Boulder' } });
    fireEvent.click(screen.getByText(/PLOT ROUTE/i));

    expect(await screen.findByText('ERR: Too many requests, try again later')).toBeInTheDocument();
});
