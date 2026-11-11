import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DriveSheet from './DriveSheet';

const weatherTrip = {
  route: {
    distance: 685000,
    duration: 22200,
    geometry: [[39.74, -104.99], [40.76, -111.89]],
  },
  weather: [
    {
      location: { latitude: 39.74, longitude: -104.99 },
      temperature: 4,
      windspeed: 15,
      rain: 12,
      snowfall: 0,
      weathercode: 63,
    },
  ],
};

const renderSheet = (trip, props = {}) =>
  render(<DriveSheet trip={trip} label="Denver → Boulder" selected={null} onSelect={vi.fn()} {...props} />);

const timeline = () => within(screen.getByRole('list', { name: 'Stops' }));

describe('DriveSheet', () => {
  // place-name lookups hit Nominatim; keep tests offline
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ address: { city: 'Denver', state: 'Colorado' } }),
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('summarises distance, drive time and the route label', () => {
    renderSheet(weatherTrip);
    expect(screen.getByText('Denver → Boulder')).toBeInTheDocument();
    expect(screen.getByText('426 mi')).toBeInTheDocument();
    expect(screen.getByText('6h 10m')).toBeInTheDocument();
  });

  it('follows a swipe up, stays put, and closes when dragged back down', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    renderSheet(weatherTrip);
    const summary = screen.getByRole('button', { expanded: false });
    const sheet = screen.getByRole('complementary', { name: 'Your drive' });
    fireEvent.touchStart(summary, { touches: [{ clientY: 300 }] });
    fireEvent.touchMove(summary, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(summary);
    expect(summary).toHaveAttribute('aria-expanded', 'true');
    expect(sheet.style.height).toBe('100px');
    // jsdom has no layout, so offsetHeight reads 0 at the next drag start
    fireEvent.touchStart(summary, { touches: [{ clientY: 200 }] });
    fireEvent.touchMove(summary, { touches: [{ clientY: 300 }] });
    fireEvent.touchEnd(summary);
    expect(summary).toHaveAttribute('aria-expanded', 'false');
    expect(sheet.style.height).toBe('');
  });

  it('ignores drags on the desktop layout', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    renderSheet(weatherTrip);
    const summary = screen.getByRole('button', { expanded: false });
    fireEvent.touchStart(summary, { touches: [{ clientY: 300 }] });
    fireEvent.touchMove(summary, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(summary);
    expect(summary).toHaveAttribute('aria-expanded', 'false');
  });

  it('formats a sub-hour duration as minutes only', () => {
    renderSheet({ ...weatherTrip, route: { ...weatherTrip.route, duration: 2700 } });
    expect(screen.getByText('45m')).toBeInTheDocument();
  });

  it('shows the place name for each stop', async () => {
    renderSheet(weatherTrip);
    expect(await timeline().findByText('Denver, Colorado')).toBeInTheDocument();
  });

  it('shows temperatures and wind in US units', () => {
    renderSheet(weatherTrip);
    expect(timeline().getByText('39°F')).toBeInTheDocument();
    expect(timeline().getByText('Wind 34 mph')).toBeInTheDocument();
  });

  it('does not report an all-clear when the trip has no weather data', () => {
    renderSheet({ route: { geometry: [[1, 2]] } });
    expect(screen.queryByText(/No notable weather/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Weather could not be loaded/i)).toBeInTheDocument();
  });

  it('reports a clear drive when no point has notable conditions', () => {
    renderSheet({
      ...weatherTrip,
      weather: [{ location: { latitude: 39.74, longitude: -104.99 }, temperature: 18, windspeed: 3, rain: 0, snowfall: 0, weathercode: 0 }],
    });
    expect(screen.getByText(/no notable weather along this route/i)).toBeInTheDocument();
  });

  it('does not flag medium-severity conditions', () => {
    renderSheet({
      ...weatherTrip,
      weather: [{ location: { latitude: 39.74, longitude: -104.99 }, temperature: 12, windspeed: 13, rain: 1, snowfall: 0, weathercode: 51 }],
    });
    expect(screen.queryByText(/rain showers ahead/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no notable weather along this route/i)).toBeInTheDocument();
  });

  it('flags a hazard on its stop and leads the summary with it', () => {
    renderSheet(weatherTrip);
    expect(timeline().getByText(/heavy rain expected/i)).toBeInTheDocument();
    expect(timeline().getByText(/wind 34 mph · rain 0.47 in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /your drive/i })).toHaveTextContent(/heavy rain expected/i);
  });

  it('selects a stop, and deselects it on a second click', () => {
    const onSelect = vi.fn();
    const { rerender } = renderSheet(weatherTrip, { onSelect });
    const stop = timeline().getByRole('button');

    fireEvent.click(stop);
    expect(onSelect).toHaveBeenLastCalledWith(0);

    rerender(<DriveSheet trip={weatherTrip} label="" selected={0} onSelect={onSelect} />);
    expect(stop).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(stop);
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it('gives each stop a weather scene and the header the sky condition', () => {
    const trip = {
      ...weatherTrip,
      weather: [
        { location: { latitude: 39.7, longitude: -105 }, weathercode: 0 },
        { location: { latitude: 40.5, longitude: -108 }, weathercode: 95 },
      ],
    };
    renderSheet(trip, { condition: 'storm' });
    const scenes = timeline().getAllByRole('button').map((b) => b.dataset.wx);
    expect(scenes).toEqual(['clear', 'storm']);
    expect(screen.getByRole('button', { name: /your drive/i })).toHaveAttribute('data-wx', 'storm');
  });

  it('gives each stop its own local time of day', () => {
    const now = new Date();
    const H = 3600000;
    const t = now.getTime();
    const trip = {
      ...weatherTrip,
      weather: [
        { location: { latitude: 39.7, longitude: -105 }, weathercode: 0, sun: { sunrise: t - 5 * H, sunset: t + 5 * H } },
        { location: { latitude: 40.5, longitude: -112 }, weathercode: 0, sun: { sunrise: t - 14 * H, sunset: t - 3 * H } },
      ],
    };
    renderSheet(trip, { now, time: 'day' });
    const times = timeline().getAllByRole('button').map((b) => b.dataset.skyTime);
    expect(times).toEqual(['day', 'night']);
    expect(screen.getByRole('button', { name: /your drive/i })).toHaveAttribute('data-sky-time', 'day');
  });

  it('clears the selection from the summary header', () => {
    const onSelect = vi.fn();
    renderSheet(weatherTrip, { onSelect, selected: 0 });
    fireEvent.click(screen.getByRole('button', { name: /your drive/i }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  describe('hourly window', () => {
    const HOUR = 3600000;
    const calm = { weathercode: 0, rain: 0, snowfall: 0, windspeed: 2 };
    const storm = { weathercode: 95, rain: 4, snowfall: 0, windspeed: 8 };
    const at = (hours, conditions) => ({ time: Date.now() + hours * HOUR, ...conditions });
    const tripWith = (current, hourly) => ({
      route: { geometry: [[39.74, -104.99]] },
      weather: [{ location: { latitude: 39.74, longitude: -104.99 }, temperature: 10, ...current, hourly }],
    });

    it('labels severe current conditions as now', () => {
      renderSheet(tripWith(storm, [at(-2, calm), at(3, calm)]));
      expect(timeline().getByText(/thunderstorm risk/i)).toBeInTheDocument();
      expect(timeline().getByText('now')).toBeInTheDocument();
    });

    it('lists past and future events with relative times, in time order', () => {
      const heavySnow = { weathercode: 75, rain: 0, snowfall: 6, windspeed: 4 };
      renderSheet(tripWith(calm, [at(-4, heavySnow), at(0, calm), at(5, storm)]));

      expect(timeline().getByText('4h ago')).toBeInTheDocument();
      expect(timeline().getByText('in 5h')).toBeInTheDocument();
      const headlines = timeline().getAllByText(/heavy snow expected|thunderstorm risk/i).map(el => el.textContent);
      expect(headlines).toEqual(['Heavy snow expected', 'Thunderstorm risk']);
    });

    it('collapses repeated hours of the same hazard into one span', () => {
      renderSheet(tripWith(calm, [at(-2, storm), at(-1, storm), at(3, storm)]));
      expect(timeline().getAllByText(/thunderstorm risk/i)).toHaveLength(1);
      expect(timeline().getByText('2h ago → in 3h')).toBeInTheDocument();
    });

    it('leads the summary with a hazard still to come, not one already over', () => {
      const heavySnow = { weathercode: 75, rain: 0, snowfall: 6, windspeed: 4 };
      renderSheet(tripWith(calm, [at(-5, storm), at(2, heavySnow)]));
      const summary = screen.getByRole('button', { name: /your drive/i });
      expect(summary).toHaveTextContent(/heavy snow expected/i);
      expect(summary).not.toHaveTextContent(/thunderstorm/i);
    });

    it('counts hazard times down as the clock moves on', () => {
      const trip = tripWith(calm, [at(3, storm)]);
      const { rerender } = renderSheet(trip, { now: new Date() });
      expect(timeline().getByText('in 3h')).toBeInTheDocument();
      rerender(<DriveSheet trip={trip} label="" selected={null} onSelect={vi.fn()} now={new Date(Date.now() + 2 * HOUR)} />);
      expect(timeline().getByText('in 1h')).toBeInTheDocument();
    });

    it('reports a clear drive when every hour is calm', () => {
      renderSheet(tripWith(calm, [at(-3, calm), at(6, calm)]));
      expect(screen.getByText(/no notable weather along this route/i)).toBeInTheDocument();
    });
  });
});
