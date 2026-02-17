import { useAuth } from '../context/AuthContext';

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

export default function ExpenseSummary({ meta, expenses }) {
    const { currency } = useAuth();
    const symbol = currency?.symbol || '₹';

    if (!meta) return null;

    // compute per-category totals
    const catMap = {};
    (expenses || []).forEach((e) => {
        const key = e.category;
        if (!catMap[key]) catMap[key] = 0;
        catMap[key] += e.amount_paise;
    });

    return (
        <>
            <div className="summary-strip">
                <div className="summary-card summary-card--total">
                    <div className="summary-card__header">
                        <div className="summary-card__icon">💰</div>
                        <span className="summary-card__label">Grand Total</span>
                    </div>
                    <div className="summary-card__value">
                        {symbol}{meta.grand_total}
                    </div>
                </div>

                <div className="summary-card summary-card--count">
                    <div className="summary-card__header">
                        <div className="summary-card__icon">📊</div>
                        <span className="summary-card__label">Total Entries</span>
                    </div>
                    <div className="summary-card__value">
                        {meta.total_count}
                    </div>
                </div>

                <div className="summary-card summary-card--page">
                    <div className="summary-card__header">
                        <div className="summary-card__icon">📄</div>
                        <span className="summary-card__label">Page Total</span>
                    </div>
                    <div className="summary-card__value">
                        {symbol}{meta.page_total}
                    </div>
                </div>
            </div>

            {Object.keys(catMap).length > 0 && (
                <div className="category-summary">
                    {Object.entries(catMap)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, paise]) => (
                            <div key={cat} className="category-summary__item">
                                <span
                                    className="category-summary__dot"
                                    style={{ background: CATEGORY_COLORS[cat] || 'var(--text-muted)' }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="category-summary__cat">{cat}</div>
                                    <div className="category-summary__amt">
                                        {symbol}{(paise / (currency?.factor || 100)).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </>
    );
}
