import React, { useState } from 'react';
import './TripLog.css';

function timeAgo(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

function TripLog({ tripLog, onReplot }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel trip-log-panel">
      {/* Panel Header */}
      <div className="panel-header" onClick={() => setOpen(o => !o)}>
        <span className="panel-title">Trip Log</span>
        {tripLog.length > 0 && (
          <span style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '10px',
            color: 'var(--cyan)',
            marginRight: '8px',
          }}>
            
          </span>
        )}
        <span className={`panel-toggle${open ? ' open' : ''}`}>▼</span>
      </div>

      {/* Panel Body */}
      <div className={`panel-body${open ? ' open' : ''}`}>
        {tripLog.length === 0 ? (
          <div className="trip-log-empty">
            NO TRIPS LOGGED YET
          </div>
        ) : (
          <div className="trip-log-list">
            {tripLog.map((entry) => (
              <div
                key={entry.id}
                className="trip-log-item"
                onClick={() => onReplot(entry)}
                title="Click to replot this route"
              >
                <div className="trip-log-route">
                  {entry.start}
                  <span className="trip-log-arrow">→</span>
                  {entry.end}
                </div>
                <div className="trip-log-meta">
                  <span className="trip-log-badge">{timeAgo(entry.timestamp)}</span>
                  {entry.data?.route?.distance && (
                    <span className="trip-log-badge">
                      {(entry.data.route.distance / 1609.34).toFixed(0)} mi
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TripLog;