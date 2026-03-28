'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CameraIcon, 
  CheckBadgeIcon, 
  ShieldCheckIcon, 
  DevicePhoneMobileIcon, 
  KeyIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

// Components
import Dropdown from '@/components/ui/Dropdown';
import ToastNotification from '@/components/ui/ToastNotification'; 
import ConfirmModal from '@/components/ui/ConfirmModal';
import Skeleton from '@/components/ui/Skeleton';
import VerifyMobileModal from '@/components/auth/VerifyMobileModal'; // <-- IMPORTED

import '@/styles/SettingsPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Security State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // UI States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null });
  const [showVerifyModal, setShowVerifyModal] = useState(false); // <-- VERIFY MODAL STATE
  const [resetCooldown, setResetCooldown] = useState(0);

  const [formData, setFormData] = useState({
    id: null,
    fullName: '',
    email: '',
    phone: '',
    isPhoneVerified: false,
    language: 'english_in',
    pushNotifications: true,
    emailAlerts: false,
    avatarUrl: '' 
  });

  const languageOptions = [
    { label: 'English (India)', value: 'english_in' },
    { label: 'English (US)', value: 'english_us' },
    { label: 'Hindi', value: 'hindi' },
    { label: 'Tamil', value: 'tamil' }
  ];

  // --- FETCH USER DATA ON LOAD ---
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        const user = data.data;
        setFormData(prev => ({
          ...prev,
          id: user.id,
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          isPhoneVerified: user.isPhoneVerified || false,
          avatarUrl: user.avatarUrl || '',
          pushNotifications: user.pushNotifications ?? true,
          emailAlerts: user.emailAlerts ?? false,
          language: user.language || 'english_in'
        }));
      } else {
        setToast({ show: true, message: "Failed to load profile", type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: "Network error", type: 'error' });
    } finally {
      setTimeout(() => setLoading(false), 500); 
    }
  };

  useEffect(() => {
    fetchUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleDropdown = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- SAVE PROFILE / PREFERENCES ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      // Inside handleSave in SettingsPage.js
      const res = await fetch(`${API_URL}/user/me`, { 
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email, // Backend will only use this if current email is empty
          pushNotifications: formData.pushNotifications,
          emailAlerts: formData.emailAlerts,
          language: formData.language
        })
      });

      const data = await res.json();
      if (data.success) {
        setToast({ show: true, message: "Settings saved successfully!", type: 'success' });
      } else {
        setToast({ show: true, message: data.message || "Failed to save settings", type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: "A network error occurred.", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // --- CHANGE PASSWORD ---
  const handleChangePasswordSubmit = async () => {
    if (passwords.new !== passwords.confirm) {
      return setToast({ show: true, message: "New passwords do not match", type: 'error' });
    }
    
    setChangingPassword(true);
    setConfirmModal({ isOpen: false, type: null });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          currentPassword: passwords.current, 
          newPassword: passwords.new 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setToast({ show: true, message: "Password updated successfully!", type: 'success' });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setToast({ show: true, message: data.message || "Failed to update password", type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: "Network error occurred", type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  // --- SEND RESET LINK ---
  const handleSendResetLink = async () => {
    setSendingReset(true);
    setConfirmModal({ isOpen: false, type: null });

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      
      if (res.ok) {
        setToast({ show: true, message: `Reset link sent to ${formData.email}`, type: 'success' });
        setResetCooldown(60);
        const timer = setInterval(() => {
          setResetCooldown((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        const data = await res.json();
        setToast({ show: true, message: data.message || "Failed to send link", type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: "Network error occurred", type: 'error' });
    } finally {
      setSendingReset(false);
    }
  };

  // --- PHONE VERIFICATION HANDLER ---
  const onMobileVerified = () => {
    setShowVerifyModal(false);
    setToast({ show: true, message: "Phone number verified and linked successfully!", type: 'success' });
    fetchUserData(); // Refresh to pull the new verified phone number
  };

  // --- SKELETON RENDERER ---
  if (loading) return (
    <div className="page-container settings-page fade-in">
      <Skeleton width="300px" height="40px" style={{ marginBottom: '32px' }} />
      <div className="settings-tabs" style={{ borderBottom: '1px solid var(--border-light)', marginBottom: '32px', display: 'flex', gap: '20px' }}>
        <Skeleton width="100px" height="30px" />
        <Skeleton width="100px" height="30px" />
        <Skeleton width="100px" height="30px" />
      </div>
      <div className="settings-card">
        <div className="profile-grid">
          <div className="avatar-section">
            <Skeleton width="120px" height="120px" circle={true} />
            <Skeleton width="80px" height="15px" style={{ marginTop: '12px' }} />
          </div>
          <div className="form-grid">
            <div className="form-group"><Skeleton width="100px" height="12px" /><Skeleton width="100%" height="45px" borderRadius="8px" /></div>
            <div className="form-group"><Skeleton width="100px" height="12px" /><Skeleton width="100%" height="45px" borderRadius="8px" /></div>
            <div className="form-group full-width"><Skeleton width="100px" height="12px" /><Skeleton width="100%" height="45px" borderRadius="8px" /></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container settings-page fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Account Settings</h1>
      </div>

      <div className="settings-tabs">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>My Profile</button>
        <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>Preferences</button>
        <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>Security</button>
      </div>

      {/* --- PROFILE TAB --- */}
      {activeTab === 'profile' && (
        <div className="settings-card fade-in">
          <h2 className="card-title">Profile Information</h2>
          <div className="profile-grid">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                {!imgError && formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Profile" className="avatar-img" onError={() => setImgError(true)} />
                ) : (
                  <div className="avatar-placeholder">{getInitials(formData.fullName)}</div>
                )}
                <button className="edit-avatar-btn" onClick={() => setToast({show:true, message:"Avatar upload coming soon!", type:'info'})}>
                  <CameraIcon style={{ width: 18 }} />
                </button>
              </div>
              <span className="change-photo-text">Change Photo</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="input-field" />
              </div>
              
              {/* EMAIL: Locked if exists */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="verified-input-wrapper">
                    <input 
                      type="email" 
                      value={formData.email} 
                      readOnly={!!formData.email} // Locked if email exists
                      className="input-field" 
                      style={formData.email ? { background: 'var(--bg-page)', cursor: 'default', opacity: 0.8 } : {}}
                    />
                    {formData.email && <div className="verified-badge"><CheckBadgeIcon style={{ width: 14 }} /> Verified</div>}
                </div>
              </div>

              {/* PHONE: Locked if verified, Button to link if missing */}
              <div className="form-group full-width">
                <label className="form-label">Phone Number</label>
                <div className="verified-input-wrapper" style={{ display: 'flex', gap: '12px' }}>
                  {formData.phone ? (
                    <>
                      <input type="text" value={formData.phone} readOnly className="input-field" style={{ background: 'var(--bg-page)', cursor: 'default', opacity: 0.8, flex: 1 }} />
                      {formData.isPhoneVerified ? (
                        <div className="verified-badge"><CheckBadgeIcon style={{ width: 14 }} /> Verified</div>
                      ) : (
                        <div className="verified-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <ExclamationTriangleIcon style={{ width: 14 }} /> Unverified
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-page)', border: '1px dashed var(--border-light)', borderRadius: '8px', padding: '12px', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>No phone number linked</span>
                      <button 
                        type="button"
                        onClick={() => setShowVerifyModal(true)}
                        style={{ padding: '6px 12px', background: 'var(--brand-gold)', color: '#171717', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Link Phone
                      </button>
                    </div>
                  )}
                </div>
                {formData.phone && <p className="helper-text">Contact support to update your phone number.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PREFERENCES TAB --- */}
      {activeTab === 'preferences' && (
        <div className="settings-card fade-in">
          <h2 className="card-title">Notifications & Language</h2>
          <div className="preferences-list">
            <div className="pref-item">
              <div className="pref-info"><h4>Push Notifications</h4><p>Receive updates about shipment status.</p></div>
              <label className="toggle-switch">
                <input type="checkbox" name="pushNotifications" checked={formData.pushNotifications} onChange={handleToggle} className="toggle-input" />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="pref-item">
              <div className="pref-info"><h4>Email Newsletter</h4><p>Get news, announcements, and product updates.</p></div>
              <label className="toggle-switch">
                <input type="checkbox" name="emailAlerts" checked={formData.emailAlerts} onChange={handleToggle} className="toggle-input" />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="pref-item" style={{ alignItems: 'flex-start', border: 'none', paddingTop: '16px' }}>
              <div className="pref-info" style={{ flex: 1 }}><h4>Language</h4><p>Select your preferred interface language.</p></div>
              <div style={{ width: '250px' }}>
                <Dropdown name="language" value={formData.language} options={languageOptions} onChange={handleDropdown} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SECURITY TAB --- */}
      {activeTab === 'security' && (
        <div className="settings-card fade-in">
          <h2 className="card-title">
            <ShieldCheckIcon width={24} style={{ display: 'inline', color: 'var(--brand-gold)', marginRight: '8px' }}/> 
            Login & Security
          </h2>
          
          <div className="security-section" style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <KeyIcon width={20} style={{ color: 'var(--text-muted)' }} /> Change Password
            </h3>

            <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}><EnvelopeIcon width={16} /> Send Password Reset Link</h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Forgot your current password? We'll send a reset link to <strong>{formData.email}</strong>.</p>
              <button 
                type="button" 
                onClick={() => setConfirmModal({ isOpen: true, type: 'reset' })} 
                disabled={sendingReset || resetCooldown > 0} 
                className="btn-reset-link"
              >
                {sendingReset ? 'Sending...' : resetCooldown > 0 ? `Wait ${resetCooldown}s` : 'Send Reset Link'}
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setConfirmModal({ isOpen: true, type: 'password' }); }} style={{ maxWidth: '500px' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" name="current" value={passwords.current} onChange={handlePasswordChange} className="input-field" required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" name="new" value={passwords.new} onChange={handlePasswordChange} className="input-field" required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} className="input-field" required minLength={6} />
              </div>
              <button type="submit" disabled={changingPassword} className="btn-update-password">
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <hr className="divider" style={{ margin: '32px 0', borderTop: '1px solid var(--border-light)' }} />

          <div className="security-section">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <DevicePhoneMobileIcon width={20} style={{ color: 'var(--text-muted)' }} /> Active Sessions
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px' }}>Review devices currently logged into your account.</p>
            <button onClick={() => router.push('/sender/settings/sessions')} className="btn-view-sessions">
              View Active Sessions <ArrowTopRightOnSquareIcon width={18} />
            </button>
          </div>
        </div>
      )}

      {activeTab !== 'security' && (
        <div className="settings-footer">
          <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      )}

      {/* --- MODALS & NOTIFICATIONS --- */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={confirmModal.type === 'password' ? handleChangePasswordSubmit : handleSendResetLink}
        title={confirmModal.type === 'password' ? "Change Password" : "Reset Password Link"}
        message={confirmModal.type === 'password' ? "Are you sure you want to change your password?" : `Send a secure reset link to ${formData.email}?`}
        isLoading={changingPassword || sendingReset}
      />

      <VerifyMobileModal 
        isOpen={showVerifyModal} 
        onClose={() => setShowVerifyModal(false)} 
        onVerified={onMobileVerified} 
        userId={formData.id} // Pass User ID explicitly
      />

      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
    </div>
  );
}