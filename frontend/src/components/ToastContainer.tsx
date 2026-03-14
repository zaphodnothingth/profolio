import React from 'react';
import { useToast } from '../context/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type} animate-slide-in-right`}>
          <div className="toast-icon">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'info' && 'i'}
          </div>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
};
