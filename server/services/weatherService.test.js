import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

import getWeather from './weatherService.js';

const POINTS = [[39.7392, -104.9903], [40.7608, -111.891]];

const apiPoint = (latitude, longitude) => ({
  latitude,
  longitude,
  current: {
    temperature_2m: 12.5,
    wind_speed_10m: 18.3,
    weather_code: 3,
    precipitation: 0.2,
    rain: 0.1,
    snowfall: 0.0,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getWeather', () => {
  it('asks for every point and field in one request', async () => {
    axios.get.mockResolvedValue({ data: [apiPoint(39.7, -105), apiPoint(40.8, -111.9)] });
    await getWeather(POINTS);

    expect(axios.get).toHaveBeenCalledTimes(1);
    const [calledUrl, { params }] = axios.get.mock.calls[0];
    expect(calledUrl).toContain('api.open-meteo.com');
    expect(params.get('latitude')).toBe('39.7392,40.7608');
    expect(params.get('longitude')).toBe('-104.9903,-111.8910');
    expect(params.get('wind_speed_unit')).toBe('ms');
    expect(params.getAll('current')).toEqual([
      'temperature_2m', 'wind_speed_10m', 'weather_code', 'precipitation', 'rain', 'snowfall',
    ]);
  });

  it('maps the response to one weather object per point, in order', async () => {
    axios.get.mockResolvedValue({ data: [apiPoint(39.7, -105), apiPoint(40.8, -111.9)] });
    const result = await getWeather(POINTS);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      location: { latitude: 39.7, longitude: -105 },
      temperature: 12.5,
      windspeed: 18.3,
      weathercode: 3,
      precipitation: 0.2,
      rain: 0.1,
      snowfall: 0.0,
    });
    expect(result[1].location).toEqual({ latitude: 40.8, longitude: -111.9 });
  });

  it('handles the single object Open-Meteo returns for one point', async () => {
    axios.get.mockResolvedValue({ data: apiPoint(39.7, -105) });
    const result = await getWeather([POINTS[0]]);

    expect(result).toHaveLength(1);
    expect(result[0].temperature).toBe(12.5);
  });

  it('handles missing current data gracefully', async () => {
    axios.get.mockResolvedValue({ data: { latitude: 1, longitude: 2 } });
    const [point] = await getWeather([POINTS[0]]);

    expect(point.temperature).toBeUndefined();
    expect(point.rain).toBeUndefined();
  });

  it('returns null for invalid coordinates or no points', async () => {
    expect(await getWeather([[undefined, undefined]])).toBeNull();
    expect(await getWeather([])).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('returns null when the request fails', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    expect(await getWeather(POINTS)).toBeNull();
  });
});
