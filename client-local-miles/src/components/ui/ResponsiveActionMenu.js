'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

export default function ResponsiveActionMenu({ 
  primary,      
  secondary,    
  menuItems,    
  title = "Options" 
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Track positioning
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, bottom: 'auto' });
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  
  const buttonRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    
    // --- 1. MOBILE CHECK ---
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    
    // --- 2. THEME OBSERVER ---
    const htmlElement = document.documentElement;
    const syncTheme = () => {
      const themeAttr = htmlElement.getAttribute('data-theme');
      const isDarkClass = htmlElement.classList.contains('dark');
      setCurrentTheme(themeAttr || (isDarkClass ? 'dark' : 'light'));
    };
    
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    // --- 3. EVENT LISTENERS ---
    const handleClose = () => setIsMenuOpen(false);
    window.addEventListener('resize', () => { checkMobile(); handleClose(); });
    window.addEventListener('scroll', handleClose, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  const toggleMenu = () => {
    if (!isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Assume each menu item is roughly 40px tall + padding
      const estimatedMenuHeight = (menuItems?.length || 0) * 45 + 20; 
      
      // Calculate available space below the button
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // Determine if we should open UPWARDS or DOWNWARDS
      const shouldOpenUpwards = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;

      if (shouldOpenUpwards) {
        // Open UP: Anchor to the bottom of the viewport relative to the top of the button
        setMenuPosition({
          top: 'auto',
          bottom: window.innerHeight - rect.top + 8, // 8px spacing
          left: rect.right - 200 // Align right edge
        });
      } else {
        // Open DOWN: Standard anchoring
        setMenuPosition({
          top: rect.bottom + 8, // 8px spacing
          bottom: 'auto',
          left: rect.right - 200 // Align right edge
        });
      }
    }
    setIsMenuOpen(!isMenuOpen);
  };

  // --- THEME-AWARE STYLES ---
  const styles = {
    container: { display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' },
    btnBase: { padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', whiteSpace: 'nowrap', border: '1px solid transparent' },
    
    gold: { backgroundColor: 'var(--brand-gold)', color: '#171717' }, 
    outline: { backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-main)' },
    disabled: { backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.6 },
    
    menuBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
    
    desktopOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, cursor: 'default' },
    mobileOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9998, backdropFilter: 'blur(4px)', animation: 'ramFadeIn 0.2s forwards' },

    popupMenu: {
      position: 'fixed', // Switched to fixed so viewport math works cleanly
      top: menuPosition.top,
      bottom: menuPosition.bottom,
      left: menuPosition.left,
      width: '200px',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      padding: '6px',
      zIndex: 9999,
      animation: menuPosition.bottom !== 'auto' ? 'ramFadeInUp 0.15s ease-out' : 'ramFadeInDown 0.15s ease-out'
    },
    
    bottomSheet: { 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        backgroundColor: 'var(--bg-card)', 
        borderRadius: '20px 20px 0 0', padding: '24px 20px 40px 20px', 
        zIndex: 9999, animation: 'ramSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards', 
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        borderTop: '1px solid var(--border-light)'
    },
    
    menuItem: { 
        display: 'flex', alignItems: 'center', gap: '12px', width: '100%', 
        padding: isMobile ? '16px 12px' : '10px 12px', border: 'none', 
        background: 'transparent', textAlign: 'left', fontSize: isMobile ? '1rem' : '0.9rem', 
        color: 'var(--text-main)', borderRadius: isMobile ? '0' : '8px', cursor: 'pointer', 
        borderBottom: isMobile ? '1px solid var(--border-light)' : 'none', transition: 'all 0.2s' 
    }
  };

  const renderMenuPortal = () => {
    if (!mounted || !isMenuOpen) return null;

    const PortalWrapper = ({ children }) => (
      <div data-theme={currentTheme} className={currentTheme === 'dark' ? 'dark' : ''}>
        {children}
      </div>
    );

    if (isMobile) {
      return createPortal(
        <PortalWrapper>
          <div style={styles.mobileOverlay} onClick={() => setIsMenuOpen(false)} />
          <div style={styles.bottomSheet}>
            <div style={{ width: 40, height: 4, background: 'var(--border-light)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h4 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700 }}>{title}</h4>
            {menuItems.map((item, idx) => (
              <button 
                key={idx} 
                className="ram-menu-item"
                style={{...styles.menuItem, color: item.color || 'var(--text-main)'}} 
                onClick={() => { item.onClick && item.onClick(); setIsMenuOpen(false); }}
              >
                {item.icon && <item.icon style={{ width: 22, height: 22 }} />}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </PortalWrapper>,
        document.body
      );
    }

    return createPortal(
      <PortalWrapper>
        <div style={styles.desktopOverlay} onClick={() => setIsMenuOpen(false)} />
        <div style={styles.popupMenu}>
          {menuItems.map((item, idx) => (
            <button 
              key={idx} 
              className="ram-menu-item"
              style={{...styles.menuItem, color: item.color || 'var(--text-main)'}} 
              onClick={() => { item.onClick && item.onClick(); setIsMenuOpen(false); }}
            >
              {item.icon && <item.icon style={{ width: 18, height: 18 }} />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </PortalWrapper>,
      document.body
    );
  };

  return (
    <div style={styles.container}>
      {secondary && (
        <button className="ram-btn-secondary" style={{...styles.btnBase, ...styles.outline}} onClick={secondary.onClick}>
          {secondary.label}
        </button>
      )}
      
      {primary && (
        <button 
            className={primary.style === 'gold' ? 'ram-btn-primary' : 'ram-btn-secondary'}
            style={{...styles.btnBase, ...(primary.style === 'gold' ? styles.gold : styles.outline), ...(primary.disabled ? styles.disabled : {})}} 
            disabled={primary.disabled} 
            onClick={primary.onClick}
        >
          {primary.icon && <primary.icon style={{ width: 18, height: 18 }} />}
          {primary.label}
        </button>
      )}

      {menuItems && menuItems.length > 0 && (
        <button 
          ref={buttonRef} 
          className="ram-menu-btn"
          style={styles.menuBtn} 
          onClick={toggleMenu}
        >
          <EllipsisVerticalIcon style={{ width: 24, height: 24 }} />
        </button>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ramFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ramSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes ramFadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ramFadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .ram-menu-item:hover {
            background-color: var(--bg-page) !important;
        }
        .ram-menu-btn:hover {
            background-color: var(--border-light) !important;
            color: var(--text-main) !important;
        }
        .ram-btn-primary:hover:not(:disabled) {
            opacity: 0.9;
            transform: scale(0.98);
        }
        .ram-btn-secondary:hover:not(:disabled) {
            background-color: var(--bg-page) !important;
            border-color: var(--text-muted) !important;
        }
      `}} />

      {renderMenuPortal()}
    </div>
  );
}