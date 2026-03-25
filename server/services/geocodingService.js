import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Take location string and return geocoded location with lat and lon
// from Nominatim API
// Returns { lat, lon } or null if not found
const geocodingService = {
  async geocodeLocation(locationString) {
    try {
      const response = await axios.get(`${process.env.NOMINATIM_URL}/search`, {
        params: {
          q: locationString,
          format: 'json'
        },
        headers: {
          'User-Agent': 'WeatherTripApp/1.0 (road-trip-weather-app)'
        }
      });

      if (!response.data || response.data.length === 0) {
        console.warn(`No results found for location: ${locationString}`);
        return null;
      }

      const result = response.data[0];
      console.log(`Geocoded "${locationString}" to lat: ${result.lat}, lon: ${result.lon}`);
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
    } catch (error) {
      console.error(`Geocoding error for "${locationString}":`, error.message);
      return null;
    }
  }
};

export default geocodingService;