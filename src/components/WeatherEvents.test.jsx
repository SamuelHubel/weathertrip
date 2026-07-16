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

  it('renders a notable weather event when a weather point meets event thresholds', () => {
    render(<WeatherEvents trip={weatherTrip} />);

    expect(screen.getByText(/heavy rain expected/i)).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
    expect(screen.getByText(/wind 15 m\/s/i)).toBeInTheDocument();
  });
});
