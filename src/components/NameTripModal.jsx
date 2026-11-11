// asks a signed-in user to name the trip they just plotted; skipping keeps the route as its label

import React, { useState } from 'react';
import { renameTrip } from '../services/tripService';
import './authModal.css';

const NameTripModal = ({ tripId, onSaved, onDismiss }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await renameTrip(tripId, name);
            onSaved();
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onDismiss}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <span className="modal-title">Name this trip</span>
            <button className="modal-close" aria-label="Close" onClick={onDismiss}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
            <div className="modal-field">
                <label className="modal-label" htmlFor="trip-name">Trip name</label>
                <input
                id="trip-name"
                className="modal-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ski weekend"
                maxLength={60}
                disabled={loading}
                autoFocus
                required
                />
            </div>

            {error && <div className="modal-error">{error}</div>}

            <button className="modal-submit" type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Saving…' : 'Save'}
            </button>
            </form>

            <div className="modal-switch">
            <button type="button" onClick={onDismiss}>Skip</button>
            </div>
        </div>
        </div>
    );
};

export default NameTripModal;
