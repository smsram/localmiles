'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CameraIcon, 
  CheckBadgeIcon, 
  ShieldCheckIcon, 
  DevicePhoneMobileIcon, 
  KeyIcon,
  EnvelopeIcon
} from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Dropdown from '@/components/ui/Dropdown';
import ToastNotification from '@/components/ui/ToastNotification'; 
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
  const [sendingReset, setSendingReset] = useState(false); // For Forgot Password link

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [resetCooldown, setResetCooldown] = useState(0);

  const [formData, setFormData] = useState({
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
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/auth/login');

        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          const user = data.data;
          setFormData(prev => ({
            ...prev,
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
        setLoading(false);
      }
    };

    fetchUserData();
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
      const res = await fetch(`${API_URL}/user/me`, { 
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
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

  // --- CHANGE PASSWORD (Manual) ---
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return setToast({ show: true, message: "New passwords do not match", type: 'error' });
    }
    
    setChangingPassword(true);
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

  // --- SEND RESET LINK (Forgot Password) ---
  const handleSendResetLink = async () => {
    if (!formData.email) return setToast({ show: true, message: "Email not found.", type: 'error' });
    
    // Check if cooldown is active
    if (resetCooldown > 0) return;
    
    setSendingReset(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setToast({ show: true, message: `Password reset link sent to ${formData.email}`, type: 'success' });
        
        // Start 60s cooldown timer
        setResetCooldown(60);
        const timer = setInterval(() => {
          setResetCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else {
        setToast({ show: true, message: data.message || "Failed to send link", type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: "Network error occurred", type: 'error' });
    } finally {
      setSendingReset(false);
    }
  };

  if (loading) return (
    <div className="page-container settings-page" style={{display: 'flex', justifyContent: 'center', paddingTop: '100px'}}>
       <div className="spinner" style={{width: 40, height: 40, border: '3px solid var(--border-light)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
    </div>
  );

  return (
    <div className="page-container settings-page">
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Account Settings</h1>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          My Profile
        </button>
        <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
          Preferences
        </button>
        <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
          Security
        </button>
      </div>

      {/* --- PROFILE TAB --- */}
      {activeTab === 'profile' && (
        <div className="settings-card fade-in">
          <h2 className="card-title">Profile Information</h2>
          
          <div className="profile-grid">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                {!imgError && formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt="Profile" 
                    className="avatar-img"
                    onError={() => setImgError(true)} 
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {getInitials(formData.fullName)}
                  </div>
                )}
                
                <button className="edit-avatar-btn" onClick={() => alert("Avatar upload coming soon!")}>
                  <CameraIcon style={{ width: 18 }} />
                </button>
              </div>
              <span className="change-photo-text">Change Photo</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="input-field" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field" 
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Phone Number</label>
                <div className="verified-input-wrapper">
                  <input 
                    type="text" 
                    value={formData.phone} 
                    readOnly 
                    className="input-field" 
                    style={{ background: 'var(--bg-page)', cursor: 'default', opacity: 0.8 }}
                  />
                  {formData.isPhoneVerified && (
                    <div className="verified-badge">
                      <CheckBadgeIcon style={{ width: 14 }} /> Verified
                    </div>
                  )}
                </div>
                <p className="helper-text">To update your phone number, please contact support.</p>
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
              <div className="pref-info">
                <h4 style={{ color: 'var(--text-main)' }}>Push Notifications</h4>
                <p>Receive updates about your shipment status.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="pushNotifications" checked={formData.pushNotifications} onChange={handleToggle} className="toggle-input" />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="pref-item">
              <div className="pref-info">
                <h4 style={{ color: 'var(--text-main)' }}>Email Newsletter</h4>
                <p>Get news, announcements, and product updates.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="emailAlerts" checked={formData.emailAlerts} onChange={handleToggle} className="toggle-input" />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="pref-item" style={{ alignItems: 'flex-start', border: 'none', paddingTop: '16px' }}>
              <div className="pref-info" style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--text-main)' }}>Language</h4>
                <p>Select your preferred language for the interface.</p>
              </div>
              <div style={{ width: '250px' }}>
                <Dropdown 
                  label=""
                  name="language"
                  value={formData.language}
                  options={languageOptions}
                  onChange={handleDropdown}
                />
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
          
          {/* Change Password Section */}
          <div className="security-section" style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <KeyIcon width={20} style={{ color: 'var(--text-muted)' }} /> Change Password
            </h3>

            {/* Forgot Password Box */}
            <div style={{ 
              marginBottom: '24px', padding: '16px', borderRadius: '12px', 
              background: 'var(--bg-page)', border: '1px solid var(--border-light)' 
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <EnvelopeIcon width={16} /> Send Password Reset Link
              </h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Can't remember your current password? We'll send a secure reset link to <strong>{formData.email}</strong>.
              </p>
              <button 
                type="button"
                onClick={handleSendResetLink}
                disabled={sendingReset || resetCooldown > 0}
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  background: resetCooldown > 0 ? 'var(--border-light)' : 'var(--brand-gold)', 
                  color: resetCooldown > 0 ? 'var(--text-muted)' : '#171717', 
                  border: 'none', 
                  fontWeight: 700, 
                  cursor: (sendingReset || resetCooldown > 0) ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!sendingReset && resetCooldown === 0) e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  if (!sendingReset && resetCooldown === 0) e.currentTarget.style.opacity = '1';
                }}
              >
                {sendingReset ? (
                  'Sending...'
                ) : resetCooldown > 0 ? (
                  <>Wait {resetCooldown}s</>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
            
            <form onSubmit={handleChangePasswordSubmit} style={{ maxWidth: '500px' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" name="current" 
                  value={passwords.current} onChange={handlePasswordChange} 
                  className="input-field" required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" name="new" 
                  value={passwords.new} onChange={handlePasswordChange} 
                  className="input-field" required minLength={6} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" name="confirm" 
                  value={passwords.confirm} onChange={handlePasswordChange} 
                  className="input-field" required minLength={6} 
                />
              </div>
              <button 
                type="submit" 
                disabled={changingPassword}
                style={{
                  padding: '12px 24px', background: 'var(--bg-page)', border: '1px solid var(--border-light)', 
                  borderRadius: '8px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !changingPassword && (e.currentTarget.style.borderColor = 'var(--text-main)')}
                onMouseLeave={(e) => !changingPassword && (e.currentTarget.style.borderColor = 'var(--border-light)')}
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <hr className="divider" style={{ margin: '32px 0', borderTop: '1px solid var(--border-light)' }} />

          {/* Manage Sessions Section */}
          <div className="security-section">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <DevicePhoneMobileIcon width={20} style={{ color: 'var(--text-muted)' }} /> Active Sessions
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.5' }}>
              Review the devices currently logged into your account. If you see unfamiliar activity, you can log out of all other sessions securely.
            </p>
            <button 
              onClick={() => router.push('/sender/settings/sessions')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', 
                background: 'var(--brand-gold)', border: 'none', borderRadius: '8px', 
                color: '#171717', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              View Active Sessions <ArrowTopRightOnSquareIcon width={18} strokeWidth={2.5}/>
            </button>
          </div>

        </div>
      )}

      {/* Footer Action - Hidden on Security Tab since it has its own dedicated buttons */}
      {activeTab !== 'security' && (
        <div className="settings-footer">
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Render Toast */}
      <ToastNotification 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

    </div>
  );
}