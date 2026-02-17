import { useState } from 'react';
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

/* ── Sidebar ──────────────────────────────────────────────────────────── */
function Sidebar({ user, onLogout, activeView, onViewChange }) {
    const initial = user?.email?.[0]?.toUpperCase() || '?';

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
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initial}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-email">{user?.email}</div>
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

/* ── Dashboard View ───────────────────────────────────────────────────── */
function DashboardView({ meta, expenses, loading, error, category, sort, page,
    setCategory, setSort, setPage, create, update, remove, submitting }) {
    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Track and manage your expenses</p>
            </div>

            <ExpenseSummary meta={meta} />

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
    const initial = user?.email?.[0]?.toUpperCase() || '?';

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Profile</h1>
                <p className="page-subtitle">Your account details</p>
            </div>

            <div className="card" style={{ maxWidth: 560 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                    <div className="sidebar-avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
                        {initial}
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                            {user?.email}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Personal Plan</div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="metric-icon metric-icon--accent"><IconMail /></div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>
                                Email Address
                            </div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                                {user?.email}
                            </div>
                        </div>
                    </div>

                    <hr className="profile-divider" />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="metric-icon metric-icon--success"><IconShield /></div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>
                                Account Status
                            </div>
                            <div style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>
                                Active
                            </div>
                        </div>
                    </div>

                    <hr className="profile-divider" />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="metric-icon metric-icon--muted" style={{ fontSize: 14 }}>🔐</div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>
                                Security
                            </div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                                JWT Authentication · Encrypted
                            </div>
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
