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

function buildEvents(weatherPoints) {
  if (!Array.isArray(weatherPoints)) {
    return [];
  }

  return weatherPoints.flatMap((point, index) => {
    if (!point?.location) {
      return [];
    }

    const conditions = readConditions(point);
    if (!isHighSeverity(conditions)) {
      return [];
    }

    const { rain, snow, wind } = conditions;
    return [{
      index,
      icon: getIcon(conditions),
      headline: getHeadline(conditions),
      locationText: `${point.location.latitude?.toFixed(2) ?? '—'}, ${point.location.longitude?.toFixed(2) ?? '—'}`,
      description: `${point.temperature ?? '—'}°C · Wind ${wind.toFixed(0)} m/s · Rain ${rain.toFixed(1)} mm · Snow ${snow.toFixed(1)} cm`,
    }];
  });
}

function WeatherEvents({ trip }) {
  const [open, setOpen] = useState(false);
  const events = useMemo(() => buildEvents(trip?.weather), [trip?.weather]);

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