import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

const CATEGORY_COLORS = {
    food: 'var(--cat-food)',
    transport: 'var(--cat-transport)',
    entertainment: 'var(--cat-entertainment)',
    utilities: 'var(--cat-utilities)',
    health: 'var(--cat-health)',
    shopping: 'var(--cat-shopping)',
    education: 'var(--cat-education)',
    rent: 'var(--cat-rent)',
    other: 'var(--cat-other)',
};

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function ExpenseList({ expenses, onUpdate, onDelete, loading }) {
    const { currency } = useAuth();
    const toast = useToast();
    const symbol = currency?.symbol || '₹';

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [actionLoading, setActionLoading] = useState(null);

    const startEdit = (exp) => {
        setEditingId(exp.id);
        setEditData({
            amount: exp.amount,
            description: exp.description || '',
            category: exp.category,
            date: exp.date?.split('T')[0] || '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const saveEdit = async (id) => {
        setActionLoading(id);
        try {
            await onUpdate(id, {
                amount: Number(editData.amount),
                description: editData.description,
                category: editData.category,
                date: editData.date,
            });
            toast.success('Expense updated');
            setEditingId(null);
        } catch (err) {
            toast.error(err.message || 'Update failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        setActionLoading(id);
        try {
            await onDelete(id);
            toast.success('Expense deleted');
        } catch (err) {
            toast.error(err.message || 'Delete failed');
        } finally {
            setActionLoading(null);
        }
    };

    // Skeleton while loading
    if (loading) {
        return (
            <div className="expense-list">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton skeleton-row" />
                ))}
            </div>
        );
    }

    if (!expenses || expenses.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state__icon">📭</div>
                <div className="empty-state__title">No expenses yet</div>
                <p className="empty-state__sub">
                    Add your first expense using the form to start tracking.
                </p>
            </div>
        );
    }

    return (
        <div className="expense-list">
            {expenses.map((exp) => {
                const isEditing = editingId === exp.id;
                const isActionLoading = actionLoading === exp.id;

                if (isEditing) {
                    return (
                        <div key={exp.id} className="expense-item" style={{ alignItems: 'flex-start' }}>
                            <span
                                className="expense-item__cat-dot"
                                style={{ background: CATEGORY_COLORS[exp.category], marginTop: 10 }}
                            />
                            <div className="expense-item__edit-form">
                                <div className="edit-row">
                                    <input
                                        className="edit-input edit-input--amount"
                                        type="number"
                                        step="0.01"
                                        value={editData.amount}
                                        onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                        placeholder="Amount"
                                    />
                                    <input
                                        className="edit-input"
                                        type="date"
                                        value={editData.date}
                                        onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                    />
                                </div>
                                <input
                                    className="edit-input"
                                    type="text"
                                    value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    placeholder="Description"
                                />
                                <div className="edit-actions">
                                    <button
                                        className="btn-icon btn-icon--success"
                                        onClick={() => saveEdit(exp.id)}
                                        disabled={isActionLoading}
                                        title="Save"
                                    >
                                        {isActionLoading ? <span className="spinner spinner--sm" /> : '✓'}
                                    </button>
                                    <button
                                        className="btn-icon"
                                        onClick={cancelEdit}
                                        disabled={isActionLoading}
                                        title="Cancel"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={exp.id} className="expense-item">
                        <span
                            className="expense-item__cat-dot"
                            style={{ background: CATEGORY_COLORS[exp.category] }}
                        />
                        <div className="expense-item__info">
                            <div className="expense-item__desc">
                                {exp.description || exp.category}
                            </div>
                            <div className="expense-item__meta">
                                <span>{formatDate(exp.date)}</span>
                                <span className="expense-item__meta-sep">·</span>
                                <span style={{ textTransform: 'capitalize' }}>{exp.category}</span>
                                {exp.receipt_path && (
                                    <>
                                        <span className="expense-item__meta-sep">·</span>
                                        <span className="receipt-badge">📎</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <span className="expense-item__amount">
                            {symbol}{exp.amount}
                        </span>

                        <div className="expense-item__actions">
                            <button
                                className="btn-icon"
                                onClick={() => startEdit(exp)}
                                title="Edit"
                            >
                                ✏
                            </button>
                            <button
                                className="btn-icon btn-icon--danger"
                                onClick={() => handleDelete(exp.id)}
                                disabled={isActionLoading}
                                title="Delete"
                            >
                                {isActionLoading ? <span className="spinner spinner--sm" /> : '🗑'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
