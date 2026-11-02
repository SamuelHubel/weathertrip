// test for App component
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import { afterEach, beforeEach, vi } from 'vitest';
import App from './App';

const originalAdapter = axios.defaults.adapter;

const respond = (config, status, data) => {
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) throw Object.assign(new Error(`status ${status}`), { config, response });
    return response;
};

beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    axios.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
});

test('renders the app header', () => {
    axios.defaults.adapter = async (config) => respond(config, 200, []);
    render(<App />);
    expect(screen.getByText(/Weather.Trip/i)).toBeInTheDocument();
});

test('an expired session signs the user out and opens the login box', async () => {
    localStorage.setItem('wt_token', 'expired');
    axios.defaults.adapter = async (config) => respond(config, 401, { error: 'Session expired' });

    render(<App />);

    await screen.findByText('Sign in to save your trips.');
    expect(localStorage.getItem('wt_token')).toBeNull();
    await waitFor(() => expect(screen.queryByText('[ SIGN OUT ]')).not.toBeInTheDocument());
});
