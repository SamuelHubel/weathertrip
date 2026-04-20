import React, { useState } from 'react';
import './tripLog.css';





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
       {tripLog.length === 0 
    ? <p>No trips yet</p>
    : tripLog.map((entry) => (
        <div key={entry._id} onClick={() => onReplot(entry)}>
            <p>{entry.start.location} → {entry.end.location}</p>
            <p>{new Date(entry.createdAt).toLocaleDateString()}</p>
        </div>
    ))
}
      </div>
    </div>
  );
}

export default TripLog;