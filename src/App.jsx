import './App.css';
import './components/weatherTile.css';
import TripMap from './components/TripMap.jsx';
import TripInput from './components/TripInput.jsx';
import TripLog from './components/TripLog.jsx';
import fetchTrip, { fetchTripLog } from './services/tripService';
import DriveSheet from './components/DriveSheet.jsx';
import { useState, useEffect } from 'react';
import { getSky } from './sky';
import axios from 'axios';
// allows for login stuff
import { getToken, logout } from './services/authService.js'; 
import AuthModal from './components/authModal.jsx';
import DeleteAccountModal from './components/DeleteAccountModal.jsx';
import NameTripModal from './components/NameTripModal.jsx';
import DeleteTripModal from './components/DeleteTripModal.jsx';

function App() {
  const [trip, setTrip] = useState(null);
  // "Denver → Boulder"; the trip response carries coordinates only
  const [label, setLabel] = useState('');
  // index of the weather point the user picked; it drives the sky and the map focus
  const [selected, setSelected] = useState(null);
  // phones collapse the search card once a route is showing
  const [cardOpen, setCardOpen] = useState(true);
  // re-read the clock every few minutes so the sky follows dusk/night
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const [tripLog, setTripLog] = useState([]);

  // user state to track if a user is logged in and store their token for authenticated requests
  const [user, setUser] = useState(null);
  // pending trip state to hold the guest's start and end while waiting for them to log in,
  // so the trip can be saved if they decide to log in after planning it
  const [pendingTrip, setPendingTrip] = useState(null); 
  // state to control whether the login modal (menu) is shown
  const [showLogin, setShowLogin] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  // id of a just-saved trip the signed-in user is being asked to name
  const [namingTripId, setNamingTripId] = useState(null);
  // trip the user asked to delete, waiting on their confirmation
  const [deletingTrip, setDeletingTrip] = useState(null);

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

  const showTrip = (tripData, start, end, stops = []) => {
    setTrip(tripData);
    setLabel([start, ...stops, end].join(' → '));
    setSelected(null);
    setCardOpen(false);
  };

  const addTrip = (tripData, start, end, stops = []) => {

    showTrip(tripData, start, end, stops);
    // after adding a new trip, also update the trip log by fetching the latest logged trips from the server
    fetchTripLog().then(data => {
        if (data) setTripLog(data);
    });

    // the server sends an id only when it saved the trip, so replots and guests are not asked
    if (getToken() && tripData.id) setNamingTripId(tripData.id);

    // save the trip to pending and show login if not
    if (!getToken()) {
      setPendingTrip({ start, end, stops });
      setShowLogin(true);
    }

  };
  
  // saved trips have no weather, so replotting fetches it live without saving a duplicate
  const replotTrip = async (entry) => {
      const stops = entry.stops?.map((stop) => stop.location) ?? [];
      const data = await fetchTrip(entry.start.location, entry.end.location, { stops, save: false }).catch(() => null);
      showTrip(data ?? entry, entry.start.location, entry.end.location, stops);
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
    // the server only saves on a signed-in request, so plan the guest's trip again now
    if (pendingTrip) {
      const { start, end, stops } = pendingTrip;
      setPendingTrip(null);
      fetchTrip(start, end, { stops })
        .then(data => addTrip(data, start, end, stops))
        .catch(error => console.error('Error saving pending trip:', error));
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setTripLog([]);
    setNamingTripId(null);
    setDeletingTrip(null);
    setTrip(null);
    setLabel('');
    setSelected(null);
    setCardOpen(true);
  };

  // the selected stop sets condition and local time; otherwise the whole route's worst weather at the origin's time
  // (the first sampled weather point is the origin)
  const selectedPoint = selected != null ? trip?.weather?.[selected] : null;
  const sky = getSky(selectedPoint ? [selectedPoint] : trip?.weather, now, selectedPoint ?? trip?.weather?.[0]);

  return (
    <div className="app" data-sky-condition={sky.condition} data-sky-time={sky.time}>
      <TripMap trip={trip} time={sky.time} selected={selected} onSelect={setSelected} />

      {/* full sky before a route, a faint wash over the map after */}
      <div className={`sky-layer${trip ? ' faded' : ''}`}>
        {!trip && (
          <div className="sky-hero">
            <p className="sky-hero-title">Where are we headed?</p>
          </div>
        )}
      </div>

      <section className={`trip-card glass wx-tile${cardOpen ? '' : ' collapsed'}`} data-wx={sky.condition} data-sky-time={sky.time}>
        <div className="trip-card-head">
          <h1 className="brand">Weather<span>.</span>Trip</h1>
          {trip && (
            <button type="button" className="trip-card-toggle" aria-expanded={cardOpen} onClick={() => setCardOpen(o => !o)}>
              {cardOpen ? 'Hide' : '+ New trip'}
            </button>
          )}
        </div>
        <div className="trip-card-body">
          <TripInput addTrip={addTrip} />
          <TripLog tripLog={tripLog} onReplot={replotTrip} onDelete={setDeletingTrip} />
        </div>
      </section>

      <div className="auth-bar">
        <a className="btn-auth glass" href="/privacy.html" target="_blank" rel="noopener">Privacy</a>
        {user && (
          <button type="button" className="btn-auth glass" onClick={() => setShowDelete(true)}>Delete account</button>
        )}
        <button type="button" className="btn-auth glass" onClick={user ? handleLogout : () => setShowLogin(true)}>
          {user ? 'Sign out' : 'Sign in'}
        </button>
      </div>

      {trip && <DriveSheet trip={trip} label={label} condition={sky.condition} time={sky.time} now={now} selected={selected} onSelect={setSelected} />}

      {showLogin && (
        <AuthModal
          onSuccess={handleLoginSuccess}
          onDismiss={() => setShowLogin(false)}
          />
      )}

      {namingTripId && (
        <NameTripModal
          tripId={namingTripId}
          onSaved={() => {
            setNamingTripId(null);
            fetchTripLog().then(data => { if (data) setTripLog(data); });
          }}
          onDismiss={() => setNamingTripId(null)}
        />
      )}

      {deletingTrip && (
        <DeleteTripModal
          trip={deletingTrip}
          onDeleted={(deleted) => {
            setDeletingTrip(null);
            setTripLog(log => log.filter(t => t._id !== deleted._id));
          }}
          onDismiss={() => setDeletingTrip(null)}
        />
      )}

      {showDelete && (
        <DeleteAccountModal
          onDeleted={() => { setShowDelete(false); handleLogout(); }}
          onDismiss={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

export default App;
