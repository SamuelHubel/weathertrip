import { useState, useEffect } from 'react';

// reverse-geocoded names (as promises, so concurrent lookups of one point share a request)
const nameCache = new Map();
// lookups run one at a time, spaced out, because public Nominatim allows 1 req/s
let queue = Promise.resolve();
const GAP_MS = 1100;

function lookup(lat, lon, fallback) {
  const key = `${lat},${lon}`;
  if (!nameCache.has(key)) {
    const request = queue.then(() =>
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${lat}&lon=${lon}`)
        .then((res) => res.json())
        .then(({ address = {} }) => {
          const place = address.city || address.town || address.village || address.hamlet || address.county;
          return place ? [place, address.state].filter(Boolean).join(', ') : fallback;
        })
        // a failed lookup (e.g. rate-limited) is not cached, so the next render of this point tries again
        .catch(() => { nameCache.delete(key); return fallback; })
    );
    queue = request.then(() => new Promise((resolve) => setTimeout(resolve, GAP_MS)));
    nameCache.set(key, request);
  }
  return nameCache.get(key);
}

// place name for a weather point, e.g. "Glenwood Springs, Colorado"
function PointName({ lat, lon, fallback }) {
  const [name, setName] = useState();

  useEffect(() => {
    let cancelled = false;
    lookup(lat, lon, fallback).then((result) => !cancelled && setName(result));
    return () => { cancelled = true; };
  }, [lat, lon, fallback]);

  return name ?? 'Loading…';
}

export default PointName;
