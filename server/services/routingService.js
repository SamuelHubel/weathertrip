import axios from 'axios';
import dotenv from 'dotenv';
import sampleRoute from './routeSamplingService.js';
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
    
    const route = response.data.routes[0];
    // swap lon/lat to lat/lon for frontend
    const coordPairs = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    // return route info with sampled weather points every 80 km along the route
    return {
       
          distance: route.distance,
          duration: route.duration,
          geometry: coordPairs,
          weatherPoints: sampleRoute(coordPairs, 80000)
        
        };
  } 
  catch (error) {
    console.error('Routing error:', error.message);
    return null;
  }

}

export default getRoute;