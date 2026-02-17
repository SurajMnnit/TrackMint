import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout } from '../api/auth';
import { hasToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [currency, setCurrency] = useState({ code: 'INR', symbol: '₹' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if already authenticated on mount
    useEffect(() => {
        if (!hasToken()) {
            setLoading(false);
            return;
        }

        getMe()
            .then((res) => {
                setUser(res.data.user);
                if (res.data.currency) setCurrency(res.data.currency);
            })
            .catch(() => {
                setToken(null);
            })
            .finally(() => setLoading(false));
    }, []);

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

    const register = useCallback(async (email, password) => {
        setError(null);
        try {
            const res = await apiRegister(email, password);
            setUser(res.data.user);
            if (res.data.currency) setCurrency(res.data.currency);
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
            value={{ user, currency, loading, error, login, register, logout, setError }}
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
