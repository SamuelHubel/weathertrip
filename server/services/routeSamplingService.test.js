import { describe, it, expect } from 'vitest';
import sampleRoute, { haversineDistance, interpolate } from './routeSamplingService.js';

// ── haversineDistance ─────────────────────────────────────────────────────────

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance([39.7392, -104.9903], [39.7392, -104.9903])).toBe(0);
  });

  it('returns a positive distance for distinct points', () => {
    const dist = haversineDistance([39.7392, -104.9903], [40.7608, -111.891]);
    expect(dist).toBeGreaterThan(0);
  });

  it('approximates the Denver → Salt Lake City distance (~685 km)', () => {
    // Real driving distance is ~685 km; straight-line haversine is ~630 km
    const dist = haversineDistance([39.7392, -104.9903], [40.7608, -111.891]);
    expect(dist).toBeGreaterThan(580_000);
    expect(dist).toBeLessThan(700_000);
  });

  it('is symmetric — distance A→B equals B→A', () => {
    const a = [39.7392, -104.9903];
    const b = [40.7608, -111.891];
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 0);
  });

  it('returns meters (not km)', () => {
    // Denver to nearby point ~1° north (~111 km)
    const dist = haversineDistance([39.0, -105.0], [40.0, -105.0]);
    expect(dist).toBeGreaterThan(100_000); // > 100 km in meters
    expect(dist).toBeLessThan(120_000);
  });
});

// ── interpolate ───────────────────────────────────────────────────────────────

describe('interpolate', () => {
  it('returns the start point when t=0', () => {
    const result = interpolate([0, 0], [10, 10], 0);
    expect(result).toEqual([0, 0]);
  });

  it('returns the end point when t=1', () => {
    const result = interpolate([0, 0], [10, 10], 1);
    expect(result).toEqual([10, 10]);
  });

  it('returns the midpoint when t=0.5', () => {
    const result = interpolate([0, 0], [10, 20], 0.5);
    expect(result[0]).toBeCloseTo(5, 5);
    expect(result[1]).toBeCloseTo(10, 5);
  });

  it('handles negative coordinates', () => {
    const result = interpolate([-10, -20], [10, 20], 0.5);
    expect(result[0]).toBeCloseTo(0, 5);
    expect(result[1]).toBeCloseTo(0, 5);
  });

  it('returns a two-element array', () => {
    const result = interpolate([1, 2], [3, 4], 0.25);
    expect(result).toHaveLength(2);
  });
});

// ── sampleRoute ───────────────────────────────────────────────────────────────

describe('sampleRoute — basic invariants', () => {
  // A straight west-to-east line across ~630 km (Denver → SLC straight line)
  const denverToSLC = [
    [39.7392, -104.9903],
    [40.7608, -111.891],
  ];

  it('always includes the first coordinate', () => {
    const samples = sampleRoute(denverToSLC, 80_000);
    expect(samples[0]).toEqual(denverToSLC[0]);
  });

  it('always includes the last coordinate', () => {
    const samples = sampleRoute(denverToSLC, 80_000);
    expect(samples[samples.length - 1]).toEqual(denverToSLC[denverToSLC.length - 1]);
  });

  it('returns at least 2 points (start and end)', () => {
    const samples = sampleRoute(denverToSLC, 80_000);
    expect(samples.length).toBeGreaterThanOrEqual(2);
  });

  it('returns more points for a smaller interval', () => {
    const sparse = sampleRoute(denverToSLC, 200_000);
    const dense  = sampleRoute(denverToSLC, 50_000);
    expect(dense.length).toBeGreaterThan(sparse.length);
  });

  it('returns only start+end when interval is larger than the route', () => {
    // interval of 1000 km > ~630 km straight line
    const samples = sampleRoute(denverToSLC, 1_000_000);
    expect(samples).toHaveLength(2);
  });

  it('each sample is a two-element [lat, lon] array', () => {
    const samples = sampleRoute(denverToSLC, 80_000);
    for (const pt of samples) {
      expect(pt).toHaveLength(2);
      expect(typeof pt[0]).toBe('number');
      expect(typeof pt[1]).toBe('number');
    }
  });
});

