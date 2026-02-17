import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) { toast.error('Please fill in all fields.'); return; }
        if (mode === 'register' && password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }

        setLoading(true);
        const tid = toast.loading(mode === 'login' ? 'Signing in…' : 'Creating account…');

        try {
            if (mode === 'login') {
                await login(email.trim(), password);
                toast.success('Welcome back!', { id: tid });
            } else {
                await register(email.trim(), password);
                toast.success('Account created!', { id: tid });
            }
        } catch (err) {
            toast.error(err.message || 'Authentication failed.', { id: tid });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* ─── Left: Branding ─────────────────────────────────── */}
            <div className="auth-left">
                <div className="auth-brand-lg">
                    <div className="auth-brand-icon-lg">₹</div>
                    TrackMint
                </div>

                <p className="auth-tagline-lg">
                    Know where every rupee goes.
                </p>

                <div className="auth-features">
                    <div className="auth-feature">
                        <div className="auth-feature-icon">📊</div>
                        <div className="auth-feature-text">
                            <span className="auth-feature-title">Real-time Insights</span>
                            <span className="auth-feature-desc">Track spending patterns across categories with instant summaries.</span>
                        </div>
                    </div>
                    <div className="auth-feature">
                        <div className="auth-feature-icon">🔒</div>
                        <div className="auth-feature-text">
                            <span className="auth-feature-title">Bank-grade Security</span>
                            <span className="auth-feature-desc">Your data is encrypted and protected with JWT authentication.</span>
                        </div>
                    </div>
                    <div className="auth-feature">
                        <div className="auth-feature-icon">📱</div>
                        <div className="auth-feature-text">
                            <span className="auth-feature-title">Works Everywhere</span>
                            <span className="auth-feature-desc">Responsive design that works beautifully on any device.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Right: Auth Card ───────────────────────────────── */}
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-card-title">
                        {mode === 'login' ? 'Welcome back' : 'Create account'}
                    </div>
                    <p className="auth-card-sub">
                        {mode === 'login'
                            ? 'Sign in to continue to your dashboard.'
                            : 'Start tracking your expenses today.'}
                    </p>

                    <div className="auth-tabs">
                        <button
                            className={`auth-tab${mode === 'login' ? ' auth-tab--active' : ''}`}
                            onClick={() => setMode('login')}
                        >Sign In</button>
                        <button
                            className={`auth-tab${mode === 'register' ? ' auth-tab--active' : ''}`}
                            onClick={() => setMode('register')}
                        >Sign Up</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                className="form-input" type="email"
                                placeholder="you@example.com"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email" disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="password-wrapper">
                                <input
                                    className="form-input"
                                    type={showPw ? 'text' : 'password'}
                                    placeholder={mode === 'register' ? 'Min 6 characters' : '••••••••'}
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    disabled={loading}
                                />
                                <button type="button" className="password-toggle"
                                    onClick={() => setShowPw(!showPw)} tabIndex={-1}
                                    aria-label="Toggle password">
                                    {showPw ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn--primary btn--full"
                            disabled={loading} style={{ marginTop: 8 }}>
                            {loading && <span className="spinner spinner--sm" />}
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
