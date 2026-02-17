const CATEGORIES = [
    { value: '', label: 'All Categories' },
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

const SORT_OPTIONS = [
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
];

export default function ExpenseFilters({ category, sort, onCategoryChange, onSortChange }) {
    return (
        <div className="filters">
            <span className="filters__label">Filter</span>
            <select
                id="filter-category"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
            >
                {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                ))}
            </select>

            <span className="filters__label" style={{ marginLeft: 'auto' }}>Sort</span>
            <select
                id="filter-sort"
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
            >
                {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                ))}
            </select>
        </div>
    );
}
