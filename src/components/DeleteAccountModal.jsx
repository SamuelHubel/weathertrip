// asks for the password again before deleting the account

import React, { useState } from 'react';
import { deleteAccount } from '../services/authService';
import './authModal.css';

const DeleteAccountModal = ({ onDeleted, onDismiss }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await deleteAccount(password);
            onDeleted();
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onDismiss}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <span className="modal-title">Delete Account</span>
            <button className="modal-close" aria-label="Close" onClick={onDismiss}>✕</button>
            </div>

            <p className="modal-subtitle">
            This deletes your account and all saved trips. It can't be undone.
            </p>

            <form onSubmit={handleSubmit}>
            <div className="modal-field">
                <label className="modal-label" htmlFor="delete-password">Confirm your password</label>
                <input
                id="delete-password"
                className="modal-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
                required
                />
            </div>

            {error && <div className="modal-error">{error}</div>}

            <button className="modal-submit" type="submit" disabled={loading}>
                {loading ? 'Deleting…' : 'Delete account'}
            </button>
            </form>
        </div>
        </div>
    );
};

export default DeleteAccountModal;
