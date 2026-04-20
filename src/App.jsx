import './App.css';
import TripMap from './components/TripMap.jsx';
import TripInput from './components/TripInput.jsx';
import TripLog from './components/TripLog.jsx';
import fetchTrip, { fetchTripLog } from './services/tripService';
import WeatherEvents from './components/WeatherEvents.jsx';
import { useState, useEffect } from 'react';

function App() {
  const [trip, setTrip] = useState(null);
  const [tripLog, setTripLog] = useState([]);

  const addTrip = (tripData) => {
    setTrip(tripData);
    // after adding a new trip, also update the trip log by fetching the latest logged trips from the server
    fetchTripLog().then(data => {
        if (data) setTripLog(data);
    });
  };
  
  // function to replot a trip from the log when clicked — for now just sets the current trip to the selected log entry's data, but will eventually also update the weather events and other info based on the selected trip
  const replotTrip = (entry) => {
      setTrip(entry);
  };
  // on initial load, fetch the trip log from the server to display in the sidebar
  useEffect(() => {
        fetchTripLog().then(data => {
            if (data) setTripLog(data);
        });
  }, []);
  
  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-logo">
          Weather.Trip
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