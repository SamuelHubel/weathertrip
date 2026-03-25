// component to input trip details and add to list
//
import React, { useState } from 'react';
import  fetchTrip  from '../services/tripService';

function TripInput({ addTrip }) {
  // trip info
    const [tripStartLocation, setTripStartLocation] = useState('');
    const [tripEndLocation, setTripEndLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
          // fetch trip data from server
            const tripData = await fetchTrip(tripStartLocation, tripEndLocation);

            // add trip to list if data is valid
            if (tripData) {
                addTrip(tripData);
                setTripStartLocation('');
                setTripEndLocation('');
                // dummy window alert to show trip added - replace with better UI in future
                window.alert(`Trip added: ${tripStartLocation} to ${tripEndLocation}`);
              } else {
                setError('Failed to fetch trip data');
              }
            } catch (err) {
              setError(err.message || 'Error fetching trip');
            } finally {
              setLoading(false);
             
        }
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