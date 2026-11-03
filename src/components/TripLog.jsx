import React, { useState } from 'react';
import './tripLog.css';





function TripLog({ tripLog, onReplot }) {
  const [open, setOpen] = useState(false);


  
  // using panel to allow opening and closing
  return (
    <div className="panel trip-log-panel">
      {/* Panel Header */}
      <button type="button" className="panel-header" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="panel-title">Trip Log</span>
        <span className={`panel-toggle${open ? ' open' : ''}`}>▼</span>
      </button>

      {/* Panel Body */}
      <div className={`panel-body${open ? ' open' : ''}`} inert={!open}>
       {tripLog.length === 0 
    ? <p>No trips yet</p>
    : tripLog.map((entry) => (
        <button type="button" className="trip-log-item" key={entry._id} onClick={() => onReplot(entry)}>
            <span className="trip-log-route">{entry.start.location} → {entry.end.location}</span>
            <span className="trip-log-badge">{new Date(entry.createdAt).toLocaleDateString()}</span>
        </button>
    ))
}
      </div>
    </div>
  );
}

export default TripLog;