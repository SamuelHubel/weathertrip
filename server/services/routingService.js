import axios from 'axios';


// take start and end geocoded locations and return route from OSRM API
// returns polyline of route and distance in meters and duration in seconds
const getRoute = async (start, end) => {
  const response = await axios.get(`${process.env.OSRM_URL}/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}`, {
    params: {
      overview: 'full',
      geometries: 'geojson'
    }
  });
  // object with distance, duration, and geometry
  const route = response.data.routes[0];
    return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry
    };
}

export default  getRoute;
    