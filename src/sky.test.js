import { describe, it, expect } from 'vitest';
import { getSky, timeOfDay } from './sky';
import { toF, toMph } from './units';

const at = (hour) => new Date(2026, 10, 3, hour, 30);
const clear = { weathercode: 0 };
const cloudy = { weathercode: 3 };
const rain = { weathercode: 61, rain: 2 };
const snow = { weathercode: 73, snowfall: 1 };
const storm = { weathercode: 95 };

describe('getSky', () => {
  it('picks the worst condition across points', () => {
    expect(getSky([clear, cloudy], at(12)).condition).toBe('cloudy');
    expect(getSky([cloudy, rain, clear], at(12)).condition).toBe('rain');
    expect(getSky([rain, snow], at(12)).condition).toBe('snow');
    expect(getSky([snow, storm, rain], at(12)).condition).toBe('storm');
  });

  it('is clear with no points or missing weather', () => {
    expect(getSky(null, at(12)).condition).toBe('clear');
    expect(getSky([], at(12)).condition).toBe('clear');
    expect(getSky([null], at(12)).condition).toBe('clear');
  });

  it('reads a single selected point on its own', () => {
    expect(getSky([cloudy], at(12)).condition).toBe('cloudy');
  });
});

describe('timeOfDay', () => {
  it('buckets hours at the edges', () => {
    expect(timeOfDay(new Date(2026, 0, 1, 4, 59))).toBe('night');
    expect(timeOfDay(new Date(2026, 0, 1, 5, 0))).toBe('dawn');
    expect(timeOfDay(new Date(2026, 0, 1, 8, 0))).toBe('day');
    expect(timeOfDay(new Date(2026, 0, 1, 17, 0))).toBe('dusk');
    expect(timeOfDay(new Date(2026, 0, 1, 20, 0))).toBe('night');
  });
});

describe('units', () => {
  it('converts to US units', () => {
    expect(toF(0)).toBe('32°F');
    expect(toF(null)).toBe('—');
    expect(toMph(10)).toBe('22 mph');
  });
});
