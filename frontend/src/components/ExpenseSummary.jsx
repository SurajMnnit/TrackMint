import { useAuth } from '../context/AuthContext';

export default function ExpenseSummary({ meta }) {
    const { currency } = useAuth();
    const symbol = currency?.symbol || '₹';

    if (!meta) return null;

    return (
        <div className="metrics-grid">
            <div className="metric-card">
                <div className="metric-header">
                    <span className="metric-label">Total Spent</span>
                    <div className="metric-icon metric-icon--accent">💰</div>
                </div>
                <div className="metric-value">{symbol}{meta.grand_total}</div>
                <div className="metric-sub">All-time expenses</div>
            </div>

            <div className="metric-card">
                <div className="metric-header">
                    <span className="metric-label">Transactions</span>
                    <div className="metric-icon metric-icon--success">📊</div>
                </div>
                <div className="metric-value">{meta.total_count}</div>
                <div className="metric-sub">Total records</div>
            </div>

            <div className="metric-card">
                <div className="metric-header">
                    <span className="metric-label">This Page</span>
                    <div className="metric-icon metric-icon--muted">📄</div>
                </div>
                <div className="metric-value">{symbol}{meta.page_total}</div>
                <div className="metric-sub">Current view total</div>
            </div>
        </div>
    );
}
