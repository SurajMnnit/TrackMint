import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
import { v4 as uuidv4 } from 'uuid';

/**
 * Central hook for expense state management.
 */
export function useExpenses() {
    const [expenses, setExpenses] = useState([]);
    const [meta, setMeta] = useState({
        count: 0,
        total_count: 0,
        total_pages: 1,
        page: 1,
        limit: 20,
        page_total: '0.00',
        grand_total: '0.00',
        currency_symbol: '₹',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('date_desc');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    // Submission state
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Idempotency key — refreshed after each successful submission
    const idempotencyKeyRef = useRef(uuidv4());

    // ── Fetch expenses ──────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchExpenses({
                category: category || undefined,
                sort,
                page,
                limit,
            });
            setExpenses(result.data);
            setMeta(result.meta);
        } catch (err) {
            setError(err.message || 'Failed to load expenses.');
        } finally {
            setLoading(false);
        }
    }, [category, sort, page, limit]);

    useEffect(() => {
        load();
    }, [load]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [category, sort]);

    // ── Create expense ──────────────────────────────────────────────────
    const create = useCallback(
        async (expenseData, receiptFile) => {
            if (submitting) return;

            setSubmitting(true);
            setSubmitError(null);
            setSubmitSuccess(false);

            try {
                await createExpense(expenseData, idempotencyKeyRef.current, receiptFile);
                setSubmitSuccess(true);

                // Generate new idempotency key for next submission
                idempotencyKeyRef.current = uuidv4();

                // Refresh list
                await load();
            } catch (err) {
                setSubmitError(err.message || 'Failed to create expense.');
            } finally {
                setSubmitting(false);
            }
        },
        [submitting, load]
    );

    // ── Update expense ──────────────────────────────────────────────────
    const update = useCallback(
        async (id, updates, receiptFile) => {
            try {
                await updateExpense(id, updates, receiptFile);
                await load();
                return true;
            } catch (err) {
                setError(err.message || 'Failed to update expense.');
                return false;
            }
        },
        [load]
    );

    // ── Delete expense ──────────────────────────────────────────────────
    const remove = useCallback(
        async (id) => {
            try {
                await deleteExpense(id);
                await load();
                return true;
            } catch (err) {
                setError(err.message || 'Failed to delete expense.');
                return false;
            }
        },
        [load]
    );

    // Clear success message after 3s
    useEffect(() => {
        if (!submitSuccess) return;
        const t = setTimeout(() => setSubmitSuccess(false), 3000);
        return () => clearTimeout(t);
    }, [submitSuccess]);

    return {
        expenses,
        meta,
        loading,
        error,
        category,
        setCategory,
        sort,
        setSort,
        page,
        setPage,
        submitting,
        submitError,
        submitSuccess,
        create,
        update,
        remove,
        reload: load,
    };
}
