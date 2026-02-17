import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

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
    const toast = useToast();
    const symbol = currency?.symbol || '₹';

    const today = new Date().toISOString().split('T')[0];
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(today);
    const [category, setCategory] = useState('food');
    const [description, setDescription] = useState('');
    const [receipt, setReceipt] = useState(null);
    const [errors, setErrors] = useState({});
    const fileRef = useRef(null);

    const validate = () => {
        const errs = {};
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            errs.amount = 'Enter a valid amount';
        }
        if (!date) errs.date = 'Select a date';
        if (!category) errs.category = 'Pick a category';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});

        try {
            await onSubmit({
                amount: Number(amount),
                date,
                category,
                description: description.trim(),
                receipt,
            });

            toast.success('Expense added successfully');
            setAmount('');
            setDate(today);
            setCategory('food');
            setDescription('');
            setReceipt(null);
            if (fileRef.current) fileRef.current.value = '';
        } catch (err) {
            toast.error(err.message || 'Failed to add expense');
        }
    };

    return (
        <div className="card">
            <div className="card__header">
                <span className="card__title">New Expense</span>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="exp-amount">Amount ({symbol})</label>
                        <input
                            id="exp-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={loading}
                        />
                        {errors.amount && <div className="form-error">{errors.amount}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="exp-date">Date</label>
                        <input
                            id="exp-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={loading}
                        />
                        {errors.date && <div className="form-error">{errors.date}</div>}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="exp-category">Category</label>
                    <select
                        id="exp-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={loading}
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                    {errors.category && <div className="form-error">{errors.category}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="exp-desc">Description</label>
                    <textarea
                        id="exp-desc"
                        placeholder="What was it for?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        rows={2}
                    />
                </div>

                <div className="form-group">
                    <label>Receipt</label>
                    <div className={`file-upload${receipt ? ' has-file' : ''}`}>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileRef}
                            onChange={(e) => setReceipt(e.target.files[0] || null)}
                            disabled={loading}
                        />
                        <div className="file-upload__label">
                            <span className="file-upload__icon">
                                {receipt ? '✓' : '📎'}
                            </span>
                            <span>
                                {receipt ? receipt.name : 'Drop image or click to upload'}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading && <span className="spinner spinner--sm" />}
                    Add Expense
                </button>
            </form>
        </div>
    );
}
