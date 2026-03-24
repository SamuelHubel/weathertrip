import './App.css';
import TripMap from './components/TripMap';
import TripInput from './components/TripInput';
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
        <TripMap />
      </main>
    </div>
  );
}

export default App;
