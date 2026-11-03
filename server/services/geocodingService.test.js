// tests for geocodingService
// lookups are cached and spaced 1.1 s apart, so each test uses its own place name

import { test, expect, vi } from 'vitest';
import geocodingService from './geocodingService';
import axios from 'axios';

test('geocodingService should return geocoding data for a valid location query', async () => {
  axios.get = vi.fn().mockResolvedValue({ data: [{ lat: '39.7392364', lon: '-104.990251' }] });

  const result = await geocodingService.geocodeLocation('Denver, CO');
  expect(result).toEqual({ lat: 39.7392364, lon: -104.990251 });
});

test('geocodingService should return null for an invalid location query', async () => {
  axios.get = vi.fn().mockResolvedValue({ data: [] });

  const result = await geocodingService.geocodeLocation('InvalidLocation12345');
  expect(result).toBeNull();
});

test('an API error throws instead of looking like an unknown place, and is not cached', async () => {
  axios.get = vi.fn().mockRejectedValue(new Error('API error'));
  await expect(geocodingService.geocodeLocation('Boise, ID')).rejects.toThrow('API error');

  axios.get = vi.fn().mockResolvedValue({ data: [{ lat: '43.6', lon: '-116.2' }] });
  await expect(geocodingService.geocodeLocation('Boise, ID')).resolves.toEqual({ lat: 43.6, lon: -116.2 });
});

test('a repeated place is answered from the cache', async () => {
  axios.get = vi.fn().mockResolvedValue({ data: [{ lat: '40.76', lon: '-111.89' }] });

  await geocodingService.geocodeLocation('Salt Lake City, UT');
  const again = await geocodingService.geocodeLocation('  salt lake city, ut ');
  expect(again).toEqual({ lat: 40.76, lon: -111.89 });
  expect(axios.get).toHaveBeenCalledTimes(1);
});
