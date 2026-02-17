import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ICONS = {
    food: '🍔', transport: '🚗', entertainment: '🎬', utilities: '💡',
    health: '🏥', shopping: '🛍️', education: '📚', rent: '🏠', other: '📦',
};

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ExpenseList({ expenses, onUpdate, onDelete, loading }) {
    const { currency } = useAuth();
    const symbol = currency?.symbol || '₹';
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        setDeletingId(id);
        const tid = toast.loading('Deleting…');
        try {
            await onDelete(id);
            toast.success('Expense deleted.', { id: tid });
        } catch (err) {
            toast.error(err.message || 'Failed to delete.', { id: tid });
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <div>{[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}</div>;
    }

    if (!expenses || expenses.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">No expenses yet</div>
                <p className="empty-state-text">Add your first expense using the form to get started.</p>
            </div>
        );
    }

    return (
        <div>
            {expenses.map((exp) => (
                <div key={exp.id} className="expense-row">
                    <div className="expense-icon-box">
                        {CATEGORY_ICONS[exp.category] || '💰'}
                    </div>
                    <div className="expense-details">
                        <div className="expense-title">{exp.description || exp.category}</div>
                        <div className="expense-meta">
                            <span className={`badge badge--${exp.category}`}>{exp.category}</span>
                            <span>·</span>
                            <span>{formatDate(exp.date)}</span>
                            {exp.receipt_path && <span title="Has receipt">📎</span>}
                        </div>
                    </div>
                    <div className="expense-amount-col">
                        <div className="expense-amount-value">{symbol}{exp.amount}</div>
                    </div>
                    <div className="expense-actions">
                        <button className="action-btn action-btn--danger"
                            onClick={() => handleDelete(exp.id)}
                            disabled={deletingId === exp.id} title="Delete">
                            {deletingId === exp.id
                                ? <span className="spinner spinner--sm spinner--accent" />
                                : '🗑'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
