'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  LockClosedIcon,
  UserIcon,
  TruckIcon,
  WalletIcon,
  XMarkIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

// Components
import ToastNotification from '@/components/ui/ToastNotification';
import ConfirmModal from '@/components/ui/ConfirmModal';
import '@/styles/CourierSettingsPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- PASSWORD MANAGEMENT MODAL ---
function PasswordModal({ isOpen, onClose, userEmail, onToast }) {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isChanging, setIsChanging] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [view, setView] = useState('change'); // 'change' or 'reset'

  if (!isOpen) return null;

  const handleChangeSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return onToast("New passwords do not match", "error");
    }
    
    setIsChanging(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      const data = await res.json();
      
      if (res.ok) {
        onToast("Password updated successfully!", "success");
        onClose();
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        onToast(data.message || "Failed to update password", "error");
      }
    } catch (err) {
      onToast("Network error occurred", "error");
    } finally {
      setIsChanging(false);
    }
  };

  const handleSendReset = async () => {
    setIsSendingReset(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      
      if (res.ok) {
        onToast(`Reset link sent to ${userEmail}`, "success");
        onClose();
      } else {
        const data = await res.json();
        onToast(data.message || "Failed to send link", "error");
      }
    } catch (err) {
      onToast("Network error occurred", "error");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content fade-in" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3>{view === 'change' ? 'Change Password' : 'Reset Password'}</h3>
          <button onClick={onClose} className="close-modal-btn"><XMarkIcon className="icon-24" /></button>
        </div>
        
        <div className="modal-body">
          {view === 'change' ? (
            <form onSubmit={handleChangeSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="input-field" required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="input-field" required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="input-field" required minLength={6} />
              </div>
              
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={isChanging}>
                {isChanging ? 'Updating...' : 'Update Password'}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button type="button" onClick={() => setView('reset')} style={{ background: 'none', border: 'none', color: 'var(--brand-gold)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  Forgot Password? Send Reset Link
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <EnvelopeIcon style={{ width: 48, color: 'var(--brand-gold)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-main)', marginBottom: '24px', lineHeight: 1.5 }}>
                We will send a secure password reset link to your registered email address:<br/>
                <strong>{userEmail}</strong>
              </p>
              <button onClick={handleSendReset} className="btn-primary" style={{ width: '100%', marginBottom: '12px' }} disabled={isSendingReset}>
                {isSendingReset ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button onClick={() => setView('change')} className="btn-secondary" style={{ width: '100%' }}>
                Back to Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function CourierSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // UI States
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // --- LOGOUT EXECUTION (Matches Sidebar) ---
  const handleLogout = async () => {
    setIsLoggingOut(true);
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      } catch (error) { console.error("Backend logout failed:", error); }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    triggerToast('Logged out successfully!', 'success');
    setShowLogoutConfirm(false);
    
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  };

  return (
    <div className="page-container settings-page fade-in">
      
      {/* 1. HEADER */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <div className="status-badge">
          <div className="status-dot"></div>
          ONLINE
        </div>
      </div>

      <div className="settings-grid">
        
        {/* CARD 1: ACCOUNT SHORTCUTS */}
        <div className="settings-card">
          <div className="card-title">
            <UserIcon className="title-icon" />
            Quick Actions
          </div>

          <div className="menu-list">
            <Link href="/courier/profile" className="menu-item">
              <div className="menu-left">
                <div className="menu-icon-bg bg-blue"><TruckIcon style={{ width: 18 }} /></div>
                <span>Profile & Vehicle Details</span>
              </div>
              <ChevronRightIcon style={{ width: 16, color: 'var(--text-muted)' }} />
            </Link>

            <Link href="/courier/earnings" className="menu-item">
              <div className="menu-left">
                <div className="menu-icon-bg bg-orange"><WalletIcon style={{ width: 18 }} /></div>
                <span>Earnings & Wallet</span>
              </div>
              <ChevronRightIcon style={{ width: 16, color: 'var(--text-muted)' }} />
            </Link>
          </div>
        </div>

        {/* CARD 2: SECURITY & SUPPORT */}
        <div className="settings-card">
          <div className="card-title">
            <ShieldCheckIcon className="title-icon" />
            Security & Support
          </div>

          <div className="menu-list">
            <div className="menu-item" onClick={() => setShowPasswordModal(true)}>
              <div className="menu-left">
                <div className="menu-icon-bg bg-purple"><LockClosedIcon style={{ width: 18 }} /></div>
                <span>Change Password</span>
              </div>
              <ChevronRightIcon style={{ width: 16, color: 'var(--text-muted)' }} />
            </div>

            <Link href="/help" className="menu-item">
              <div className="menu-left">
                <div className="menu-icon-bg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                  <QuestionMarkCircleIcon style={{ width: 18 }} />
                </div>
                <span>Help & Support</span>
              </div>
              <ChevronRightIcon style={{ width: 16, color: 'var(--text-muted)' }} />
            </Link>

            <Link href="/legal/terms" className="menu-item">
              <div className="menu-left">
                <div className="menu-icon-bg" style={{ background: 'rgba(75, 85, 99, 0.1)', color: '#4B5563' }}>
                  <DocumentTextIcon style={{ width: 18 }} />
                </div>
                <span>Legal & Terms</span>
              </div>
              <ChevronRightIcon style={{ width: 16, color: 'var(--text-muted)' }} />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. FOOTER LOGOUT & VERSION */}
      <div className="settings-footer-section">
        <button className="btn-logout-large" onClick={() => setShowLogoutConfirm(true)}>
          <ArrowRightOnRectangleIcon style={{ width: 22 }} />
          Log Out
        </button>
        <div className="app-version-large">
          LOCAL MILES APP<br/>v2.4.0 (Build 102)
        </div>
      </div>

      {/* MODALS */}
      <PasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
        userEmail={user?.email} 
        onToast={triggerToast} 
      />

      <ConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to end your session? You will need to log in again."
        confirmText="Logout"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isLoggingOut}
      />

      <ToastNotification 
        show={toast.show} message={toast.message} type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}