import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 250);
    }, []);

    const addToast = useCallback(
        (message, type = 'success') => {
            const id = ++idCounter;
            setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
            setTimeout(() => removeToast(id), 3500);
            return id;
        },
        [removeToast]
    );

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            <div className="toast-container">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`toast toast--${t.type}${t.exiting ? ' toast--exiting' : ''}`}
                    >
                        <span className="toast__icon">
                            {t.type === 'success' ? '✓' : '✕'}
                        </span>
                        <span className="toast__message">{t.message}</span>
                        <button className="toast__close" onClick={() => removeToast(t.id)}>
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const addToast = useContext(ToastContext);
    if (!addToast) throw new Error('useToast must be used within ToastProvider');
    return {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
    };
}
