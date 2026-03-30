import React, { useState } from 'react';
import './WeatherEvents.css';

// Placeholder events — replace with real API data when weather service is wired up


function WeatherEvents() {
  const [open, setOpen] = useState(false);
// using panel to allow opening and closing
  return (
    <div className="panel weather-events-panel">
      {/* Panel Header */}
      <div className="panel-header" onClick={() => setOpen(o => !o)}>
        <span className="panel-title">Notable Weather Events</span>
        {/* able to open and close the weather events panel */}
        <span className={`panel-toggle${open ? ' open' : ''}`}>▼</span>
      </div>

      {/* Panel Body */}
      <div className={`panel-body${open ? ' open' : ''}`}>
        Coming soon... 
        <p>Here you'll see any major weather events that might affect your route! like recent snowstorms, flooding, and more!</p>
      </div>
    </div>
  );
}

export default WeatherEvents;