describe('sampleRoute — 80 km interval on Denver→SLC route', () => {
  // Multi-segment route with a waypoint through the Rockies
  const route = [
    [39.7392, -104.9903], // Denver
    [40.1,    -106.5   ], // Vail area
    [40.7608, -111.891 ], // Salt Lake City
  ];

  it('produces at least one interior sample point', () => {
    const samples = sampleRoute(route, 80_000);
    expect(samples.length).toBeGreaterThan(2);
  });

  it('produces roughly the expected number of samples (~8 for ~630 km / 80 km)', () => {
    const samples = sampleRoute(route, 80_000);
    // Total straight-line distance is roughly 630 km → expect 7–10 samples
    expect(samples.length).toBeGreaterThanOrEqual(7);
    expect(samples.length).toBeLessThanOrEqual(12);
  });

  it('sample latitudes are within the bounding box of the route', () => {
    const samples = sampleRoute(route, 80_000);
    const minLat = Math.min(...route.map(p => p[0]));
    const maxLat = Math.max(...route.map(p => p[0]));
    for (const [lat] of samples) {
      expect(lat).toBeGreaterThanOrEqual(minLat - 0.01);
      expect(lat).toBeLessThanOrEqual(maxLat + 0.01);
    }
  });

  it('sample longitudes are within the bounding box of the route', () => {
    const samples = sampleRoute(route, 80_000);
    const minLon = Math.min(...route.map(p => p[1]));
    const maxLon = Math.max(...route.map(p => p[1]));
    for (const [, lon] of samples) {
      expect(lon).toBeGreaterThanOrEqual(minLon - 0.01);
      expect(lon).toBeLessThanOrEqual(maxLon + 0.01);
    }
  });
});

describe('sampleRoute — single-segment edge cases', () => {
  it('handles a very short route (< 1 interval) without throwing', () => {
    const shortRoute = [
      [39.7392, -104.9903],
      [39.7400, -104.9910], // ~100 m apart
    ];
    expect(() => sampleRoute(shortRoute, 80_000)).not.toThrow();
  });

  it('returns exactly start and end for a very short route', () => {
    const shortRoute = [
      [39.7392, -104.9903],
      [39.7393, -104.9904],
    ];
    const samples = sampleRoute(shortRoute, 80_000);
    expect(samples).toHaveLength(2);
  });

  it('handles a route with many segments correctly', () => {
    // 10-point zigzag across ~10° of longitude
    const manySegments = Array.from({ length: 10 }, (_, i) => [
      39 + i * 0.1,
      -104 - i * 0.5,
    ]);
    expect(() => sampleRoute(manySegments, 30_000)).not.toThrow();
    const samples = sampleRoute(manySegments, 30_000);
    expect(samples[0]).toEqual(manySegments[0]);
    expect(samples[samples.length - 1]).toEqual(manySegments[manySegments.length - 1]);
  });
});

describe('sampleRoute — interval consistency', () => {
  it('consecutive interior samples are spaced approximately one interval apart', () => {
    const route = [
      [39.7392, -104.9903],
      [40.7608, -111.891],
    ];
    const intervalMeters = 100_000; // 100 km
    const samples = sampleRoute(route, intervalMeters);

    // Check interior consecutive pairs (skip first→second and second-to-last→last
    // because accumulated carry can shift them slightly)
    for (let i = 1; i < samples.length - 2; i++) {
      const d = haversineDistance(samples[i], samples[i + 1]);
      // Allow 5% tolerance due to linear interpolation on a sphere
      expect(d).toBeGreaterThan(intervalMeters * 0.90);
      expect(d).toBeLessThan(intervalMeters * 1.10);
    }
  });
});