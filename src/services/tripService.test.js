import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import fetchTrip from './tripService';

vi.mock('axios');

const mockTripResponse = {
    data: {
        start: { lat: 39.7392364, lon: -104.990251 },
        end: { lat: 40.7608, lon: -111.8910 },
        route: {
            distance: 685000,
            duration: 22200,
            geometry: [[39.7392364, -104.990251], [40.1, -106.5], [40.7608, -111.8910]],
        },
    },
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('fetchTrip', () => {
    it('returns trip data for valid start and end locations', async () => {
        axios.post.mockResolvedValue(mockTripResponse);

        const result = await fetchTrip('Denver, CO', 'Salt Lake City, UT');

        expect(result).toEqual(mockTripResponse.data);
    });

    it('sends a POST request to the correct endpoint', async () => {
        axios.post.mockResolvedValue(mockTripResponse);

        await fetchTrip('Denver, CO', 'Salt Lake City, UT');

        expect(axios.post).toHaveBeenCalledWith(
            'http://localhost:5000/api/trip',
            { start: 'Denver, CO', end: 'Salt Lake City, UT' }
        );
    });

    it('returns null when the request fails', async () => {
        axios.post.mockRejectedValue(new Error('Network error'));

        const result = await fetchTrip('Denver, CO', 'Salt Lake City, UT');

        expect(result).toBeNull();
    });

    it('returns null when the server returns an error status', async () => {
        axios.post.mockRejectedValue({ response: { status: 500, data: { error: 'Internal server error' } } });

        const result = await fetchTrip('Denver, CO', 'Salt Lake City, UT');

        expect(result).toBeNull();
    });

    it('calls the API with trimmed location strings as-is', async () => {
        axios.post.mockResolvedValue(mockTripResponse);

        await fetchTrip('  Denver, CO  ', '  Salt Lake City, UT  ');

        expect(axios.post).toHaveBeenCalledWith(
            'http://localhost:5000/api/trip',
            { start: '  Denver, CO  ', end: '  Salt Lake City, UT  ' }
        );
    });

    it('returns the full route geometry from the response', async () => {
        axios.post.mockResolvedValue(mockTripResponse);

        const result = await fetchTrip('Denver, CO', 'Salt Lake City, UT');

        expect(result.route.geometry).toEqual(mockTripResponse.data.route.geometry);
    });

    it('returns the correct start and end coordinates', async () => {
        axios.post.mockResolvedValue(mockTripResponse);

        const result = await fetchTrip('Denver, CO', 'Salt Lake City, UT');

        expect(result.start).toEqual({ lat: 39.7392364, lon: -104.990251 });
        expect(result.end).toEqual({ lat: 40.7608, lon: -111.8910 });
    });
});