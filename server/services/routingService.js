import axios from 'axios';



// take start and end geocoded locations and return route from OSRM API
// returns raw geometry from OSRM API, which is a list of lat/lon pairs
// frontend will need to convert this to a polyline for display on the map
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
        polyline: route.geometry
    };
}

export default  getRoute;
    