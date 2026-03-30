'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({ 
  isOpen, 
  onClose, 
  children,
  maxWidth = '400px',
  showCloseBtn = true
}) {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    setMounted(true);
    
    // Theme sync logic 
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

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', // Perfectly centers vertically & horizontally
      zIndex: 99999, padding: '20px', 
      animation: 'modalFadeIn 0.2s ease-out forwards'
    },
    card: {
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: '24px', width: '100%', maxWidth: maxWidth, padding: '32px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', position: 'relative',
      animation: 'modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' 
    },
    closeBtn: {
      position: 'absolute', top: '16px', right: '16px', background: 'transparent', 
      border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', 
      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', zIndex: 10
    }
  };

  return createPortal(
    <div data-theme={currentTheme} className={currentTheme === 'dark' ? 'dark' : ''}>
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.card} onClick={(e) => e.stopPropagation()}>
          
          {showCloseBtn && (
            <button className="modal-hover-close" style={styles.closeBtn} onClick={onClose}>
              <XMarkIcon width={24} />
            </button>
          )}

          {children}

        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalScaleUp { 
          from { transform: scale(0.95); opacity: 0; } 
          to { transform: scale(1); opacity: 1; } 
        }
        .modal-hover-close:hover { background: var(--bg-page) !important; color: var(--text-main) !important; }
      `}</style>
    </div>,
    document.body
  );
}