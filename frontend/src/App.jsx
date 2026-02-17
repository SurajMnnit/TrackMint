import { useState, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import ExpenseFilters from './components/ExpenseFilters';
import ExpenseSummary from './components/ExpenseSummary';
import Pagination from './components/Pagination';
import { useExpenses } from './hooks/useExpenses';

/* ── Inline SVG Icons ─────────────────────────────────────────────────── */
const Icon = ({ d, ...props }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {d}
    </svg>
);

const IconGrid = () => <Icon d={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>} />;
const IconList = () => <Icon d={<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>} />;
const IconUser = () => <Icon d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />;
const IconLogout = () => <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>} />;
const IconMail = () => <Icon d={<><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,7 12,13 2,7" /></>} />;
const IconShield = () => <Icon d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>} />;
const IconTrending = () => <Icon d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>} />;

/* ── Sidebar ──────────────────────────────────────────────────────────── */
function Sidebar({ user, onLogout, activeView, onViewChange }) {
    const initial = user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

    const handleLogout = () => {
        toast.success('Signed out successfully');
        setTimeout(onLogout, 300);
    };

    const nav = [
        { id: 'dashboard', icon: <IconGrid />, label: 'Dashboard' },
        { id: 'transactions', icon: <IconList />, label: 'Transactions' },
        { id: 'profile', icon: <IconUser />, label: 'Profile' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">₹</div>
                TrackMint
            </div>

            <div className="sidebar-section-label">Menu</div>

            <nav className="sidebar-nav">
                {nav.map(({ id, icon, label }) => (
                    <button
                        key={id}
                        className={`sidebar-link${activeView === id ? ' sidebar-link--active' : ''}`}
                        onClick={() => onViewChange(id)}
                    >
                        {icon} {label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user" onClick={() => onViewChange('profile')} style={{ cursor: 'pointer' }}>
                    <div className="sidebar-avatar">{initial}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-email">{user?.fullName || user?.email}</div>
                        <div className="sidebar-user-plan">Personal Plan</div>
                    </div>
                </div>
                <button className="sidebar-link sidebar-link--danger" onClick={handleLogout} style={{ marginTop: 8 }}>
                    <IconLogout /> Sign Out
                </button>
            </div>
        </aside>
    );
}

/* ── Budget Progress ───────────────────────────────────────────────────── */
function BudgetProgress({ spent, budget, symbol }) {
    if (!budget) return null;

    const percent = Math.min(Math.round((spent / budget) * 100), 100);
    const remaining = budget - spent;
    const isExceeded = spent > budget;
    const color = isExceeded ? 'var(--danger)' : 'var(--accent)';

    return (
        <div className="card" style={{ marginBottom: 'var(--sp-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 className="list-title" style={{ margin: 0 }}>Monthly Budget Progress</h2>
                <span style={{ fontSize: 13, fontWeight: 600, color }}>{percent}% used</span>
            </div>

            <div style={{ height: 10, background: 'var(--bg-muted)', borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ height: '100%', width: `${percent}%`, background: color, transition: 'width 0.5s ease' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>
                    <span style={{ color: 'var(--text-muted)' }}>Spent:</span> <b style={{ color: 'var(--text-primary)' }}>{symbol}{spent}</b>
                </div>
                <div>
                    <span style={{ color: 'var(--text-muted)' }}>Remaining:</span> <b style={{ color: isExceeded ? 'var(--danger)' : 'var(--success)' }}>{symbol}{Math.abs(remaining)} {isExceeded ? 'Over' : 'Left'}</b>
                </div>
            </div>
        </div>
    );
}

/* ── Dashboard View ───────────────────────────────────────────────────── */
function DashboardView({ meta, expenses, loading, error, category, sort, page,
    setCategory, setSort, setPage, create, update, remove, submitting }) {

    const { user, currency } = useAuth();
    const symbol = currency?.symbol || '₹';

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Track and manage your expenses</p>
            </div>

            <ExpenseSummary meta={meta} />

            {user?.monthlyBudget && (
                <BudgetProgress spent={meta?.grand_total || 0} budget={user.monthlyBudget} symbol={symbol} />
            )}

            <div className="content-grid">
                <div className="card">
                    <h2 className="card-title">✦ New Expense</h2>
                    <ExpenseForm
                        onSubmit={({ receipt, ...data }) => create(data, receipt)}
                        loading={submitting}
                    />
                </div>

                <div className="card">
                    <div className="list-header">
                        <h2 className="list-title">Recent Transactions</h2>
                        <ExpenseFilters
                            category={category}
                            sort={sort}
                            onCategoryChange={setCategory}
                            onSortChange={setSort}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'var(--danger-subtle)', color: 'var(--danger)',
                            padding: '10px 14px', borderRadius: 'var(--radius-md)',
                            fontSize: '13px', marginBottom: '16px',
                        }}>
                            ⚠ {error}
                        </div>
                    )}

                    <ExpenseList
                        expenses={expenses}
                        loading={loading && expenses.length === 0}
                        onUpdate={update}
                        onDelete={remove}
                    />

                    <Pagination page={page} totalPages={meta?.total_pages} onPageChange={setPage} />
                </div>
            </div>
        </>
    );
}

/* ── Transactions View ────────────────────────────────────────────────── */
function TransactionsView({ expenses, loading, error, category, sort, page, meta,
    setCategory, setSort, setPage, update, remove }) {
    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Transactions</h1>
                <p className="page-subtitle">View and manage all your expense records</p>
            </div>

            <ExpenseSummary meta={meta} />

            <div className="card">
                <div className="list-header">
                    <h2 className="list-title">All Transactions</h2>
                    <ExpenseFilters
                        category={category} sort={sort}
                        onCategoryChange={setCategory} onSortChange={setSort}
                    />
                </div>

                {error && (
                    <div style={{
                        background: 'var(--danger-subtle)', color: 'var(--danger)',
                        padding: '10px 14px', borderRadius: 'var(--radius-md)',
                        fontSize: '13px', marginBottom: '16px',
                    }}>⚠ {error}</div>
                )}

                <ExpenseList
                    expenses={expenses}
                    loading={loading && expenses.length === 0}
                    onUpdate={update} onDelete={remove}
                />

                <Pagination page={page} totalPages={meta?.total_pages} onPageChange={setPage} />
            </div>
        </>
    );
}

/* ── Profile View ─────────────────────────────────────────────────────── */
function ProfileView({ user }) {
    const { updateProfile } = useAuth();
    const [edit, setEdit] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState(user?.fullName || '');
    const [budget, setBudget] = useState(user?.monthlyBudget || '');
    const [curr, setCurr] = useState(user?.currency || 'INR');

    const [curPw, setCurPw] = useState('');
    const [newPw, setNewPw] = useState('');

    const initial = user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
    const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Unknown';

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const tid = toast.loading('Updating profile…');
        try {
            await updateProfile({
                fullName: name,
                monthlyBudget: budget === '' ? null : Number(budget),
                currency: curr,
                currentPassword: curPw || undefined,
                newPassword: newPw || undefined
            });
            toast.success('Profile updated!', { id: tid });
            setEdit(false);
            setCurPw('');
            setNewPw('');
        } catch (err) {
            toast.error(err.message || 'Update failed.', { id: tid });
        } finally {
            setSubmitting(false);
        }
    };

    if (edit) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title">Edit Profile</h1>
                    <p className="page-subtitle">Update your personal information</p>
                </div>
                <div className="card" style={{ maxWidth: 560 }}>
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={name} onChange={e => setName(e.target.value)} disabled={submitting} />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Monthly Budget</label>
                                <input className="form-input" type="number" value={budget} onChange={e => setBudget(e.target.value)} disabled={submitting} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Currency</label>
                                <select className="form-select" value={curr} onChange={e => setCurr(e.target.value)} disabled={submitting}>
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-muted)', borderRadius: 10 }}>
                            <h3 style={{ fontSize: 13, marginBottom: 12 }}>Change Password (Optional)</h3>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input className="form-input" type="password" value={curPw} onChange={e => setCurPw(e.target.value)} disabled={submitting} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">New Password</label>
                                <input className="form-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} disabled={submitting} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                            <button type="submit" className="btn btn--primary" disabled={submitting}>
                                {submitting && <span className="spinner spinner--sm" />} Save Changes
                            </button>
                            <button type="button" className="btn btn--ghost" onClick={() => setEdit(false)} disabled={submitting}>Cancel</button>
                        </div>
                    </form>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Profile</h1>
                <p className="page-subtitle">Your account details</p>
            </div>

            <div className="card" style={{ maxWidth: 560 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div className="sidebar-avatar" style={{ width: 64, height: 64, fontSize: 24 }}>{initial}</div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{user?.fullName}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Joined {joinedDate}</div>
                        </div>
                    </div>
                    <button className="btn btn--ghost" style={{ border: '1px solid var(--border)' }} onClick={() => setEdit(true)}>Edit Profile</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="metric-icon metric-icon--accent"><IconMail /></div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Email Address</div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{user?.email}</div>
                        </div>
                    </div>

                    <hr className="profile-divider" />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="metric-icon metric-icon--success"><IconTrending /></div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Monthly Budget</div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                                {user?.monthlyBudget ? `${user.currency} ${user.monthlyBudget}` : 'Not set'}
                            </div>
                        </div>
                    </div>

                    <hr className="profile-divider" />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="metric-icon metric-icon--muted" style={{ fontSize: 14 }}>🌍</div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Currency</div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{user?.currency}</div>
                        </div>
                    </div>

                    <hr className="profile-divider" />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="metric-icon metric-icon--muted" style={{ fontSize: 14 }}>🔐</div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Security</div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>JWT Authentication · Encrypted</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── App Shell ────────────────────────────────────────────────────────── */
function AppShell() {
    const { user, logout } = useAuth();
    const [activeView, setActiveView] = useState('dashboard');
    const {
        expenses, meta, loading, error,
        category, sort, page,
        setCategory, setSort, setPage,
        create, update, remove, submitting,
    } = useExpenses();

    const sharedProps = {
        expenses, meta, loading, error,
        category, sort, page,
        setCategory, setSort, setPage,
        create, update, remove, submitting,
    };

    return (
        <div className="layout">
            <Sidebar user={user} onLogout={logout} activeView={activeView} onViewChange={setActiveView} />
            <main className="main-content">
                {activeView === 'dashboard' && <DashboardView {...sharedProps} />}
                {activeView === 'transactions' && <TransactionsView {...sharedProps} />}
                {activeView === 'profile' && <ProfileView user={user} />}
            </main>
        </div>
    );
}

/* ── App Root ─────────────────────────────────────────────────────────── */
export default function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="app-loader">
                <span className="spinner spinner--lg spinner--accent" />
            </div>
        );
    }

    return (
        <>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#FFFFFF',
                        color: '#0F172A',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontFamily: 'Inter, sans-serif',
                        padding: '14px 24px',
                        boxShadow: '0 10px 32px rgba(0,0,0,0.08)',
                        minWidth: '280px',
                    },
                    success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
                }}
            />
            {user ? <AppShell /> : <AuthPage />}
        </>
    );
}
