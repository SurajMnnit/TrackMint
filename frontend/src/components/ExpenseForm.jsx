import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
    { value: 'food', label: 'Food' },
    { value: 'transport', label: 'Transport' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'health', label: 'Health' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'education', label: 'Education' },
    { value: 'rent', label: 'Rent' },
    { value: 'other', label: 'Other' },
];

export default function ExpenseForm({ onSubmit, loading }) {
    const { currency } = useAuth();
    const symbol = currency?.symbol || '₹';

    const today = new Date().toISOString().split('T')[0];
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(today);
    const [category, setCategory] = useState('food');
    const [description, setDescription] = useState('');
    const [receipt, setReceipt] = useState(null);
    const fileRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Enter a valid amount.');
            return;
        }

        const tid = toast.loading('Adding expense…');

        try {
            await onSubmit({
                amount: Number(amount),
                date,
                category,
                description: description.trim(),
                receipt,
            });
            toast.success('Expense added!', { id: tid });
            setAmount('');
            setDate(today);
            setCategory('food');
            setDescription('');
            setReceipt(null);
            if (fileRef.current) fileRef.current.value = '';
        } catch (err) {
            toast.error(err.message || 'Failed to add expense.', { id: tid });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Amount ({symbol})</label>
                    <input className="form-input" type="number" step="0.01" placeholder="0.00"
                        value={amount} onChange={(e) => setAmount(e.target.value)} disabled={loading} />
                </div>
                <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={date}
                        onChange={(e) => setDate(e.target.value)} disabled={loading} />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={category}
                    onChange={(e) => setCategory(e.target.value)} disabled={loading}>
                    {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" type="text" placeholder="What was it for?"
                    value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
            </div>

            <div className="form-group">
                <label className="form-label">Receipt</label>
                <div className={`file-upload${receipt ? ' file-upload--active' : ''}`}>
                    <input type="file" accept="image/*" ref={fileRef}
                        onChange={(e) => setReceipt(e.target.files[0] || null)} disabled={loading} />
                    <div className="file-upload-content">
                        <span className="file-upload-icon">{receipt ? '✅' : '📎'}</span>
                        <span className="file-upload-text">
                            {receipt ? receipt.name : 'Click to attach receipt'}
                        </span>
                    </div>
                </div>
            </div>

            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading && <span className="spinner spinner--sm" />}
                Add Expense
            </button>
        </form>
    );
}
