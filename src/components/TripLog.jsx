import React, { useState } from 'react';
import './TripLog.css';





function TripLog({ tripLog, onReplot }) {
  const [open, setOpen] = useState(false);

  // using panel to allow opening and closing
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
        Coming soon...
        <p>Here you'll see a history of your recent trips! Click on any entry to replot the route and check the weather along the way!</p>
      </div>
    </div>
  );
}

export default TripLog;