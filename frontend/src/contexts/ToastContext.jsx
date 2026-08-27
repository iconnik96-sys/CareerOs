import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
const ToastContext = createContext(undefined);
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);
    const showToast = useCallback((message, type = 'info', title) => {
        const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        const newToast = { id, message, type, title };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
            removeToast(id);
        }, 4500);
    }, [removeToast]);
    return (<ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(toast => {
            const icon = {
                success: <CheckCircle2 size={20} className="text-success"/>,
                error: <AlertCircle size={20} className="text-danger"/>,
                warning: <AlertTriangle size={20} className="text-warning"/>,
                info: <Info size={20} className="text-primary-accent"/>
            }[toast.type];
            return (<div key={toast.id} className="toast-item" role="alert">
              <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>
              <div style={{ flex: 1 }}>
                {toast.title && <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px' }}>{toast.title}</div>}
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{toast.message}</div>
              </div>
              <button onClick={() => removeToast(toast.id)} className="btn-ghost" style={{ padding: '2px', color: 'var(--text-muted)' }}>
                <X size={16}/>
              </button>
            </div>);
        })}
      </div>
    </ToastContext.Provider>);
};
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
