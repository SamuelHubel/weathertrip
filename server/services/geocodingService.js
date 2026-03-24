import axios from 'axios';


// take location string and return geocoded location with lat and lon
// from Nominatim API
// return null if no results found
const geocodingService = {
  async geocode(address) {
    const response = await axios.get(`${process.env.NOMINATIM_URL}/search`, {
      params: {
        q: address,
        format: 'json'
      }
    });
    return response.data[0] || null;
    // returns lat, lon
    }

};

export default geocodingService;