'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner'; // <-- Import the spinner

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname(); // Tracks route changes
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        await handleLogout();
        return;
      }

      try {
        // 1. FAST LOCAL CHECK (Prevents unnecessary API calls if already expired)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) throw new Error("Token expired locally");

        // 2. SERVER SESSION CHECK (Detects if session was manually revoked/stopped)
        const res = await fetch(`${API_URL}/auth/verify-session`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Session revoked or invalid on server");

        // 3. AUTHORIZED
        setAuthorized(true);

      } catch (e) {
        console.warn("Session invalid:", e.message);
        await handleLogout();
      }
    };

    verifySession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); // Re-runs verification on route changes

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    
    // 1. Notify backend to revoke the session (if a token exists)
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error("Backend logout ping failed:", error);
      }
    }

    // 2. Wipe local state securely
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthorized(false);
    
    // 3. Redirect to login
    router.push('/login'); // Assuming '/login' is the correct route
  };

  if (!authorized) {
    // Replaced the hardcoded spinner with the reusable component
    return <LoadingSpinner fullPage={true} />;
  }

  return <>{children}</>;
}