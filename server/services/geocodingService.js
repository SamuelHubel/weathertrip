import axios from 'axios';

// Take location string and return geocoded location with lat and lon
// from Nominatim API
// Returns { lat, lon } or null if not found
const geocodingService = {
  async geocodeLocation(locationString) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: locationString,
          format: 'json'
        }
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
};

export default geocodingService;