// display-only US units; the server and hazard thresholds stay metric

// missing data shows as '—', so a point with no wind reading doesn't look calm
const missing = (v) => v == null || Number.isNaN(Number(v));
export const toF = (c) => (missing(c) ? '—' : `${Math.round(Number(c) * 9 / 5 + 32)}°F`);
export const toMph = (ms) => (missing(ms) ? '—' : `${Math.round(Number(ms) * 2.23694)} mph`);
export const mmToIn = (mm) => (missing(mm) ? '—' : `${(Number(mm) / 25.4).toFixed(2)} in`);
export const cmToIn = (cm) => (missing(cm) ? '—' : `${(Number(cm) / 2.54).toFixed(1)} in`);

export function formatDistance(meters) {
  if (!meters) return '—';
  return `${(meters / 1609.34).toFixed(0)} mi`;
}

export function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
