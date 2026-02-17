import { useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import AuthPage from './components/AuthPage';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import ExpenseFilters from './components/ExpenseFilters';
import ExpenseSummary from './components/ExpenseSummary';
import Pagination from './components/Pagination';
import { useExpenses } from './hooks/useExpenses';

function Dashboard() {
    const { user, logout, currency } = useAuth();
    const {
        expenses,
        meta,
        loading,
        error,
        category,
        sort,
        page,
        setCategory,
        setSort,
        setPage,
        create,
        update,
        remove,
        submitting,
    } = useExpenses();

    return (
        <div className="app slide-up">
            {/* ── Header ────────────────────────────── */}
            <header className="header">
                <div className="header__left">
                    <div className="header__logo">
                        <span className="header__logo-icon">💰</span>
                        TrackMint
                    </div>
                    <div className="header__divider" />
                    <span className="header__breadcrumb">Dashboard</span>
                </div>

                <div className="header__right">
                    <span className="header__email">{user?.email}</span>
                    <button className="btn-logout" onClick={logout}>
                        Sign Out
                    </button>
                </div>
            </header>

            {/* ── Summary Strip ─────────────────────── */}
            <ExpenseSummary meta={meta} expenses={expenses} />

            {/* ── Main Grid ─────────────────────────── */}
            <div className="main-grid">
                {/* Left: Form */}
                <div>
                    <ExpenseForm
                        onSubmit={({ receipt, ...data }) => create(data, receipt)}
                        loading={submitting}
                    />
                </div>

                {/* Right: List */}
                <div>
                    <ExpenseFilters
                        category={category}
                        sort={sort}
                        onCategoryChange={setCategory}
                        onSortChange={setSort}
                    />

                    {error && (
                        <div className="alert alert--error">
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <ExpenseList
                        expenses={expenses}
                        loading={loading && expenses.length === 0}
                        onUpdate={update}
                        onDelete={remove}
                    />

                    <Pagination
                        page={page}
                        totalPages={meta?.total_pages}
                        onPageChange={setPage}
                    />
                </div>
            </div>
        </div>
    );
}

export default function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="app-loader">
                <span className="spinner spinner--lg" />
                <span style={{ fontSize: '0.857rem', color: 'var(--text-muted)' }}>Loading…</span>
            </div>
        );
    }

    return (
        <ToastProvider>
            {user ? <Dashboard /> : <AuthPage />}
        </ToastProvider>
    );
}
