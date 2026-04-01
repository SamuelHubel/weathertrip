// tests for geocodingService
// using vitest
// this module should return geocoding data for a given location query

import { test } from 'vitest';
import geocodingService from './geocodingService';
import axios from 'axios';

test('geocodingService should return geocoding data for a valid location query', async () => {
  const locationString = 'Denver, CO';
  const mockResponse = {
    data: [
      {
        lat: '39.7392364',
        lon: '-104.990251'
      }
    ]
  };    
    // Mock axios.get to return the mock response
    axios.get = vi.fn().mockResolvedValue(mockResponse);

    const result = await geocodingService.geocodeLocation(locationString);
    expect(result).toEqual({ lat: 39.7392364, lon: -104.990251 });
});

test('geocodingService should return null for an invalid location query', async () => {
  const locationString = 'InvalidLocation12345';
  const mockResponse = { data: [] }; // No results found
  axios.get = vi.fn().mockResolvedValue(mockResponse);

  const result = await geocodingService.geocodeLocation(locationString);
  expect(result).toBeNull();
});

test('geocodingService should handle API errors gracefully', async () => {
  const locationString = 'Denver, CO';
  axios.get = vi.fn().mockRejectedValue(new Error('API error'));
  const result = await geocodingService.geocodeLocation(locationString);
  expect(result).toBeNull();
});


