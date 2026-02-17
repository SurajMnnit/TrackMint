import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout } from '../api/auth';
import { hasToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [currency, setCurrency] = useState({ code: 'INR', symbol: '₹' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshUser = useCallback(async () => {
        try {
            const res = await getMe();
            setUser(res.data.user);
            if (res.data.currency) setCurrency(res.data.currency);
        } catch (err) {
            setToken(null);
            setUser(null);
        }
    }, []);

    // Check if already authenticated on mount
    useEffect(() => {
        if (!hasToken()) {
            setLoading(false);
            return;
        }

        refreshUser().finally(() => setLoading(false));
    }, [refreshUser]);

    // Listen for 401 logout events from the API client
    useEffect(() => {
        const handler = () => {
            setUser(null);
        };
        window.addEventListener('auth:logout', handler);
        return () => window.removeEventListener('auth:logout', handler);
    }, []);

    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const res = await apiLogin(email, password);
            setUser(res.data.user);
            if (res.data.currency) setCurrency(res.data.currency);
            return res;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const register = useCallback(async (data) => {
        setError(null);
        try {
            const res = await apiRegister(data);
            setUser(res.data.user);
            if (res.data.currency) setCurrency(res.data.currency);
            return res;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const updateProfile = useCallback(async (data) => {
        setError(null);
        try {
            const { updateProfile: apiUpdate } = await import('../api/auth');
            const res = await apiUpdate(data);
            setUser(res.data.user);
            // In case currency changed
            if (res.data.user.currency) {
                // Symbols could be updated here if we have a map
                const symbols = { INR: '₹', USD: '$', EUR: '€' };
                setCurrency({ code: res.data.user.currency, symbol: symbols[res.data.user.currency] || '₹' });
            }
            return res;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        apiLogout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, currency, loading, error, login, register, updateProfile, logout, refreshUser, setError }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
