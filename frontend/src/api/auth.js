/**
 * Auth API calls.
 */

import { apiFetch, setToken } from './client';

export async function register(data) {
    const result = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (result.data?.token) {
        setToken(result.data.token);
    }
    return result;
}

export async function login(email, password) {
    const result = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    if (result.data?.token) {
        setToken(result.data.token);
    }
    return result;
}

export async function updateProfile(data) {
    return apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function getMe() {
    return apiFetch('/auth/me');
}

export function logout() {
    setToken(null);
}
