'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/auth/AuthGuard'; 
import { useTheme } from '@/components/providers/ThemeProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme(); 

  // --- RESPONSIVE CHECK ---
  useEffect(() => {
    const checkMediaQuery = () => setIsMobile(window.innerWidth <= 900);
    checkMediaQuery();
    window.addEventListener('resize', checkMediaQuery);
    return () => window.removeEventListener('resize', checkMediaQuery);
  }, []);

  // --- COURIER ONLINE HEARTBEAT ---
  // This runs silently in the background to track "Online Hours"
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    // Only track if the user is actively using the app in COURIER mode
    if (user.lastActiveMode !== 'COURIER') return;

    const sendHeartbeat = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        await fetch(`${API_URL}/courier/heartbeat`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        // Fail silently so it doesn't disrupt the UI if network drops briefly
        console.warn("Heartbeat ping failed");
      }
    };

    // Fire immediately on mount, then every 3 minutes (180,000 ms)
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 180000);

    // Cleanup interval when layout unmounts
    return () => clearInterval(heartbeatInterval);
  }, []);

  return (
    <AuthGuard>
      <div 
        className={`layout-shell ${theme === 'dark' ? 'dark' : ''}`} 
        style={{
          display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-page)'
        }}
      >
        <Sidebar />
        <main 
          className="content-scroll-area"
          style={{
            flex: 1, height: '100%', overflowY: 'auto', overflowX: 'hidden',
            position: 'relative', scrollBehavior: 'smooth', transition: 'margin-left 0.3s ease',
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