import React, { useMemo, useState } from 'react';
import './weatherEvents.css';

const weatherIcons = {
  thunder: '⛈️',
  snow: '🌨️',
  rain: '🌧️',
  fog: '🌫️',
  wind: '💨',
  default: '☔',
};

const severityWeights = {
  high: 3,
  med: 2,
  low: 1,
};

function getSeverity(point) {
  const rain = Number(point.rain ?? point.precipitation ?? 0);
  const snow = Number(point.snowfall ?? 0);
  const wind = Number(point.windspeed ?? 0);
  const code = Number(point.weathercode ?? -1);

  const isThunder = [95, 96, 99].includes(code);
  const isFog = [45, 48].includes(code);

  if (isThunder || rain >= 10 || snow >= 5 || wind >= 18) {
    return 'high';
  }

  if (rain >= 3 || snow >= 1 || wind >= 12 || isFog) {
    return 'med';
  }

  return 'low';
}

function getHeadline(point) {
  const rain = Number(point.rain ?? point.precipitation ?? 0);
  const snow = Number(point.snowfall ?? 0);
  const wind = Number(point.windspeed ?? 0);
  const code = Number(point.weathercode ?? -1);

  const isThunder = [95, 96, 99].includes(code);
  const isFog = [45, 48].includes(code);

  if (isThunder) return 'Thunderstorm risk';
  if (snow >= 5) return 'Heavy snow expected';
  if (rain >= 10) return 'Heavy rain expected';
  if (snow >= 1) return 'Snow showers possible';
  if (rain >= 3) return 'Rain showers ahead';
  if (wind >= 12) return 'Strong winds along route';
  if (isFog) return 'Foggy conditions';
  if (rain > 0) return 'Light rain on the route';

  return 'Notable route conditions';
}

function getIcon(point) {
  const rain = Number(point.rain ?? point.precipitation ?? 0);
  const snow = Number(point.snowfall ?? 0);
  const wind = Number(point.windspeed ?? 0);
  const code = Number(point.weathercode ?? -1);
  const isThunder = [95, 96, 99].includes(code);
  const isFog = [45, 48].includes(code);

  if (isThunder) return weatherIcons.thunder;
  if (snow > 0) return weatherIcons.snow;
  if (rain > 0) return weatherIcons.rain;
  if (wind >= 12) return weatherIcons.wind;
  if (isFog) return weatherIcons.fog;
  return weatherIcons.default;
}

function buildEvents(weatherPoints) {
  if (!Array.isArray(weatherPoints)) {
    return [];
  }

  return weatherPoints
    .map((point, index) => {
      if (!point || !point.location) {
        return null;
      }

      const rain = Number(point.rain ?? point.precipitation ?? 0);
      const snow = Number(point.snowfall ?? 0);
      const wind = Number(point.windspeed ?? 0);
      const code = Number(point.weathercode ?? -1);
      const isThunder = [95, 96, 99].includes(code);
      const isFog = [45, 48].includes(code);

      const severity = getSeverity(point);
      if (severity !== 'high') {
        return null;
      }

      const label = 'HIGH';
      const headline = getHeadline(point);
      const icon = getIcon(point);
      const description = `${point.temperature ?? '—'}°C · Wind ${wind.toFixed(0)} m/s · Rain ${rain.toFixed(1)} mm · Snow ${snow.toFixed(1)} cm`;
      const locationText = `${point.location.latitude?.toFixed(2) ?? '—'}, ${point.location.longitude?.toFixed(2) ?? '—'}`;

      return {
        index,
        icon,
        headline,
        locationText,
        description,
        severity,
        label,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
}

function WeatherEvents({ trip }) {
  const [open, setOpen] = useState(false);
  const events = useMemo(() => buildEvents(trip?.weather), [trip?.weather]);

  const hasRoute = Boolean(trip?.route?.geometry || trip?.route?.weatherPoints?.length);

  return (
    <div className="panel weather-events-panel">
      <div className="panel-header" onClick={() => setOpen(o => !o)}>
        <span className="panel-title">Notable Weather Events</span>
        <span className={`panel-toggle${open ? ' open' : ''}`}>▼</span>
      </div>

      <div className={`panel-body${open ? ' open' : ''}`}>
        {!trip && (
          <div className="weather-events-empty">
            Enter a route to surface weather hazards along your drive.
          </div>
        )}

        {trip && !events.length && (
          <div className="weather-events-empty">
            {hasRoute
              ? 'No notable weather events were detected along this route right now. Check the map for weather points and watch for changing conditions.'
              : 'This route has not been collected yet. Plan a trip to gather weather points for the route.'}
          </div>
        )}

        {events.length > 0 && (
          <div className="weather-events-list">
            {events.map(event => (
              <div key={`${event.headline}-${event.index}`} className="weather-event-item">
                <div className="weather-event-icon">{event.icon}</div>
                <div className="weather-event-content">
                  <div className="weather-event-headline">{event.headline}</div>
                  <div className="weather-event-location">{event.locationText}</div>
                  <div className={`weather-event-severity severity-${event.severity}`}>{event.label}</div>
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