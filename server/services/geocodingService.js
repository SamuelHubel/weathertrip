import axios from 'axios';

// public Nominatim allows 1 request per second for the whole app, so lookups run one at a time, spaced out
const GAP_MS = 1100;
let queue = Promise.resolve();
// place string -> promise of { lat, lon } or null, so a repeated place costs no request
// shortcut: in-memory and never pruned, move to a shared cache (or TTL) if several server instances run or memory grows
const cache = new Map();
// lookups in flight or waiting; past the cap new places are refused, so one client cannot stall every search
const MAX_WAITING = 20;
let waiting = 0;

async function search(locationString) {
  const response = await axios.get(`${process.env.NOMINATIM_URL}/search`, {
    params: {
      q: locationString,
      // 'json', not 'jsonv2': Nominatim-compatible keyed hosts (LocationIQ) only accept 'json'
      format: 'json',
      addressdetails: 1,
      // public Nominatim throttles shared host IPs; a keyed host avoids that. undefined is dropped by axios
      key: process.env.NOMINATIM_KEY
    },
    headers: {
      'User-Agent': 'WeatherTripApp/1.0 (road-trip-weather-app)'
    },
    timeout: 10000
  });

  if (!response.data || response.data.length === 0) {
    return null;
  }
  const result = response.data[0];
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
      // shaped like an upstream 429, so the trip controller answers "busy, try again"
      if (waiting >= MAX_WAITING) return Promise.reject(Object.assign(new Error('Geocoding queue is full'), { response: { status: 429 } }));
      waiting++;
      const request = queue.then(() => search(locationString));
      queue = request.catch(() => {}).then(() => {
        waiting--;
        return new Promise((resolve) => setTimeout(resolve, GAP_MS));
      });
      // a failed lookup is not cached, so the next request tries again
      request.catch(() => cache.delete(key));
      cache.set(key, request);
    }
    return cache.get(key);
  }
};

export default geocodingService;
