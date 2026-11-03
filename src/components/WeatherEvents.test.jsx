import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WeatherEvents from './WeatherEvents';

const weatherTrip = {
  route: {
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

describe('WeatherEvents', () => {
  it('does not report an all-clear when the trip has no weather data', () => {
    render(<WeatherEvents trip={{ route: { geometry: [[1, 2]] } }} />);
    expect(screen.queryByText(/No notable weather events/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Weather could not be loaded/i)).toBeInTheDocument();
  });

  it('renders a prompt when no route has been entered', () => {
    render(<WeatherEvents trip={null} />);

    expect(screen.getByText(/enter a route to surface weather hazards/i)).toBeInTheDocument();
  });

  it('shows a no-events message when weather points have no notable conditions', () => {
    const trip = {
      route: { geometry: [[39.74, -104.99], [40.76, -111.89]] },
      weather: [
        {
          location: { latitude: 39.74, longitude: -104.99 },
          temperature: 18,
          windspeed: 3,
          rain: 0,
          snowfall: 0,
          weathercode: 0,
        },
      ],
    };

    render(<WeatherEvents trip={trip} />);

    expect(screen.getByText(/no notable weather events were detected/i)).toBeInTheDocument();
  });

  it('does not render medium-severity events in the list', () => {
    const trip = {
      route: { geometry: [[39.74, -104.99], [40.76, -111.89]] },
      weather: [
        {
          location: { latitude: 39.74, longitude: -104.99 },
          temperature: 12,
          windspeed: 13,
          rain: 1,
          snowfall: 0,
          weathercode: 51,
        },
      ],
    };

    render(<WeatherEvents trip={trip} />);

    expect(screen.queryByText(/rain showers ahead/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no notable weather events were detected/i)).toBeInTheDocument();
  });

  it('renders a notable weather event when a weather point meets event thresholds', () => {
    render(<WeatherEvents trip={weatherTrip} />);

    expect(screen.getByText(/heavy rain expected/i)).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
    expect(screen.getByText(/wind 15 m\/s/i)).toBeInTheDocument();
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
      render(<WeatherEvents trip={tripWith(storm, [at(-2, calm), at(3, calm)])} />);

      expect(screen.getByText(/thunderstorm risk/i)).toBeInTheDocument();
      expect(screen.getByText('now')).toBeInTheDocument();
    });

    it('lists past and future events with relative times, in time order', () => {
      const heavySnow = { weathercode: 75, rain: 0, snowfall: 6, windspeed: 4 };
      render(<WeatherEvents trip={tripWith(calm, [at(-4, heavySnow), at(0, calm), at(5, storm)])} />);

      expect(screen.getByText('4h ago')).toBeInTheDocument();
      expect(screen.getByText('in 5h')).toBeInTheDocument();
      const headlines = screen.getAllByText(/heavy snow expected|thunderstorm risk/i).map(el => el.textContent);
      expect(headlines).toEqual(['Heavy snow expected', 'Thunderstorm risk']);
    });

    it('collapses repeated hours of the same hazard into one span', () => {
      render(<WeatherEvents trip={tripWith(calm, [at(-2, storm), at(-1, storm), at(3, storm)])} />);

      expect(screen.getAllByText(/thunderstorm risk/i)).toHaveLength(1);
      expect(screen.getByText('2h ago → in 3h')).toBeInTheDocument();
    });

    it('shows the no-events message when every hour is calm', () => {
      render(<WeatherEvents trip={tripWith(calm, [at(-3, calm), at(6, calm)])} />);

      expect(screen.getByText(/no notable weather events were detected/i)).toBeInTheDocument();
    });
  });
});
