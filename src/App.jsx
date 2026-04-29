import './App.css';
import TripMap from './components/TripMap.jsx';
import TripInput from './components/TripInput.jsx';
import TripLog from './components/TripLog.jsx';
import fetchTrip, { fetchTripLog } from './services/tripService';
import WeatherEvents from './components/WeatherEvents.jsx';
import { useState, useEffect } from 'react';
// allows for login stuff
import { getToken } from './services/authService.js'; 


function App() {
  const [trip, setTrip] = useState(null);
  const [tripLog, setTripLog] = useState([]);

  // user state to track if a user is logged in and store their token for authenticated requests
  const [user, setUser] = useState(null);
  // pending trip state to hold trip data while waiting for user to log in before adding to log, 
  // so we don't lose the trip data if they decide to log in after planning a trip
  const [pendingTrip, setPendingTrip] = useState(null); 
  // state to control whether the login modal (menu) is shown
  const [showLogin, setShowLogin] = useState(false);

  // check if a token already exists (returning user)
  useEffect(() => {
    const token = getToken();
    if (token) setUser({ token }); 
  }, []);


  const addTrip = (tripData) => {

    setTrip(tripData);
    // after adding a new trip, also update the trip log by fetching the latest logged trips from the server
    fetchTripLog().then(data => {
        if (data) setTripLog(data);
    });

    // save the trip to pending and show login if not
    if (!getToken()) {
      setPendingTrip(tripData);
      setShowLogin(true);
    }

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