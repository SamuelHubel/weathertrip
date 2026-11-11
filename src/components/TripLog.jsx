import React from 'react';
import './tripLog.css';

// recent trips as chips; renders nothing until there is something to show
function TripLog({ tripLog, onReplot, onDelete }) {
  if (!tripLog?.length) return null;

  return (
    <section className="trip-log" aria-label="Recent trips">
      <h2 className="trip-log-title">Recent trips</h2>
      <div className="trip-log-list">
        {tripLog.map((entry) => (
          // two sibling buttons in one pill, since a button cannot hold another button
          <div className="trip-chip" key={entry._id}>
          <button type="button" className="trip-chip-open" onClick={() => onReplot(entry)}>
            {/* a named trip shows its name, with the route beneath */}
            <span className="trip-chip-text">
              {entry.name && <span className="trip-chip-name">{entry.name}</span>}
              <span className="trip-chip-route">{[entry.start, ...(entry.stops ?? []), entry.end].map((place) => place.location).join(' → ')}</span>
            </span>
            <span className="trip-chip-date">{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </button>
          <button type="button" className="trip-chip-delete" aria-label="Delete trip" onClick={() => onDelete(entry)}>×</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TripLog;
