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

test('a guest trip is saved after signing in', async () => {
    const posts = [];
    axios.defaults.adapter = async (config) => {
        if (config.url.endsWith('/api/auth/login')) {
            return respond(config, 200, { token: 'fresh', email: 'a@b.co' });
        }
        if (config.method === 'post') {
            posts.push({ body: JSON.parse(config.data), auth: config.headers.get('Authorization') });
            return respond(config, 200, { route: {}, weather: [] });
        }
        return respond(config, 200, []);
    };

    render(<App />);
    const [start, end] = screen.getAllByRole('textbox');
    fireEvent.change(start, { target: { value: 'Denver' } });
    fireEvent.change(end, { target: { value: 'Boulder' } });
    fireEvent.click(screen.getByText('[ PLOT ROUTE ]'));

    await screen.findByText('Sign in to save your trips.');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
    fireEvent.submit(screen.getByLabelText('Email').closest('form'));

    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1].body).toEqual({ start: 'Denver', end: 'Boulder' });
    expect(posts[1].auth).toBe('Bearer fresh');
});
