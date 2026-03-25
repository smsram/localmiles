'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  ComputerDesktopIcon, 
  DevicePhoneMobileIcon, 
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

import ToastNotification from '@/components/ui/ToastNotification';
import ConfirmModal from '@/components/ui/ConfirmModal';
import '@/styles/SettingsPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper to parse messy User-Agent strings into clean device names
const parseDevice = (uaString) => {
  if (!uaString) return { name: "Unknown Device", isMobile: false };
  
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let isMobile = false;

  if (uaString.includes("Firefox")) browser = "Firefox";
  else if (uaString.includes("Edg")) browser = "Edge";
  else if (uaString.includes("Chrome")) browser = "Chrome";
  else if (uaString.includes("Safari")) browser = "Safari";

  if (uaString.includes("Win")) os = "Windows";
  else if (uaString.includes("Mac")) os = "MacOS";
  else if (uaString.includes("Linux")) os = "Linux";
  else if (uaString.includes("Android")) { os = "Android"; isMobile = true; }
  else if (uaString.includes("iPhone") || uaString.includes("iPad")) { os = "iOS"; isMobile = true; }

  return { name: `${browser} on ${os}`, isMobile };
};

export default function ActiveSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, targetId: null, isProcessing: false });

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/auth/login');

      const res = await fetch(`${API_URL}/auth/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setSessions(data.data);
      } else {
        setToast({ show: true, message: data.message || "Failed to load sessions", type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: "Network error", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async () => {
    const { action, targetId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isProcessing: true }));

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let body = {};

      if (action === 'REVOKE_ALL') {
        endpoint = '/auth/revoke-sessions'; // Revokes all OTHER sessions
      } else if (action === 'REVOKE_ONE') {
        endpoint = '/auth/revoke-session';
        body = { sessionId: targetId };
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        ...(action === 'REVOKE_ONE' && { body: JSON.stringify(body) })
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ show: true, message: data.message || "Session revoked successfully", type: 'success' });
        setConfirmModal({ isOpen: false, action: null, targetId: null, isProcessing: false });
        fetchSessions(); // Refresh list
      } else {
        setToast({ show: true, message: data.message || "Failed to revoke session", type: 'error' });
        setConfirmModal(prev => ({ ...prev, isProcessing: false }));
      }
    } catch (err) {
      setToast({ show: true, message: "Network error occurred", type: 'error' });
      setConfirmModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  if (loading) {
    return (
      <div className="page-container settings-page" style={{display: 'flex', justifyContent: 'center', paddingTop: '100px'}}>
        <div className="spinner" style={{width: 40, height: 40, border: '3px solid var(--border-light)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
      </div>
    );
  }

  const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;

  return (
    <div className="page-container settings-page">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-page)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeftIcon width={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0', color: 'var(--text-main)' }}>Active Sessions</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Manage the devices connected to your account.</p>
        </div>
      </div>

      <div className="settings-card fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>
            <ShieldCheckIcon width={24} style={{ display: 'inline', color: 'var(--brand-gold)', marginRight: '8px' }}/> 
            Your Devices
          </h2>
          
          {otherSessionsCount > 0 && (
            <button 
              onClick={() => setConfirmModal({ isOpen: true, action: 'REVOKE_ALL', targetId: null })}
              style={{
                padding: '10px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#EF4444'; }}
            >
              Log out of all other devices
            </button>
          )}
        </div>

        <div className="sessions-list">
          {sessions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No active sessions found.</p>
          ) : (
            sessions.map((session) => {
              const device = parseDevice(session.userAgent);
              const loginDate = new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div key={session.id} className={`session-item ${session.isCurrent ? 'current-session' : ''}`}>
                  
                  <div className="session-icon">
                    {device.isMobile ? <DevicePhoneMobileIcon width={28} /> : <ComputerDesktopIcon width={28} />}
                  </div>
                  
                  <div className="session-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h4 className="session-device">{device.name}</h4>
                      {session.isCurrent && (
                        <span className="current-badge">
                          <CheckBadgeIcon width={16} /> This Device
                        </span>
                      )}
                    </div>
                    <div className="session-meta">
                      <span>IP: {session.ipAddress || 'Unknown'}</span>
                      <span className="dot-separator">•</span>
                      <span>Started: {loginDate}</span>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button 
                      className="revoke-btn"
                      onClick={() => setConfirmModal({ isOpen: true, action: 'REVOKE_ONE', targetId: session.id })}
                      title="Log out this device"
                    >
                      <TrashIcon width={20} />
                    </button>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals & Toasts */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, targetId: null, isProcessing: false })}
        onConfirm={handleAction}
        title={confirmModal.action === 'REVOKE_ALL' ? "Log Out All Devices" : "Revoke Session"}
        message={confirmModal.action === 'REVOKE_ALL' 
          ? "Are you sure you want to log out of all other devices? You will remain logged in on this device." 
          : "Are you sure you want to log out this specific device?"}
        confirmText="Yes, Log Out"
        cancelText="Cancel"
        isDanger={true}
        isLoading={confirmModal.isProcessing}
      />

      <ToastNotification 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

    </div>
  );
}