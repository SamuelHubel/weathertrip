import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Stub env before import
vi.stubEnv('WEATHER_URL', 'https://api.open-meteo.com/v1/forecast');

// Mock axios
vi.mock('axios');

import getWeather from './weatherService.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const LAT = 39.7392;
const LON = -104.9903;

const mockApiResponse = {
  data: {
    latitude: LAT,
    longitude: LON,
    current_weather: {
      temperature: 12.5,
      windspeed: 18.3,
      weathercode: 3,
      time: '2026-04-03T14:00',
    },
    hourly: {
      time: ['2026-04-03T14:00'],
      precipitation: [0.2],
      rain: [0.1],
      snowfall: [0.0],
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Happy path ──────────────────────────────────────────────────────────────

describe('getWeather — success', () => {
  it('returns transformed weather object', async () => {
    axios.get.mockResolvedValue(mockApiResponse);

    const result = await getWeather(LAT, LON);

    expect(result).toEqual({
      location: {
        latitude: LAT,
        longitude: LON,
      },
      temperature: 12.5,
      windspeed: 18.3,
      weathercode: 3,
      precipitation: 0.2,
      rain: 0.1,
      snowfall: 0.0,
    });
  });

  it('calls axios.get once', async () => {
    axios.get.mockResolvedValue(mockApiResponse);

    await getWeather(LAT, LON);

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('builds correct URL with query params', async () => {
    axios.get.mockResolvedValue(mockApiResponse);

    await getWeather(LAT, LON);

    const calledUrl = axios.get.mock.calls[0][0];

    expect(calledUrl).toContain(`latitude=${LAT}`);
    expect(calledUrl).toContain(`longitude=${LON}`);
    expect(calledUrl).toContain('current_weather=true');
    expect(calledUrl).toContain('hourly=precipitation,rain,snowfall');
  });

  it('uses WEATHER_URL env variable', async () => {
    axios.get.mockResolvedValue(mockApiResponse);

    await getWeather(LAT, LON);

    const calledUrl = axios.get.mock.calls[0][0];

    expect(calledUrl).toContain('api.open-meteo.com');
  });

  it('extracts correct hourly values (index 0)', async () => {
    axios.get.mockResolvedValue(mockApiResponse);

    const result = await getWeather(LAT, LON);

    expect(result.precipitation).toBe(0.2);
    expect(result.rain).toBe(0.1);
    expect(result.snowfall).toBe(0.0);
  });
});

// ── Edge cases ──────────────────────────────────────────────────────────────

describe('getWeather — edge cases', () => {
  it('handles missing hourly data gracefully', async () => {
    axios.get.mockResolvedValue({
      data: {
        latitude: LAT,
        longitude: LON,
        current_weather: {
          temperature: 10,
          windspeed: 5,
          weathercode: 1,
        },
        hourly: {},
      },
    });

    const result = await getWeather(LAT, LON);

    expect(result.precipitation).toBeUndefined();
    expect(result.rain).toBeUndefined();
    expect(result.snowfall).toBeUndefined();
  });

  it('handles missing current_weather gracefully', async () => {
    axios.get.mockResolvedValue({
      data: {
        latitude: LAT,
        longitude: LON,
        hourly: {
          precipitation: [0.5],
          rain: [0.3],
          snowfall: [0.2],
        },
      },
    });

    const result = await getWeather(LAT, LON);

    expect(result.temperature).toBeUndefined();
    expect(result.windspeed).toBeUndefined();
    expect(result.weathercode).toBeUndefined();
  });
});

// ── Error handling ──────────────────────────────────────────────────────────

describe('getWeather — error handling', () => {
  it('returns null on network error', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    const result = await getWeather(LAT, LON);

    expect(result).toBeNull();
  });

  it('returns null on API error', async () => {
    axios.get.mockRejectedValue({
      response: { status: 500 },
    });

    const result = await getWeather(LAT, LON);

    expect(result).toBeNull();
  });

  it('never throws', async () => {
    axios.get.mockRejectedValue(new Error('timeout'));

    await expect(getWeather(LAT, LON)).resolves.not.toThrow();
  });
});

// ── Route sampling behavior ─────────────────────────────────────────────────

describe('getWeather — multiple calls (route sampling)', () => {
  const points = [
    { lat: 39.7, lon: -104.9 },
    { lat: 40.0, lon: -106.8 },
    { lat: 40.7, lon: -111.9 },
  ];

  it('can be called for multiple points', async () => {
    axios.get.mockResolvedValue(mockApiResponse);

    const results = await Promise.all(
      points.map(p => getWeather(p.lat, p.lon))
    );

    expect(results).toHaveLength(points.length);
  });

  it('calls axios once per point', async () => {
    axios.get.mockResolvedValue(mockApiResponse);

    await Promise.all(points.map(p => getWeather(p.lat, p.lon)));

    expect(axios.get).toHaveBeenCalledTimes(points.length);
  });

  it('handles mixed success/failure', async () => {
    axios.get
      .mockResolvedValueOnce(mockApiResponse)
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(mockApiResponse);

    const results = await Promise.all(
      points.map(p => getWeather(p.lat, p.lon))
    );

    expect(results[0]).not.toBeNull();
    expect(results[1]).toBeNull();
    expect(results[2]).not.toBeNull();
  });
});