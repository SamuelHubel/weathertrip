import './App.css';
import TripMap from './components/TripMap.jsx';
import TripInput from './components/TripInput.jsx';
import { useState } from 'react';



function App() {
// only one trip at a time for now - can expand to list of trips in future
// through database and UI changes - for now just display most recent trip on map
  const [trip, setTrip] = useState();

  const addTrip = (trip) => {
    setTrip(trip);
  };
 

  return (
    <div className="App">
      <header className="App-header">
        <h1>Weather.Trip</h1>
      </header>
      <main>
        <TripInput addTrip={addTrip} />
        <TripMap trip={trip} />
  
      </main>
    </div>
  );
}

export default App;
