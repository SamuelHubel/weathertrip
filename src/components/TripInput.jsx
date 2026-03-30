import React, { useState } from 'react';
import './TripInput.css';
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
      const tripData = await fetchTrip(start, end);
      if (tripData) {
        addTrip(tripData, start.trim(), end.trim());
        setStart('');
        setEnd('');
      } else {
        setError('ERR: Route not found — check locations and retry');
      }
    } catch (err) {
      setError(`ERR: ${err.message || 'Failed to connect to routing service'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trip-input-bar">
      <form onSubmit={handleSubmit}>
        <div className="trip-input-inner">
          <span className="input-label">Plot Route</span>

          <div className="input-group">
            <input
              className="location-input"
              type="text"
              placeholder="Origin  (e.g. Denver, CO)"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
            <span className="input-arrow">→</span>
            <input
              className="location-input"
              type="text"
              placeholder="Destination  (e.g. Salt Lake City, UT)"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <button
            className={`btn-plot${loading ? ' loading' : ''}`}
            type="submit"
            disabled={loading || !start.trim() || !end.trim()}
          >
            {loading ? '[ ROUTING... ]' : '[ PLOT ROUTE ]'}
          </button>
        </div>

        {error && (
          <div className="input-error">{error}</div>
        )}
      </form>
    </div>
  );
}

export default TripInput;