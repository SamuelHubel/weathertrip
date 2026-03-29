import React, { useState } from 'react';
import './WeatherEvents.css';

// Placeholder events — replace with real API data when weather service is wired up
const PLACEHOLDER_EVENTS = [
  {
    id: 1,
    icon: '❄️',
    headline: 'Heavy snowfall reported along I-70 corridor',
    location: 'Vail Pass, CO  ·  US-6',
    severity: 'high',
    label: 'ADVISORY',
  },
  {
    id: 2,
    icon: '🌬️',
    headline: 'High wind warning in effect through tomorrow',
    location: 'Casper, WY  ·  US-26',
    severity: 'med',
    label: 'WARNING',
  },
  {
    id: 3,
    icon: '🌧️',
    headline: 'Flash flood watch — low-lying routes affected',
    location: 'Moab, UT  ·  US-191',
    severity: 'high',
    label: 'WATCH',
  },
  {
    id: 4,
    icon: '🌡️',
    headline: 'Extreme heat advisory — carry extra water',
    location: 'Needles, CA  ·  I-40',
    severity: 'med',
    label: 'ADVISORY',
  },
  {
    id: 5,
    icon: '🌤️',
    headline: 'Conditions clearing on northern I-90 corridor',
    location: 'Billings, MT  ·  I-90',
    severity: 'low',
    label: 'CLEAR',
  },
];

function WeatherEvents() {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel weather-events-panel">
      {/* Panel Header */}
      <div className="panel-header" onClick={() => setOpen(o => !o)}>
        <span className="panel-icon">⚡</span>
        <span className="panel-title">Notable Weather Events</span>
        <span className={`panel-toggle${open ? ' open' : ''}`}>▼</span>
      </div>

      {/* Panel Body */}
      <div className={`panel-body${open ? ' open' : ''}`}>
        {PLACEHOLDER_EVENTS.length === 0 ? (
          <div className="weather-events-empty">
            NO NOTABLE EVENTS DETECTED
          </div>
        ) : (
          <div className="weather-events-list">
            {PLACEHOLDER_EVENTS.map((event) => (
              <div key={event.id} className="weather-event-item">
                <span className="weather-event-icon">{event.icon}</span>
                <div className="weather-event-content">
                  <div className="weather-event-headline">{event.headline}</div>
                  <div className="weather-event-location">{event.location}</div>
                  <span className={`weather-event-severity severity-${event.severity}`}>
                    {event.label}
                  </span>
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