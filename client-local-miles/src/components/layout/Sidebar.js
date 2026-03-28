'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  Squares2X2Icon, 
  TruckIcon, 
  WalletIcon, 
  Cog6ToothIcon, 
  MapIcon, 
  ClipboardDocumentListIcon, 
  UserCircleIcon,
  BookOpenIcon, 
  ArrowRightOnRectangleIcon,
  SunIcon, 
  MoonIcon, 
  Bars3Icon, 
  XMarkIcon,
  PlusCircleIcon, 
  MapPinIcon 
} from '@heroicons/react/24/outline';

// --- COMPONENTS ---
import ToastNotification from '@/components/ui/ToastNotification';
import ConfirmModal from '@/components/ui/ConfirmModal';
import '@/styles/Sidebar.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Sidebar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  // UI State for Logout process
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 1. Determine Mode based on URL
  const isCourierPath = pathname?.startsWith('/courier');

  // 2. Load User & Handle Security Redirects
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // --- SECURITY REDIRECTS ---
      if (parsedUser.primaryGoal === 'SENDER' && pathname.startsWith('/courier')) {
        router.replace('/sender');
      }
      if (parsedUser.primaryGoal === 'COURIER' && pathname.startsWith('/sender')) {
        router.replace('/courier');
      }
    }
  }, [pathname, router]);

  // 3. Define Navigation Menus
  const senderNav = [
    { name: 'Dashboard', href: '/sender', icon: Squares2X2Icon },
    { name: 'Send Package', href: '/sender/send', icon: PlusCircleIcon },
    { name: 'My Shipments', href: '/sender/shipments', icon: TruckIcon },
    { name: 'Address Book', href: '/sender/address', icon: BookOpenIcon },
    { name: 'Wallet', href: '/sender/wallet', icon: WalletIcon },
    { name: 'Settings', href: '/sender/settings', icon: Cog6ToothIcon },
  ];

  const courierNav = [
    { name: 'Dashboard', href: '/courier', icon: Squares2X2Icon },
    { name: 'Post Route', href: '/courier/route', icon: MapPinIcon }, 
    { name: 'Find Jobs', href: '/courier/jobs', icon: MapIcon },
    { name: 'My Activities', href: '/courier/activities', icon: ClipboardDocumentListIcon },
    { name: 'Address Book', href: '/courier/address', icon: BookOpenIcon },
    { name: 'Earnings', href: '/courier/earnings', icon: WalletIcon },
    { name: 'My Profile', href: '/courier/profile', icon: UserCircleIcon },
    { name: 'Settings', href: '/courier/settings', icon: Cog6ToothIcon },
  ];

  const currentNav = isCourierPath ? courierNav : senderNav;
  
  // Only show mode switcher if primaryGoal is 'BOTH'
  const showSwitcher = user?.primaryGoal === 'BOTH';

  // Active Link Logic
  const isLinkActive = (href) => {
    if (!pathname) return false;
    if (href === '/sender' || href === '/courier') return pathname === href;
    return pathname.startsWith(href);
  };

  // --- LOGOUT EXECUTION ---
  const handleLogout = async () => {
    setIsLoggingOut(true);
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error("Backend logout failed, proceeding with local cleanup:", error);
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToast({ show: true, message: 'Logged out successfully!', type: 'success' });
    setShowLogoutConfirm(false);
    
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
        onClick={() => setIsOpen(false)}
      />

      {/* Main Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        
        {/* LOGO AREA */}
        <div className="logo-area">
          <Link href="/" className="logo-link" onClick={() => setIsOpen(false)}>
            <div className="logo-box">
              <Image 
                src="/local-miles.jpg" 
                alt="Logo" 
                fill 
                style={{ objectFit: 'cover' }} 
                priority
              />
            </div>
            <span className="logo-text">Local Miles</span>
          </Link>
          {isOpen && (
            <button onClick={() => setIsOpen(false)} className="close-btn">
              <XMarkIcon style={{ width: 24 }} />
            </button>
          )}
        </div>

        {/* MODE SWITCHER (Sender / Courier) */}
        {showSwitcher && (
          <div className="user-switcher-area">
            <div className="user-switcher-track">
              <Link 
                href="/sender" 
                onClick={() => setIsOpen(false)}
                className={`mode-link ${!isCourierPath ? 'active' : ''}`}
              >
                Sender
              </Link>
              <Link 
                href="/courier" 
                onClick={() => setIsOpen(false)}
                className={`mode-link ${isCourierPath ? 'active' : ''}`}
              >
                Courier
              </Link>
            </div>
          </div>
        )}

        {/* NAVIGATION LINKS */}
        <nav className="nav-container">
          <div className="nav-label">
            {isCourierPath ? 'Driver Tools' : 'Main Menu'}
          </div>
          
          {currentNav.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <item.icon className="nav-icon" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER SECTION */}
        <div className="sidebar-bottom">
          {/* Theme Toggle */}
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            <span>Appearance</span>
            {theme === 'light' ? (
              <MoonIcon style={{ width: 18, height: 18 }} />
            ) : (
              <SunIcon style={{ width: 18, height: 18 }} />
            )}
          </button>

          {/* User Profile Card */}
          <div className="user-card">
            <div className="avatar">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <div className="user-info">
              <span className="user-name">
                {user?.fullName || 'User'}
              </span>
              <span className="user-role">
                {user?.primaryGoal === 'BOTH' 
                  ? (isCourierPath ? 'Courier Mode' : 'Sender Mode')
                  : (user?.primaryGoal === 'COURIER' ? 'Courier Pro' : 'Sender Account')
                }
              </span>
            </div>

            <button 
              className="logout-btn" 
              onClick={() => setShowLogoutConfirm(true)} 
              title="Logout"
            >
              <ArrowRightOnRectangleIcon style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="bottom-bar">
        <Link 
          href={isCourierPath ? "/courier" : "/sender"} 
          className={`bottom-item ${isLinkActive(isCourierPath ? "/courier" : "/sender") ? 'active' : ''}`}
        >
          <Squares2X2Icon className="bottom-icon" />
          <span>Home</span>
        </Link>

        <Link 
          href={isCourierPath ? "/courier/route" : "/sender/send"} 
          className={`bottom-item ${isLinkActive(isCourierPath ? "/courier/route" : "/sender/send") ? 'active' : ''}`}
        >
          {isCourierPath ? <MapPinIcon className="bottom-icon" /> : <PlusCircleIcon className="bottom-icon" />}
          <span>{isCourierPath ? 'Route' : 'Send'}</span>
        </Link>

        <Link 
          href={isCourierPath ? "/courier/jobs" : "/sender/shipments"} 
          className={`bottom-item ${isLinkActive(isCourierPath ? "/courier/jobs" : "/sender/shipments") ? 'active' : ''}`}
        >
          {isCourierPath ? <MapIcon className="bottom-icon" /> : <TruckIcon className="bottom-icon" />}
          <span>{isCourierPath ? 'Jobs' : 'Activity'}</span>
        </Link>

        <button 
          className={`bottom-item menu-toggle ${isOpen ? 'active' : ''}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bars3Icon className="bottom-icon" />
          <span>Menu</span>
        </button>
      </div>

      <ConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to end your session?"
        confirmText="Logout"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isLoggingOut}
      />

      <ToastNotification 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </>
  );
}