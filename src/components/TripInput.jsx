import React, { useState } from 'react';
import './tripInput.css';
import fetchTrip from '../services/tripService';

function TripInput({ addTrip }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!start.trim() || !end.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const tripData = await fetchTrip(start.trim(), end.trim());
      addTrip(tripData, start.trim(), end.trim());
      setStart('');
      setEnd('');
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't reach the routing service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="trip-input" onSubmit={handleSubmit}>
      <div className="trip-fields">
        <label className="trip-field">
          <span className="trip-dot start" aria-hidden="true" />
          <span className="visually-hidden">Origin</span>
          <input
            type="text"
            placeholder="From (e.g. Denver, CO)"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
        </label>
        <label className="trip-field">
          <span className="trip-dot end" aria-hidden="true" />
          <span className="visually-hidden">Destination</span>
          <input
            type="text"
            placeholder="To (e.g. Salt Lake City, UT)"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
        </label>
      </div>

      <button
        className="btn-primary"
        type="submit"
        disabled={loading || !start.trim() || !end.trim()}
      >
        {loading ? 'Checking the skies…' : 'Plot route'}
      </button>

      {error && <div className="trip-error" role="alert">{error}</div>}
    </form>
  );
}

export default TripInput;
