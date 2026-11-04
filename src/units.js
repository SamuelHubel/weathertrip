// display-only US units; the server and hazard thresholds stay metric

export const toF = (c) => (c == null || Number.isNaN(Number(c)) ? '—' : `${Math.round(Number(c) * 9 / 5 + 32)}°F`);
export const toMph = (ms) => `${Math.round(Number(ms ?? 0) * 2.23694)} mph`;
export const mmToIn = (mm) => `${(Number(mm ?? 0) / 25.4).toFixed(2)} in`;
export const cmToIn = (cm) => `${(Number(cm ?? 0) / 2.54).toFixed(1)} in`;

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
