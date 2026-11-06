// test for App component
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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

test('renders the brand and the empty-state prompt', () => {
    axios.defaults.adapter = async (config) => respond(config, 200, []);
    render(<App />);
    expect(screen.getByRole('heading', { name: /Weather.Trip/i })).toBeInTheDocument();
    expect(screen.getByText('Where are we headed?')).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Your drive' })).not.toBeInTheDocument();
});

test('selecting a stop re-skies the app to that point', async () => {
    const H = 3600000;
    const now = Date.now();
    // origin in daylight, the far stop already past sunset
    const weather = [
        { location: { latitude: 39.7, longitude: -105 }, weathercode: 0, temperature: 20, windspeed: 2, sun: { sunrise: now - 5 * H, sunset: now + 5 * H } },
        { location: { latitude: 40.5, longitude: -108 }, weathercode: 95, temperature: 15, windspeed: 8, sun: { sunrise: now - 14 * H, sunset: now - 3 * H } },
    ];
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    axios.defaults.adapter = async (config) =>
        config.method === 'post' ? respond(config, 200, { route: {}, weather }) : respond(config, 200, []);

    const { container } = render(<App />);
    const app = container.querySelector('.app');
    const [start, end] = screen.getAllByRole('textbox');
    fireEvent.change(start, { target: { value: 'Denver' } });
    fireEvent.change(end, { target: { value: 'Grand Junction' } });
    fireEvent.click(screen.getByText('Plot route'));

    await screen.findByRole('complementary', { name: 'Your drive' });
    expect(app).toHaveAttribute('data-sky-condition', 'storm');
    expect(app).toHaveAttribute('data-sky-time', 'day');

    const stops = within(screen.getByRole('list', { name: 'Stops' })).getAllByRole('button');
    fireEvent.click(stops[0]);
    expect(app).toHaveAttribute('data-sky-condition', 'clear');
    expect(screen.getByRole('button', { name: /your drive/i })).toHaveAttribute('data-wx', 'clear');

    fireEvent.click(stops[0]);
    expect(app).toHaveAttribute('data-sky-condition', 'storm');

    fireEvent.click(stops[1]);
    expect(app).toHaveAttribute('data-sky-time', 'night');
    vi.unstubAllGlobals();
});

test('an expired session signs the user out and opens the login box', async () => {
    localStorage.setItem('wt_token', 'expired');
    axios.defaults.adapter = async (config) => respond(config, 401, { error: 'Session expired' });

    render(<App />);

    await screen.findByText('Sign in to save your trips.');
    expect(localStorage.getItem('wt_token')).toBeNull();
    await waitFor(() => expect(screen.queryByText('Sign out')).not.toBeInTheDocument());
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
    fireEvent.click(screen.getByText('Plot route'));

    await screen.findByText('Sign in to save your trips.');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
    fireEvent.submit(screen.getByLabelText('Email').closest('form'));

    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1].body).toEqual({ start: 'Denver', end: 'Boulder', stops: [] });
    expect(posts[1].auth).toBe('Bearer fresh');
});
