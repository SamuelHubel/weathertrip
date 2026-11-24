import React, { useMemo, useRef, useState } from 'react';
import './driveSheet.css';
import PointName from './PointName';
import { weatherIcons, readConditions, isHighSeverity, conditionOf, timeOfDay, INCIDENTS } from '../sky';
import { toF, toMph, mmToIn, cmToIn, compass, formatDistance, formatDuration } from '../units';

function getHeadline({ rain, snow, isThunder, isFreezing }) {
  if (isThunder) return 'Thunderstorm risk';
  if (isFreezing) return 'Icy roads possible';
  if (snow >= 5) return 'Heavy snow expected';
  if (rain >= 10) return 'Heavy rain expected';
  // only called for high-severity hours, so what is left is wind (isHighSeverity's last trigger)
  return 'Strong winds along route';
}

// same order as getHeadline, so the icon matches the headline
function getIcon({ rain, snow, isThunder, isFreezing }) {
  if (isThunder) return '⛈️';
  if (isFreezing) return '🧊';
  if (snow >= 5) return '🌨️';
  if (rain >= 10) return '🌧️';
  return '💨';
}

const HOUR = 3600000;

// keep in sync with the phone @media query in driveSheet.css / App.css; TripMap uses it too
export const PHONE_QUERY = '(max-width: 800px), (max-height: 500px)';

// relative label for a timestamp: "now", "in 3h" or "2h ago"
function relHours(ms, now) {
  const hours = Math.round((ms - now) / HOUR);
  if (hours === 0) return 'now';
  return hours > 0 ? `in ${hours}h` : `${-hours}h ago`;
}

// a live road incident, listed under the nearest weather point (points are ~80 km apart, so flat lat/lon distance will do)
function incidentEvent(incident, weatherPoints, now) {
  let index = -1;
  let best = Infinity;
  weatherPoints.forEach((p, i) => {
    if (!p?.location) return;
    const d = (p.location.latitude - incident.lat) ** 2 + (p.location.longitude - incident.lon) ** 2;
    if (d < best) { best = d; index = i; }
  });
  if (index < 0) return [];
  const [icon, headline] = INCIDENTS[incident.category] ?? ['⚠️', 'Road incident'];
  return [{
    index,
    from: now,
    to: now,
    icon,
    headline,
    timeText: 'now',
    description: [incident.description, incident.road, incident.delay > 0 && `Delay ${Math.round(incident.delay / 60)} min`].filter(Boolean).join(' · '),
  }];
}

function buildEvents(weatherPoints, incidents, now) {
  if (!Array.isArray(weatherPoints)) {
    return [];
  }

  const roadEvents = (incidents ?? []).flatMap((incident) => incidentEvent(incident, weatherPoints, now));
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
        to,
        icon: getIcon(conditions),
        headline,
        timeText: fromText === toText ? fromText : `${fromText} → ${toText}`,
        description: `${toF(entry.temperature ?? point.temperature)} · Wind ${toMph(wind)} · Rain ${mmToIn(rain)} · Snow ${cmToIn(snow)}`,
      };
    });
  }).concat(roadEvents).sort((a, b) => a.from - b.from);
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
  // rebuilt as the clock ticks, so "in 3h" counts down
  const events = useMemo(() => buildEvents(trip?.weather, trip?.incidents, now.getTime()), [trip?.weather, trip?.incidents, now]);
  const byPoint = useMemo(() => {
    const map = new Map();
    for (const e of events) map.set(e.index, [...(map.get(e.index) ?? []), e]);
    return map;
  }, [events]);

  // only claim the route is clear if weather was actually fetched for it
  const points = Array.isArray(trip?.weather) ? trip.weather : null;
  // lead with a hazard that hasn't ended, preferring one that matches the header's scene, so a storm tile doesn't headline snow
  const upcoming = events.filter((e) => e.to >= now.getTime());
  const first = upcoming.find((e) => conditionOf(points[e.index]) === condition) ?? upcoming[0];

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
        {/* null means TomTom could not be asked, not that the road is clear */}
        {trip?.incidents === null && <span className="drive-route">Road incidents could not be loaded.</span>}
        {/* without weather points the timeline is empty, so incidents would only be map markers */}
        {!points && trip?.incidents?.length > 0 && <span className="drive-route">{trip.incidents.length} road incident{trip.incidents.length > 1 ? 's' : ''} on this route, shown on the map.</span>}
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
                    <span className="stop-detail">
                      Wind {toMph(point.windspeed)}
                      {compass(point.winddirection) && (
                        <>
                          {' '}
                          {/* Open-Meteo gives where the wind comes FROM; +180 points the arrow downwind, as on the map */}
                          <span className="wind-dir" aria-hidden="true" style={{ transform: `rotate(${(point.winddirection + 180) % 360}deg)` }}>↑</span>
                          {' '}from {compass(point.winddirection)}
                        </>
                      )}
                    </span>
                    {hazards.map((h, j) => (
                      <span className="stop-hazard" key={`${h.headline}-${j}`}>
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
