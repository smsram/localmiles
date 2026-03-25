'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/auth/AuthGuard'; 
import { useTheme } from '@/components/providers/ThemeProvider'; // Import ThemeHook

export default function DashboardLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme(); // Get current theme state

  useEffect(() => {
    const checkMediaQuery = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    checkMediaQuery();
    window.addEventListener('resize', checkMediaQuery);
    return () => window.removeEventListener('resize', checkMediaQuery);
  }, []);

  return (
    <AuthGuard>
      <div 
        /* Failsafe: Add theme directly to layout shell class */
        className={`layout-shell ${theme === 'dark' ? 'dark' : ''}`} 
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-page)'
        }}
      >
        <Sidebar />
        
        <main 
          className="content-scroll-area"
          style={{
            flex: 1,
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            scrollBehavior: 'smooth',
            transition: 'margin-left 0.3s ease',
            marginLeft: isMobile ? '0' : 'var(--sidebar-width)',
            paddingBottom: isMobile ? '80px' : '0'
          }}
        >
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}