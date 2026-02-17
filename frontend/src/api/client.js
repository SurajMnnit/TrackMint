/**
 * Base HTTP client with auth token injection and error handling.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
    constructor(status, message, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

function getToken() {
    return localStorage.getItem('trackmint_token');
}

export function setToken(token) {
    if (token) {
        localStorage.setItem('trackmint_token', token);
    } else {
        localStorage.removeItem('trackmint_token');
    }
}

export function hasToken() {
    return !!localStorage.getItem('trackmint_token');
}

/**
 * Perform an authenticated JSON request.
 */
export async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type for non-FormData bodies
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers,
    });

    // Handle 401 — auto-logout
    if (res.status === 401) {
        setToken(null);
        window.dispatchEvent(new Event('auth:logout'));
    }

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new ApiError(res.status, body.error || 'Request failed.', body.details);
    }

    return body;
}
