import React, { useMemo, useState } from 'react';
import './driveSheet.css';
import PointName from './PointName';
import { weatherIcons, readConditions, isHighSeverity } from '../sky';
import { toF, toMph, mmToIn, cmToIn, formatDistance, formatDuration } from '../units';

function getHeadline({ rain, snow, isThunder }) {
  if (isThunder) return 'Thunderstorm risk';
  if (snow >= 5) return 'Heavy snow expected';
  if (rain >= 10) return 'Heavy rain expected';
  if (snow >= 1) return 'Snow showers possible';
  if (rain >= 3) return 'Rain showers ahead';
  return 'Strong winds along route';
}

function getIcon({ rain, snow, isThunder }) {
  if (isThunder) return '⛈️';
  if (snow > 0) return '🌨️';
  if (rain > 0) return '🌧️';
  return '💨';
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
        description: `${toF(entry.temperature ?? point.temperature)} · Wind ${toMph(wind)} · Rain ${mmToIn(rain)} · Snow ${cmToIn(snow)}`,
      };
    });
  }).sort((a, b) => a.from - b.from);
}

const pointName = (point, i) => (
  <PointName
    lat={point.location.latitude}
    lon={point.location.longitude}
    fallback={`Stop ${i + 1}`}
  />
);

function DriveSheet({ trip, label, selected, onSelect }) {
  // only matters on phones, where the sheet peeks from the bottom
  const [expanded, setExpanded] = useState(false);
  const events = useMemo(() => buildEvents(trip?.weather, Date.now()), [trip?.weather]);
  const byPoint = useMemo(() => {
    const map = new Map();
    for (const e of events) map.set(e.index, [...(map.get(e.index) ?? []), e]);
    return map;
  }, [events]);

  // only claim the route is clear if weather was actually fetched for it
  const points = Array.isArray(trip?.weather) ? trip.weather : null;
  const first = events[0];

  return (
    <aside className={`drive-sheet glass${expanded ? ' expanded' : ''}`} aria-label="Your drive">
      <button
        type="button"
        className="drive-summary"
        aria-expanded={expanded}
        onClick={() => { setExpanded((e) => !e); onSelect(null); }}
      >
        <span className="drive-eyebrow">Your drive</span>
        {label && <span className="drive-route">{label}</span>}
        <span className="drive-stats">
          <span>{formatDistance(trip?.route?.distance)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(trip?.route?.duration)}</span>
        </span>
        <span className={`drive-verdict${first ? ' risky' : ''}`}>
          {first && (
            <>{first.icon} <strong>{first.headline}</strong> near {pointName(points[first.index], first.index)} · {first.timeText}</>
          )}
          {!first && points && 'No notable weather along this route right now.'}
          {!points && 'Weather could not be loaded for this route. Try plotting it again.'}
        </span>
      </button>

      {points && (
        <ol className="drive-timeline" aria-label="Stops">
          {points.map((point, i) => {
            if (!point?.location) return null;
            const hazards = byPoint.get(i) ?? [];
            const isSelected = selected === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  className={`stop${hazards.length ? ' flagged' : ''}${isSelected ? ' selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(isSelected ? null : i)}
                >
                  <span className="stop-icon" aria-hidden="true">{weatherIcons[point.weathercode] ?? '❓'}</span>
                  <span className="stop-main">
                    <span className="stop-name">{pointName(point, i)}</span>
                    <span className="stop-detail">Wind {toMph(point.windspeed)}</span>
                    {hazards.map((h) => (
                      <span className="stop-hazard" key={h.headline}>
                        <strong>{h.headline}</strong> <span className="stop-when">{h.timeText}</span>
                        <span className="stop-hazard-detail">{h.description}</span>
                      </span>
                    ))}
                  </span>
                  <span className="stop-temp">{toF(point.temperature)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

export default DriveSheet;
