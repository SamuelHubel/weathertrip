import React from 'react';
import './tripLog.css';

// recent trips as chips; renders nothing until there is something to show
function TripLog({ tripLog, onReplot }) {
  if (!tripLog?.length) return null;

  return (
    <section className="trip-log" aria-label="Recent trips">
      <h2 className="trip-log-title">Recent trips</h2>
      <div className="trip-log-list">
        {tripLog.map((entry) => (
          <button type="button" className="trip-chip" key={entry._id} onClick={() => onReplot(entry)}>
            <span className="trip-chip-route">{entry.start.location} → {entry.end.location}</span>
            <span className="trip-chip-date">{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default TripLog;
