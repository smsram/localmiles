'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ToastNotification({ show, message, type = 'success', onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => { onClose(); }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const isError = type === 'error';
  const Icon = isError ? ExclamationCircleIcon : CheckCircleIcon;

  return createPortal(
    <div className={`toast-container ${isError ? 'toast-error' : 'toast-success'}`}>
      <Icon width={24} className="toast-icon" />
      <span className="toast-message">{message}</span>
      <button onClick={onClose} className="toast-close"><XMarkIcon width={18}/></button>

      <style>{`
        .toast-container {
          position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 12px; padding: 12px 20px;
          border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          z-index: 999999; animation: toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: white; font-weight: 600; font-size: 0.95rem; min-width: 300px;
        }
        .toast-success { background: #10B981; }
        .toast-error { background: #EF4444; }
        .toast-close { background: none; border: none; color: white; cursor: pointer; opacity: 0.8; margin-left: auto; display: flex; }
        .toast-close:hover { opacity: 1; }
        @keyframes toastSlideDown { 
          from { transform: translate(-50%, -20px); opacity: 0; } 
          to { transform: translate(-50%, 0); opacity: 1; } 
        }
      `}</style>
    </div>,
    document.body
  );
}