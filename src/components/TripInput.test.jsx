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

    expect(await screen.findByText('Too many requests, try again later')).toBeInTheDocument();
});

test('sends added stops in order and skips blank ones', async () => {
    fetchTrip.mockResolvedValue({});
    const addTrip = vi.fn();
    render(<TripInput addTrip={addTrip} />);
    fireEvent.change(screen.getByPlaceholderText(/From/), { target: { value: 'Denver' } });
    fireEvent.change(screen.getByPlaceholderText(/To/), { target: { value: 'Salt Lake City' } });
    fireEvent.click(screen.getByText('+ Add stop'));
    fireEvent.click(screen.getByText('+ Add stop'));
    fireEvent.change(screen.getByLabelText('Stop 1'), { target: { value: 'Moab' } });
    fireEvent.click(screen.getByText(/PLOT ROUTE/i));

    await vi.waitFor(() => expect(addTrip).toHaveBeenCalledWith({}, 'Denver', 'Salt Lake City', ['Moab']));
    expect(fetchTrip).toHaveBeenCalledWith('Denver', 'Salt Lake City', { stops: ['Moab'] });
});

test('removes a stop', () => {
    render(<TripInput addTrip={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add stop'));
    fireEvent.click(screen.getByLabelText('Remove stop 1'));
    expect(screen.queryByLabelText('Stop 1')).not.toBeInTheDocument();
});
