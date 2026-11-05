import React, { useState } from 'react';
import './tripInput.css';
import fetchTrip from '../services/tripService';

const MAX_STOPS = 8;

function TripInput({ addTrip }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  // stops between start and end, in driving order; the server allows up to MAX_STOPS
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!start.trim() || !end.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const stopNames = stops.map((stop) => stop.trim()).filter(Boolean);
      const tripData = await fetchTrip(start.trim(), end.trim(), { stops: stopNames });
      addTrip(tripData, start.trim(), end.trim(), stopNames);
      setStart('');
      setEnd('');
      setStops([]);
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
        {stops.map((stop, i) => (
          <div className="trip-field" key={i}>
            <span className="trip-dot stop" aria-hidden="true" />
            <input
              type="text"
              aria-label={`Stop ${i + 1}`}
              placeholder={`Stop ${i + 1}`}
              value={stop}
              onChange={(e) => setStops(stops.map((s, j) => (j === i ? e.target.value : s)))}
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="button"
              className="trip-stop-remove"
              aria-label={`Remove stop ${i + 1}`}
              onClick={() => setStops(stops.filter((_, j) => j !== i))}
              disabled={loading}
            >✕</button>
          </div>
        ))}
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

      {stops.length < MAX_STOPS && (
        <button type="button" className="trip-add-stop" onClick={() => setStops([...stops, ''])} disabled={loading}>
          + Add stop
        </button>
      )}

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
