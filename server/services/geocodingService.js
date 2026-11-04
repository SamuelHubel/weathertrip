import axios from 'axios';

// public Nominatim allows 1 request per second for the whole app, so lookups run one at a time, spaced out
const GAP_MS = 1100;
let queue = Promise.resolve();
// place string -> promise of { lat, lon } or null, so a repeated place costs no request
// shortcut: in-memory and never pruned, move to a shared cache (or TTL) if several server instances run or memory grows
const cache = new Map();

async function search(locationString) {
  const response = await axios.get(`${process.env.NOMINATIM_URL}/search`, {
    params: {
      q: locationString,
      format: 'jsonv2',
      addressdetails: 1
    },
    headers: {
      'User-Agent': 'WeatherTripApp/1.0 (road-trip-weather-app)'
    },
    timeout: 10000
  });

  if (!response.data || response.data.length === 0) {
    console.warn(`No results found for location: ${locationString}`);
    return null;
  }
  const result = response.data[0];
  console.log(`Geocoded "${locationString}" to lat: ${result.lat}, lon: ${result.lon}`);
  // "Denver, Colorado": short enough for the trip log, specific enough to geocode the same place on replay
  const region = result.address?.state ?? result.address?.country;
  const name = result.name ? [result.name, region !== result.name && region].filter(Boolean).join(', ') : undefined;
  return {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    name
  };
}

// Take location string and return geocoded location with lat and lon from Nominatim API
// Returns { lat, lon, name }, or null if not found; network errors throw so the caller does not blame the user's input
const geocodingService = {
  geocodeLocation(locationString) {
    const key = locationString.trim().toLowerCase();
    if (!cache.has(key)) {
      const request = queue.then(() => search(locationString));
      queue = request.catch(() => {}).then(() => new Promise((resolve) => setTimeout(resolve, GAP_MS)));
      // a failed lookup is not cached, so the next request tries again
      request.catch(() => cache.delete(key));
      cache.set(key, request);
    }
    return cache.get(key);
  }
};

export default geocodingService;
