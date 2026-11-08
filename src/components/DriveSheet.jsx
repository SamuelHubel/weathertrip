import React, { useMemo, useRef, useState } from 'react';
import './driveSheet.css';
import PointName from './PointName';
import { weatherIcons, readConditions, isHighSeverity, conditionOf, timeOfDay } from '../sky';
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

// keep in sync with the phone @media query in driveSheet.css / App.css
const PHONE_QUERY = '(max-width: 800px), (max-height: 500px)';

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
    fallback={`Point ${i + 1}`}
  />
);

function DriveSheet({ trip, label, condition = 'clear', time, now = new Date(), selected, onSelect }) {
  // only matters on phones, where the sheet peeks from the bottom
  const [expanded, setExpanded] = useState(false);
  // dragged height in px; null leaves it to CSS
  const [height, setHeight] = useState(null);
  const sheetRef = useRef(null);
  const drag = useRef(null);
  const onTouchStart = (e) => {
    if (!window.matchMedia?.(PHONE_QUERY).matches) return;
    drag.current = { y: e.touches[0].clientY, h: sheetRef.current.offsetHeight, min: e.currentTarget.offsetHeight };
  };
  const onTouchMove = (e) => {
    if (!drag.current) return;
    const { y, h, min } = drag.current;
    const next = Math.min(Math.max(h - (e.touches[0].clientY - y), min), window.innerHeight * 0.72);
    setHeight(next);
    setExpanded(true);
  };
  const onTouchEnd = () => {
    if (!drag.current) return;
    // stays where released; only dropping it near the header closes it
    if (height !== null && height < drag.current.min + 40) {
      setExpanded(false);
      setHeight(null);
    }
    drag.current = null;
  };
  const events = useMemo(() => buildEvents(trip?.weather, Date.now()), [trip?.weather]);
  const byPoint = useMemo(() => {
    const map = new Map();
    for (const e of events) map.set(e.index, [...(map.get(e.index) ?? []), e]);
    return map;
  }, [events]);

  // only claim the route is clear if weather was actually fetched for it
  const points = Array.isArray(trip?.weather) ? trip.weather : null;
  // lead with a hazard that matches the header's scene, so a storm tile doesn't headline snow
  const first = events.find((e) => conditionOf(points[e.index]) === condition) ?? events[0];

  return (
    <aside ref={sheetRef} style={{ height: height ?? undefined }} className={`drive-sheet glass${expanded ? ' expanded' : ''}`} aria-label="Your drive">
      <button
        type="button"
        className="drive-summary wx-tile"
        data-wx={condition}
        data-sky-time={time}
        aria-expanded={expanded}
        onClick={() => { setExpanded((e) => !e); setHeight(null); onSelect(null); }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <span className="drive-eyebrow">Your drive</span>
        <span className="drive-verdict">
          {first && (
            <>
              <span className="drive-verdict-icon" aria-hidden="true">{first.icon}</span>
              <span>
                <strong className="drive-verdict-headline">{first.headline}</strong>
                <span className="drive-verdict-where">near {pointName(points[first.index], first.index)} · {first.timeText}</span>
              </span>
            </>
          )}
          {!first && points && 'No notable weather along this route right now.'}
          {!points && 'Weather could not be loaded for this route. Try plotting it again.'}
        </span>
        {label && <span className="drive-route">{label}</span>}
        <span className="drive-stats">
          <span>{formatDistance(trip?.route?.distance)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(trip?.route?.duration)}</span>
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
                  className={`stop wx-tile${hazards.length ? ' flagged' : ''}${isSelected ? ' selected' : ''}`}
                  data-wx={conditionOf(point)}
                  data-sky-time={timeOfDay(now, point.sun)}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(isSelected ? null : i)}
                >
                  <span className="stop-icon" aria-hidden="true">{weatherIcons[point.weathercode] ?? '❓'}</span>
                  <span className="stop-main">
                    <span className="stop-name">{pointName(point, i)}</span>
                    <span className="stop-detail">Wind {toMph(point.windspeed)}</span>
                    {hazards.map((h) => (
                      <span className="stop-hazard" key={h.headline}>
                        <span className="stop-hazard-title"><span aria-hidden="true">⚠ </span><strong>{h.headline}</strong> <span className="stop-when">{h.timeText}</span></span>
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
