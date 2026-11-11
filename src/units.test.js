import { describe, it, expect } from 'vitest';
import { toF, toMph, mmToIn, cmToIn } from './units';

describe('unit display', () => {
  it('converts real values, zero included', () => {
    expect(toF(0)).toBe('32°F');
    expect(toMph(10)).toBe('22 mph');
    expect(toMph(0)).toBe('0 mph');
    expect(mmToIn(25.4)).toBe('1.00 in');
    expect(cmToIn(2.54)).toBe('1.0 in');
  });

  it('shows missing data as a dash, not as zero', () => {
    for (const convert of [toF, toMph, mmToIn, cmToIn]) {
      expect(convert(undefined)).toBe('—');
      expect(convert(null)).toBe('—');
    }
  });
});
