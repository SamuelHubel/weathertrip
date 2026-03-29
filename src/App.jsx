import './App.css';
import TripMap from './components/TripMap.jsx';
import TripInput from './components/TripInput.jsx';
import TripLog from './components/TripLog.jsx';
import WeatherEvents from './components/WeatherEvents.jsx';
import { useState } from 'react';

function App() {
  const [trip, setTrip] = useState(null);
  const [tripLog, setTripLog] = useState([]);

  const addTrip = (tripData, startLabel, endLabel) => {
    const entry = {
      id: Date.now(),
      start: startLabel,
      end: endLabel,
      data: tripData,
      timestamp: new Date(),
    };
    setTrip(tripData);
    // 
    setTripLog(prev => [entry, ...prev]);
  };

  const replotTrip = (entry) => {
    setTrip(entry.data);
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-logo">
          Weather<span>.</span>Trip
        </div>
        <div className="header-tag">ROUTE WEATHER SYSTEM</div>
      </header>

      {/* ── Trip Input Bar ── */}
      <TripInput addTrip={addTrip} />

      {/* ── Main Content ── */}
      <main className="app-body">
        <div className="main-row">
          {/* Left: Map */}
          <TripMap trip={trip} />

          {/* Right: Trip Log */}
          <TripLog tripLog={tripLog} onReplot={replotTrip} />
        </div>

        {/* Bottom: Notable Weather Events */}
        <div className="bottom-row">
          <WeatherEvents />
        </div>
      </main>
    </div>
  );
}

export default App;