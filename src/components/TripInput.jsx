// component to input trip details and add to list
// need to add submit buttne
import React, { useState } from 'react';

function TripInput({ addTrip }) {
  // trip info
    const [tripStartLocation, setTripStartLocation] = useState('');
    const [tripEndLocation, setTripEndLocation] = useState('');
    // handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        addTrip({ start: tripStartLocation, end: tripEndLocation });
        setTripStartLocation('');
        setTripEndLocation('');
        // dummy window alert to show trip added
        // window.alert(`Trip added: ${tripStartLocation} to ${tripEndLocation}`);
    };
  return (
    <div>
      <h2>Where're we headed?</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text"
          placeholder="Start Location"
          value={tripStartLocation}
          onChange={(e) => setTripStartLocation(e.target.value)}
        />
        <input 
          type="text"
          placeholder="End Location"
          value={tripEndLocation}
          onChange={(e) => setTripEndLocation(e.target.value)}
        />
        <button type="submit">Add Trip</button>
      </form>
    </div>
  );

  }


export default TripInput;  