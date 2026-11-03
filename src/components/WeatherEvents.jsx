import React, { useMemo, useState } from 'react';
import './weatherEvents.css';

const weatherIcons = {
  thunder: '⛈️',
  snow: '🌨️',
  rain: '🌧️',
  wind: '💨',
};

function readConditions(point) {
  return {
    rain: Number(point.rain ?? point.precipitation ?? 0),
    snow: Number(point.snowfall ?? 0),
    wind: Number(point.windspeed ?? 0),
    isThunder: [95, 96, 99].includes(Number(point.weathercode)),
  };
}

function isHighSeverity({ rain, snow, wind, isThunder }) {
  return isThunder || rain >= 10 || snow >= 5 || wind >= 18;
}

function getHeadline({ rain, snow, isThunder }) {
  if (isThunder) return 'Thunderstorm risk';
  if (snow >= 5) return 'Heavy snow expected';
  if (rain >= 10) return 'Heavy rain expected';
  if (snow >= 1) return 'Snow showers possible';
  if (rain >= 3) return 'Rain showers ahead';
  return 'Strong winds along route';
}

function getIcon({ rain, snow, isThunder }) {
  if (isThunder) return weatherIcons.thunder;
  if (snow > 0) return weatherIcons.snow;
  if (rain > 0) return weatherIcons.rain;
  return weatherIcons.wind;
}

const HOUR = 3600000;

// relative label for a timestamp: "now", "in 3h" or "2h ago"
function relHours(ms, now) {
  const hours = Math.round((ms - now) / HOUR);
  if (hours === 0) return 'now';
  return hours > 0 ? `in ${hours}h` : `${-hours}h ago`;
}

function buildEvents(weatherPoints, now) {
  if (!Array.isArray(weatherPoints)) {
    return [];
  }

  return weatherPoints.flatMap((point, index) => {
    if (!point?.location) {
      return [];
    }

    // current conditions first, then the hourly window (6h back, 12h ahead); one event per hazard type per point
    const groups = new Map();
    for (const entry of [{ ...point, time: now }, ...(point.hourly ?? [])]) {
      const conditions = readConditions(entry);
      if (!isHighSeverity(conditions)) continue;
      const headline = getHeadline(conditions);
      const group = groups.get(headline);
      if (group) {
        group.from = Math.min(group.from, entry.time);
        group.to = Math.max(group.to, entry.time);
      } else {
        groups.set(headline, { headline, from: entry.time, to: entry.time, entry, conditions });
      }
    }

    return [...groups.values()].map(({ headline, from, to, entry, conditions }) => {
      const { rain, snow, wind } = conditions;
      const fromText = relHours(from, now);
      const toText = relHours(to, now);
      return {
        index,
        from,
        icon: getIcon(conditions),
        headline,
        timeText: fromText === toText ? fromText : `${fromText} → ${toText}`,
        locationText: `${point.location.latitude?.toFixed(2) ?? '—'}, ${point.location.longitude?.toFixed(2) ?? '—'}`,
        description: `${entry.temperature ?? point.temperature ?? '—'}°C · Wind ${wind.toFixed(0)} m/s · Rain ${rain.toFixed(1)} mm · Snow ${snow.toFixed(1)} cm`,
      };
    });
  }).sort((a, b) => a.from - b.from);
}

function WeatherEvents({ trip }) {
  const [open, setOpen] = useState(false);
  const events = useMemo(() => buildEvents(trip?.weather, Date.now()), [trip?.weather]);

  // only claim the route is clear if weather was actually fetched for it
  const hasWeather = Array.isArray(trip?.weather);

  return (
    <div className="panel weather-events-panel">
      <button type="button" className="panel-header" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="panel-title">Notable Weather Events</span>
        <span className={`panel-toggle${open ? ' open' : ''}`}>▼</span>
      </button>

      <div className={`panel-body${open ? ' open' : ''}`} inert={!open}>
        {!trip && (
          <div className="weather-events-empty">
            Enter a route to surface weather hazards along your drive.
          </div>
        )}

        {trip && !events.length && (
          <div className="weather-events-empty">
            {hasWeather
              ? 'No notable weather events were detected along this route right now. Check the map for weather points and watch for changing conditions.'
              : 'Weather could not be loaded for this route. Try plotting it again.'}
          </div>
        )}

        {events.length > 0 && (
          <div className="weather-events-list">
            {events.map(event => (
              <div key={`${event.headline}-${event.index}`} className="weather-event-item">
                <div className="weather-event-icon">{event.icon}</div>
                <div className="weather-event-content">
                  <div className="weather-event-headline">{event.headline}</div>
                  <div className="weather-event-time">{event.timeText}</div>
                  <div className="weather-event-location">{event.locationText}</div>
                  <div className="weather-event-severity severity-high">HIGH</div>
                  <div>{event.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WeatherEvents;