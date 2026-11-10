import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

import getWeather from './weatherService.js';

const POINTS = [[39.7392, -104.9903], [40.7608, -111.891]];

const apiPoint = (latitude, longitude) => ({
  latitude,
  longitude,
  hourly: {
    time: [1700000000, 1700003600],
    temperature_2m: [-2, 4],
    weather_code: [95, 3],
    rain: [8, 0],
    showers: [4, 0],
    snowfall: [0, 0],
    wind_speed_10m: [20, 5],
  },
  daily: {
    sunrise: [1699995600],
    sunset: [1700032800],
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  // inside the second hour, so it stands in for current conditions
  vi.spyOn(Date, 'now').mockReturnValue(1700004000 * 1000);
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
    expect(axios.get.mock.calls[0][1].timeout).toBe(10000);
    expect(params.getAll('current')).toEqual([]);
    expect(params.getAll('hourly')).toEqual([
      'temperature_2m', 'weather_code', 'rain', 'showers', 'snowfall', 'wind_speed_10m',
    ]);
    // more than 10 variables makes Open-Meteo count each point as extra calls
    expect(params.getAll('hourly').length + params.getAll('daily').length).toBeLessThanOrEqual(10);
    expect(params.get('past_hours')).toBe('6');
    expect(params.get('forecast_hours')).toBe('12');
    expect(params.get('timeformat')).toBe('unixtime');
    expect(params.getAll('daily')).toEqual(['sunrise', 'sunset']);
    expect(params.get('timezone')).toBe('auto');
  });

  it('maps the response to one weather object per point, in order', async () => {
    axios.get.mockResolvedValue({ data: [apiPoint(39.7, -105), apiPoint(40.8, -111.9)] });
    const result = await getWeather(POINTS);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      location: { latitude: 39.7, longitude: -105 },
      temperature: 4,
      windspeed: 5,
      weathercode: 3,
      precipitation: 0,
      rain: 0,
      snowfall: 0,
      sun: { sunrise: 1699995600000, sunset: 1700032800000 },
      hourly: [
        { time: 1700000000000, temperature: -2, weathercode: 95, precipitation: 12, rain: 12, snowfall: 0, windspeed: 20 },
        { time: 1700003600000, temperature: 4, weathercode: 3, precipitation: 0, rain: 0, snowfall: 0, windspeed: 5 },
      ],
    });
    expect(result[1].location).toEqual({ latitude: 40.8, longitude: -111.9 });
  });

  it('counts snow as its water equivalent in precipitation', async () => {
    const point = apiPoint(39.7, -105);
    point.hourly.snowfall = [0, 1.4];
    axios.get.mockResolvedValue({ data: point });
    const [result] = await getWeather([POINTS[0]]);

    expect(result.precipitation).toBe(2);
    expect(result.snowfall).toBe(1.4);
  });

  it('handles the single object Open-Meteo returns for one point', async () => {
    axios.get.mockResolvedValue({ data: apiPoint(39.7, -105) });
    const result = await getWeather([POINTS[0]]);

    expect(result).toHaveLength(1);
    expect(result[0].temperature).toBe(4);
  });

  it('handles missing current data gracefully', async () => {
    axios.get.mockResolvedValue({ data: { latitude: 1, longitude: 2 } });
    const [point] = await getWeather([POINTS[0]]);

    expect(point.temperature).toBeUndefined();
    expect(point.rain).toBeUndefined();
    expect(point.hourly).toEqual([]);
    expect(point.sun).toBeNull();
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
