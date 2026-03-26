import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// take start and end geocoded locations and return route from OSRM API
// returns raw geometry from OSRM API, which is a list of lat/lon pairs
// decode and send to frontend for rendering on map
const getRoute = async (start, end) => {
  try {
    const url = `${process.env.OSRM_URL}/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}`;
    console.log(`Fetching route from: ${url}`);
    const response = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson'
      }
    });
    // object with distance, duration, and polyline route
    const route = response.data.routes[0];
   
      return {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry
      };
  } catch (error) {
    console.error('Routing error:', error.message);
    return null;
  }
}

export default  getRoute;