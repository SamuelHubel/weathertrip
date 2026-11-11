// asks before deleting a trip from the user's log

import React, { useState } from 'react';
import { deleteTrip } from '../services/tripService';
import './authModal.css';

const DeleteTripModal = ({ trip, onDeleted, onDismiss }) => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const route = [trip.start, ...(trip.stops ?? []), trip.end].map((place) => place.location).join(' → ');

    const handleDelete = async () => {
        setError('');
        setLoading(true);
        try {
            await deleteTrip(trip._id);
            onDeleted(trip);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onDismiss}>
        <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="delete-trip-title" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <span className="modal-title" id="delete-trip-title">Delete trip</span>
            <button className="modal-close" aria-label="Close" onClick={onDismiss}>✕</button>
            </div>

            <p className="modal-subtitle">
            Delete <strong>{trip.name || route}</strong> from your log? This can't be undone.
            </p>

            {error && <div className="modal-error">{error}</div>}

            <button className="modal-submit" type="button" onClick={handleDelete} disabled={loading} autoFocus>
                {loading ? 'Deleting…' : 'Delete trip'}
            </button>

            <div className="modal-switch">
            <button type="button" onClick={onDismiss}>Cancel</button>
            </div>
        </div>
        </div>
    );
};

export default DeleteTripModal;
