// component for login/signup display

import React, { useState } from 'react';
import { login, register } from '../services/authService';
import './authModal.css';

const AuthModal = ({ onSuccess, onDismiss }) => {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const authFunc = mode === 'login' ? login : register;
            const data = await authFunc(email, password);
            onSuccess(data);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);

        };
    }
        return (
        <div className="modal-backdrop" onClick={onDismiss}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
            <span className="modal-title">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
            </span>
            <button className="modal-close" onClick={onDismiss}>✕</button>
            </div>

            <p className="modal-subtitle">
            {mode === 'login'
                ? 'Sign in to save your trips.'
                : 'Create an account to save your trips.'}
            </p>

            <form onSubmit={handleSubmit}>
            <div className="modal-field">
                <label className="modal-label">Email</label>
                <input
                className="modal-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
                />
            </div>
            <div className="modal-field">
                <label className="modal-label">Password</label>
                <input
                className="modal-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
            </div>

            {error && <div className="modal-error">{error}</div>}

            <button className="modal-submit" type="submit" disabled={loading}>
                {loading ? '[ WORKING... ]' : mode === 'login' ? '[ SIGN IN ]' : '[ CREATE ACCOUNT ]'}
            </button>
            </form>

            <div className="modal-switch">
            {mode === 'login' ? (
                <>No account? <button onClick={() => { setMode('register'); setError(null); }}>Register</button></>
            ) : (
                <>Have an account? <button onClick={() => { setMode('login'); setError(null); }}>Sign in</button></>
            )}
            </div>

        </div>
        </div>
    );
    }


export default AuthModal;
