import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        if (mode === 'register' && password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'login') {
                await login(email.trim(), password);
            } else {
                await register(email.trim(), password);
            }
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (m) => {
        setMode(m);
        setError('');
    };

    return (
        <div className="auth-page">
            <div className="auth-card slide-up">
                <div className="auth-header">
                    <div className="auth-logo">
                        <span className="auth-logo-icon">💰</span>
                        TrackMint
                    </div>
                    <p className="auth-tagline">Track your expenses with clarity</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab${mode === 'login' ? ' auth-tab--active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        Sign In
                    </button>
                    <button
                        className={`auth-tab${mode === 'register' ? ' auth-tab--active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        Sign Up
                    </button>
                </div>

                {error && (
                    <div className="alert alert--error">
                        <span>⚠</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="auth-email">Email</label>
                        <input
                            id="auth-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="auth-password">Password</label>
                        <div className="password-wrapper">
                            <input
                                id="auth-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder={mode === 'register' ? 'Min 6 characters' : '••••••••'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '8px' }}
                    >
                        {loading && <span className="spinner spinner--sm" />}
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
