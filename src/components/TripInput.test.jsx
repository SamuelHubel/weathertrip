// src/components/TripInput.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import TripInput from './TripInput';
import { vi } from 'vitest';

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