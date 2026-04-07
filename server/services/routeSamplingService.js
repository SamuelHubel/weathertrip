// this file will return points along a route at regular intervals for weather data collection
// take the geometry and sample points along the route every 50 miles (80 km) and return those points for weather data collection

// haversine distance function to calculate distance between two lat/lon points
function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// function to interpolate between two lat/lon points
// returns a point at a fraction t along the line between the two points
// should be close to the actual point on the route at that distance, 
// but not exactly
function interpolate([lat1, lon1], [lat2, lon2], t) {
  return [lat1 + (lat2 - lat1) * t, lon1 + (lon2 - lon1) * t];
}


// sample points along the route every 50 miles (80 km) and return those points for weather data collection
// takes a point, goes 50 miles out, and finds the point on the route that is closest to that distance,
// then adds that point to the samples array and continues until the end of the route

function sampleRoute(coords, intervalMeters) {
  const samples = [coords[0]];
  let accumulated = 0;

  for (let i = 1; i < coords.length; i++) {
    const segDist = haversineDistance(coords[i - 1], coords[i]);
    let remaining = intervalMeters - accumulated;

    while (remaining <= segDist) {
      samples.push(interpolate(coords[i - 1], coords[i], remaining / segDist));
      remaining += intervalMeters;
    }

    accumulated = segDist - (remaining - intervalMeters);
  }
  // add the last point if it's not already included
  samples.push(coords[coords.length - 1]);
  return samples;
}

export default sampleRoute;
export { haversineDistance, interpolate };