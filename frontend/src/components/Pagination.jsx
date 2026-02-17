export default function Pagination({ page, totalPages, onPageChange }) {
    if (!totalPages || totalPages <= 1) return null;

    const getPages = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        start = Math.max(1, end - maxVisible + 1);

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }

        for (let i = start; i <= end; i++) pages.push(i);

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="pagination">
            <button
                className="pagination-btn"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
            >
                ‹
            </button>

            {getPages().map((p, i) =>
                p === '...' ? (
                    <span key={`dots-${i}`} className="pagination-dots">…</span>
                ) : (
                    <button
                        key={p}
                        className={`pagination-btn${p === page ? ' pagination-btn--active' : ''}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                className="pagination-btn"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
            >
                ›
            </button>
        </div>
    );
}
