import './App.css';
import TripMap from './components/TripMap.jsx';
import TripInput from './components/TripInput.jsx';
import TripLog from './components/TripLog.jsx';
import fetchTrip, { fetchTripLog } from './services/tripService';
import WeatherEvents from './components/WeatherEvents.jsx';
import { useState, useEffect } from 'react';
import axios from 'axios';
// allows for login stuff
import { getToken, logout } from './services/authService.js'; 
import AuthModal from './components/authModal.jsx';

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


  // an expired session signs the user out and asks them to log in again
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(undefined, (error) => {
      if (error.response?.status === 401 && getToken()) {
        logout();
        setUser(null);
        setTripLog([]);
        setShowLogin(true);
      }
      return Promise.reject(error);
    });
    return () => axios.interceptors.response.eject(interceptor);
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
  
  // saved trips have no weather, so replotting fetches it live without saving a duplicate
  const replotTrip = async (entry) => {
      const data = await fetchTrip(entry.start.location, entry.end.location, { save: false });
      setTrip(data ?? entry);
  };
  // on initial load, fetch the trip log from the server to display in the sidebar
  useEffect(() => {
        fetchTripLog().then(data => {
            if (data) setTripLog(data);
        });
  }, []);
  

  // set user and save pending trip if there is one
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
    fetchTripLog(userData.token).then(data => {
        if (data) setTripLog(data);
    });
    // if there's a pending trip that was planned before logging in, add it to the log now that we're authenticated
    if (pendingTrip) {
      setPendingTrip(null);
      addTrip(pendingTrip);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setTripLog([]);
    setTrip(null);
  };
  console.log('showLogin:', showLogin);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
          <div className="header-logo">Weather.Trip</div>
          <div className="header-tag">ROUTE WEATHER SYSTEM</div>

          <div className="header-auth">
            {user
              ? <button className="btn-auth" onClick={handleLogout}>[ SIGN OUT ]</button>
              : <button className="btn-auth" onClick={() => setShowLogin(true)}>[ SIGN IN ]</button>
            }
          </div>
        </header>
      {/* Login Modal */}
      {showLogin && (
        <AuthModal
          onSuccess={handleLoginSuccess}
          onDismiss={() => setShowLogin(false)}
          />
      )}

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
          <WeatherEvents trip={trip} />
        </div>
      </main>
    </div>
  );
}

export default App;