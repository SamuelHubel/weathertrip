import axios from 'axios';
import sampleRoute from './routeSamplingService.js';

// take geocoded points (start, any stops, end) in driving order and return route from OSRM API
// returns the geometry as [lat, lon] pairs plus weather points sampled every 80 km
// returns null when OSRM finds no route; network errors throw so the caller reports a server failure

const getRoute = async (points) => {
  const url = `${process.env.OSRM_URL}/route/v1/driving/${points.map((p) => `${p.lon},${p.lat}`).join(';')}`;
  console.log(`Fetching route from: ${url}`);
  let response;
  try {
    response = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson'
      },
      timeout: 10000
    });
  } catch (error) {
    // OSRM answers 400 when there is no route (e.g. across an ocean)
    if (error.response?.status === 400) return null;
    throw error;
  }

  const route = response.data.routes?.[0];
  if (!route) return null;
  // swap lon/lat to lat/lon for frontend
  const coordPairs = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  return {
    distance: route.distance,
    duration: route.duration,
    geometry: coordPairs,
    weatherPoints: sampleRoute(coordPairs, 80000)
  };
}

export default getRoute;
