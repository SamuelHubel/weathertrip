import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/weatherService', () => ({
    default: vi.fn(),
}));

import getWeather from '../services/weatherService';
import getWeatherData from './weatherController.js';

// Helper to build a mock Express req/res pair
const mockReqRes = (body = {}) => {
    const req = { body };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return { req, res };
};

const MOCK_WEATHER_RESPONSE = {
    location:      'New York',
    temperature:   22,
    windspeed:     15,
    weathercode:   1,
    precipitation: 0,
    rain:          0,
    snowfall:      0,
};

describe('getWeatherData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Happy path ────────────────────────────────────────────────────────────

    describe('successful weather fetch', () => {
        it('calls getWeather with lat and lon from the request body', async () => {
            getWeather.mockResolvedValueOnce(MOCK_WEATHER_RESPONSE);

            const { req, res } = mockReqRes({ lat: 40.7128, lon: -74.006 });
            await getWeatherData(req, res);

            expect(getWeather).toHaveBeenCalledWith(40.7128, -74.006);
        });

        it('returns only the expected weather fields', async () => {
            getWeather.mockResolvedValueOnce({
                ...MOCK_WEATHER_RESPONSE,
                // extra field that should NOT appear in the response
                someInternalField: 'should be stripped',
            });

            const { req, res } = mockReqRes({ lat: 40.7128, lon: -74.006 });
            await getWeatherData(req, res);

            expect(res.json).toHaveBeenCalledWith({
                location:      MOCK_WEATHER_RESPONSE.location,
                temperature:   MOCK_WEATHER_RESPONSE.temperature,
                windspeed:     MOCK_WEATHER_RESPONSE.windspeed,
                weathercode:   MOCK_WEATHER_RESPONSE.weathercode,
                precipitation: MOCK_WEATHER_RESPONSE.precipitation,
                rain:          MOCK_WEATHER_RESPONSE.rain,
                snowfall:      MOCK_WEATHER_RESPONSE.snowfall,
            });

            const callArg = res.json.mock.calls[0][0];
            expect(callArg).not.toHaveProperty('someInternalField');
        });

        it('returns zero-value weather fields without omitting them', async () => {
            getWeather.mockResolvedValueOnce(MOCK_WEATHER_RESPONSE);

            const { req, res } = mockReqRes({ lat: 40.7128, lon: -74.006 });
            await getWeatherData(req, res);

            const callArg = res.json.mock.calls[0][0];
            expect(callArg).toHaveProperty('rain', 0);
            expect(callArg).toHaveProperty('snowfall', 0);
            expect(callArg).toHaveProperty('precipitation', 0);
        });
    });

    // ── Error handling ────────────────────────────────────────────────────────

    describe('error handling', () => {
        it('returns 500 when getWeather throws', async () => {
            getWeather.mockRejectedValueOnce(new Error('Weather API unavailable'));

            const { req, res } = mockReqRes({ lat: 40.7128, lon: -74.006 });
            await getWeatherData(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch weather data' });
        });

        it('returns 500 when getWeather rejects with a network error', async () => {
            getWeather.mockRejectedValueOnce(new Error('ECONNREFUSED'));

            const { req, res } = mockReqRes({ lat: 51.5074, lon: -0.1278 });
            await getWeatherData(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch weather data' });
        });
    });



        it('calls res.json with the weather payload', async () => {
            getWeather.mockResolvedValueOnce(MOCK_WEATHER_RESPONSE);

            const { req, res } = mockReqRes({ lat: 40.7128, lon: -74.006 });
            await getWeatherData(req, res);

            // Currently fails because the controller returns the object
            // instead of passing it to res.json.
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ location: 'New York' })
            );
        });
    
});