import './App.css';
import TripMap from './components/TripMap.jsx';
import TripInput from './components/TripInput.jsx';
import { useState } from 'react';


function App() {
  const [trips, setTrips] = useState([]);

  const addTrip = (trip) => {
    setTrips([...trips, trip]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Weather.Trip</h1>
      </header>
      <main>
        <TripInput addTrip={addTrip} />
        <TripMap trips={trips} />
      </main>
    </div>
  );
}

export default App;
