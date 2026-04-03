// tests for routingService
// using vitest
// this module should return route data for a given origin and destination

import { test } from 'vitest';
import getRoute  from './routingService';
import axios from 'axios'; 

test('routingService should return route data for valid origin and destination', async () => {
    const origin = { lat: 39.7392364, lon: -104.990251 }; // Denver, CO
    const destination = { lat: 40.7608, lon: -111.8910 }; // Salt Lake City, UT
    const mockResponse = {
        data: {
            routes: [{
                distance: 685000,
                duration: 22200,
                geometry: [[39.7392364, -104.990251], [40.1, -106.5], [40.7608, -111.8910]]
            }]
        }
};
    // Mock axios.get to return the mock response
    axios.get = vi.fn().mockResolvedValue(mockResponse);
    const result = await getRoute(origin, destination);
    expect(result).toEqual(mockResponse.data.routes[0]);
});

test('routingService should handle API errors gracefully', async () => {
    const origin = { lat: 39.7392364, lon: -104.990251 }; // Denver, CO
    const destination = { lat: 40.7608, lon: -111.8910 }; // Salt Lake City, UT
    axios.get = vi.fn().mockRejectedValue(new Error('API error'));
    const result = await getRoute(origin, destination);
    expect(result).toBeNull();
});


