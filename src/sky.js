// weather classification shared by the sky theme, the map and the drive sheet

export const weatherIcons = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  66: '🌨️', 67: '🌨️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌧️', 81: '🌧️', 82: '🌧️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

export function readConditions(point) {
  return {
    rain: Number(point.rain ?? point.precipitation ?? 0),
    snow: Number(point.snowfall ?? 0),
    wind: Number(point.windspeed ?? 0),
    isThunder: [95, 96, 99].includes(Number(point.weathercode)),
  };
}

export function isHighSeverity({ rain, snow, wind, isThunder }) {
  return isThunder || rain >= 10 || snow >= 5 || wind >= 18;
}

const RANK = ['clear', 'cloudy', 'rain', 'snow', 'storm'];
const SNOW_CODES = [66, 67, 71, 73, 75, 77, 85, 86];

export function conditionOf(point) {
  const { rain, snow, isThunder } = readConditions(point);
  const code = Number(point.weathercode);
  if (isThunder) return 'storm';
  if (snow > 0 || SNOW_CODES.includes(code)) return 'snow';
  if (rain > 0 || (code >= 51 && code <= 82)) return 'rain';
  if ([2, 3, 45, 48].includes(code)) return 'cloudy';
  return 'clear';
}

const HOUR = 3600000;

// time of day at a place: from its sunrise/sunset (epoch ms) when the server sent them
export function timeOfDay(date, sun) {
  if (sun?.sunrise && sun?.sunset) {
    const t = date.getTime();
    if (Math.abs(t - sun.sunrise) < HOUR) return 'dawn';
    if (Math.abs(t - sun.sunset) < HOUR) return 'dusk';
    return t > sun.sunrise && t < sun.sunset ? 'day' : 'night';
  }
  // shortcut: no sun data (saved trip replotted offline, polar day/night) falls back to the viewer's clock
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

// sky for the UI theme: the worst condition among the given points, plus the time of day at timePoint
export function getSky(points, now = new Date(), timePoint = null) {
  const condition = (Array.isArray(points) ? points : [])
    .filter(Boolean)
    .map(conditionOf)
    .reduce((worst, c) => (RANK.indexOf(c) > RANK.indexOf(worst) ? c : worst), 'clear');
  return { condition, time: timeOfDay(now, timePoint?.sun) };
}
