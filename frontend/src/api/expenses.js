/**
 * Expense API calls.
 */

import { apiFetch } from './client';

export async function fetchExpenses({ category, sort, page, limit } = {}) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));

    const qs = params.toString();
    return apiFetch(`/expenses${qs ? '?' + qs : ''}`);
}

export async function createExpense(expense, idempotencyKey, receiptFile) {
    let body;
    const headers = { 'Idempotency-Key': idempotencyKey };

    if (receiptFile) {
        // Use FormData for file upload
        body = new FormData();
        body.append('amount', expense.amount);
        body.append('category', expense.category);
        body.append('description', expense.description || '');
        body.append('date', expense.date);
        body.append('receipt', receiptFile);
    } else {
        body = JSON.stringify(expense);
    }

    return apiFetch('/expenses', {
        method: 'POST',
        headers,
        body,
    });
}

export async function updateExpense(id, updates, receiptFile) {
    let body;

    if (receiptFile) {
        body = new FormData();
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) body.append(key, value);
        });
        body.append('receipt', receiptFile);
    } else {
        body = JSON.stringify(updates);
    }

    return apiFetch(`/expenses/${id}`, {
        method: 'PUT',
        body,
    });
}

export async function deleteExpense(id) {
    return apiFetch(`/expenses/${id}`, {
        method: 'DELETE',
    });
}
