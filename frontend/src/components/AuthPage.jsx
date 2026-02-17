import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [currency, setCurrency] = useState('INR');

    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();

    // ── Validation ───────────────────────────────────────────────────────────
    const errors = useMemo(() => {
        const e = {};
        if (mode === 'register') {
            if (fullName.trim() && fullName.trim().length < 3) e.fullName = 'Name too short (min 3 chars)';
            if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = 'Invalid email format';
            if (password && password.length < 8) e.password = 'Password too short (min 8 chars)';
            if (confirmPassword && confirmPassword !== password) e.confirmPassword = 'Passwords do not match';
            if (monthlyBudget && (isNaN(Number(monthlyBudget)) || Number(monthlyBudget) < 0)) e.monthlyBudget = 'Budget must be positive';
        }
        return e;
    }, [mode, fullName, email, password, confirmPassword, monthlyBudget]);

    const isFormValid = useMemo(() => {
        if (mode === 'login') return email.trim() && password.trim();
        return (
            fullName.trim().length >= 3 &&
            /^\S+@\S+\.\S+$/.test(email) &&
            password.length >= 8 &&
            confirmPassword === password &&
            Object.keys(errors).length === 0
        );
    }, [mode, fullName, email, password, confirmPassword, errors]);

    const passwordStrength = useMemo(() => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score; // 0-4
    }, [password]);

    const strengthLabel = ['Very Weak', 'Weak', 'Good', 'Strong', 'Excellent'][passwordStrength];
    const strengthColor = ['#94A3B8', '#EF4444', '#F59E0B', '#10B981', '#059669'][passwordStrength];

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        const tid = toast.loading(mode === 'login' ? 'Signing in…' : 'Creating account…');

        try {
            if (mode === 'login') {
                await login(email.trim(), password);
                toast.success('Welcome back!', { id: tid });
            } else {
                await register({
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password,
                    monthlyBudget: monthlyBudget ? Number(monthlyBudget) : null,
                    currency
                });
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
            <div className="auth-left">
                <div className="auth-brand-lg">
                    <div className="auth-brand-icon-lg">₹</div>
                    TrackMint
                </div>
                <p className="auth-tagline-lg">Know where every rupee goes.</p>
                <div className="auth-features">
                    <div className="auth-feature">
                        <div className="auth-feature-icon">📊</div>
                        <div className="auth-feature-text">
                            <span className="auth-feature-title">Realistic Budgeting</span>
                            <span className="auth-feature-desc">Set monthly targets and track your progress in real-time.</span>
                        </div>
                    </div>
                    <div className="auth-feature">
                        <div className="auth-feature-icon">🔒</div>
                        <div className="auth-feature-text">
                            <span className="auth-feature-title">Production Ready</span>
                            <span className="auth-feature-desc">Secure JWT auth with password hashing and validation.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-card" style={{ maxWidth: mode === 'register' ? 480 : 420 }}>
                    <div className="auth-card-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
                    <p className="auth-card-sub">{mode === 'login' ? 'Sign in to continue.' : 'Start your financial journey.'}</p>

                    <div className="auth-tabs">
                        <button className={`auth-tab${mode === 'login' ? ' auth-tab--active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
                        <button className={`auth-tab${mode === 'register' ? ' auth-tab--active' : ''}`} onClick={() => setMode('register')}>Sign Up</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {mode === 'register' && (
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} disabled={loading} />
                                {errors.fullName && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.fullName}</div>}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                            {errors.email && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.email}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="password-wrapper">
                                <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                                <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>{showPw ? '🙈' : '👁'}</button>
                            </div>
                            {mode === 'register' && password && (
                                <div style={{ marginTop: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Strength: <b style={{ color: strengthColor }}>{strengthLabel}</b></span>
                                    </div>
                                    <div style={{ height: 4, background: 'var(--bg-muted)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(passwordStrength / 4) * 100}%`, background: strengthColor, transition: 'width 0.3s ease' }} />
                                    </div>
                                </div>
                            )}
                            {errors.password && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.password}</div>}
                        </div>

                        {mode === 'register' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <input className="form-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} />
                                    {errors.confirmPassword && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.confirmPassword}</div>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Monthly Budget (Opt)</label>
                                        <input className="form-input" type="number" placeholder="5000" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} disabled={loading} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Currency</label>
                                        <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)} disabled={loading}>
                                            <option value="INR">INR (₹)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        <button type="submit" className="btn btn--primary btn--full" disabled={loading || !isFormValid} style={{ marginTop: 8 }}>
                            {loading && <span className="spinner spinner--sm" />}
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
