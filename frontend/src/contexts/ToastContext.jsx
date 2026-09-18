import { createContext, useCallback, useRef, useState } from 'react';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const contador = useRef(0);

  // tipo: 'sucesso' | 'erro'
  const mostrarToast = useCallback((mensagem, tipo = 'sucesso') => {
    const id = contador.current += 1;
    setToasts((atual) => [...atual, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts((atual) => atual.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>{t.mensagem}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
