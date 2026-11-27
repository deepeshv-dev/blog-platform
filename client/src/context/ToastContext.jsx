import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(() => {});
let nextToastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const notify = useCallback((message, type = 'success') => {
    const id = ++nextToastId;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);
  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.type}`} key={toast.id} role="status">
            <span>{toast.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
