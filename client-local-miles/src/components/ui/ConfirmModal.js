'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isDanger = false, // If true, colors the confirm button red
  isLoading = false
}) {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    setMounted(true);
    
    // Theme sync logic to ensure modal matches the current page theme
    const htmlElement = document.documentElement;
    const syncTheme = () => {
      const themeAttr = htmlElement.getAttribute('data-theme');
      const isDarkClass = htmlElement.classList.contains('dark');
      setCurrentTheme(themeAttr || (isDarkClass ? 'dark' : 'light'));
    };
    
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    return () => observer.disconnect();
  }, []);

  if (!mounted || !isOpen) return null;

  // --- INLINE STYLES DICTIONARY ---
  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', // Changed to flex-start
      zIndex: 99999, paddingTop: '80px', paddingLeft: '20px', paddingRight: '20px', // Added top padding
      animation: 'cmFadeIn 0.2s ease-out forwards'
    },
    card: {
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative',
      animation: 'cmSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' // Changed animation
    },
    closeBtn: {
      position: 'absolute', top: '16px', right: '16px', background: 'transparent', 
      border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', 
      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s'
    },
    header: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
    iconWrapper: {
      width: '48px', height: '48px', borderRadius: '50%', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
      background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      color: isDanger ? '#EF4444' : '#F59E0B'
    },
    title: { fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 },
    body: { textAlign: 'center', margin: '12px 0 24px 0' },
    text: { fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 },
    footer: { display: 'flex', gap: '12px' },
    btnBase: {
      flex: 1, padding: '12px', borderRadius: '10px', fontWeight: '600', 
      fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none'
    },
    cancelBtn: { background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-main)' },
    confirmBtn: { background: 'var(--brand-gold)', color: '#171717' },
    dangerBtn: { background: '#EF4444', color: 'white' },
    disabled: { opacity: 0.6, cursor: 'not-allowed' }
  };

  return createPortal(
    <div data-theme={currentTheme} className={currentTheme === 'dark' ? 'dark' : ''}>
      
      <div style={styles.overlay} onClick={!isLoading ? onClose : undefined}>
        <div style={styles.card} onClick={(e) => e.stopPropagation()}>
          
          <button 
            className="cm-hover-close" 
            style={styles.closeBtn} 
            onClick={onClose} 
            disabled={isLoading}
          >
            <XMarkIcon width={20} />
          </button>

          <div style={styles.header}>
            <div style={styles.iconWrapper}>
              <ExclamationTriangleIcon width={24} />
            </div>
            <h3 style={styles.title}>{title}</h3>
          </div>
          
          <div style={styles.body}>
            <p style={styles.text}>{message}</p>
          </div>

          <div style={styles.footer}>
            <button 
              className="cm-hover-cancel" 
              style={{ ...styles.btnBase, ...styles.cancelBtn, ...(isLoading ? styles.disabled : {}) }} 
              onClick={onClose} 
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button 
              className={isDanger ? "cm-hover-danger" : "cm-hover-confirm"}
              style={{ 
                ...styles.btnBase, 
                ...(isDanger ? styles.dangerBtn : styles.confirmBtn), 
                ...(isLoading ? styles.disabled : {}) 
              }} 
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes cmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        /* Changed animation to slide down from top */
        @keyframes cmSlideDown { 
          from { transform: translateY(-40px) scale(0.95); opacity: 0; } 
          to { transform: translateY(0) scale(1); opacity: 1; } 
        }
        
        .cm-hover-close:hover { background: var(--bg-page) !important; color: var(--text-main) !important; }
        .cm-hover-cancel:hover:not(:disabled) { background: var(--bg-page) !important; }
        .cm-hover-confirm:hover:not(:disabled) { opacity: 0.9 !important; transform: translateY(-1px); }
        .cm-hover-danger:hover:not(:disabled) { background: #DC2626 !important; transform: translateY(-1px); }
      `}</style>
      
    </div>,
    document.body
  );
}