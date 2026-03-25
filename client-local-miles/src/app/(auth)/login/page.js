'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Components
import VerifyMobileModal from '@/components/auth/VerifyMobileModal';
import EmailUnverifiedModal from '@/components/auth/EmailUnverifiedModal';
import ToastNotification from '@/components/ui/ToastNotification'; // <-- Imported Toast

// FIREBASE IMPORTS
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase"; 

// STRICT ENV URL - No localhost fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();
  
  // Default to Login (true), but allow switching
  const [isLogin, setIsLogin] = useState(true); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Unified Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modal States
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });

  // ---------------------------------------------
  // 1. HANDLE URL HASH (#signup)
  // ---------------------------------------------
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#signup') {
          setIsLogin(false);
        } else if (window.location.hash === '#signin') {
          setIsLogin(true);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ---------------------------------------------
  // HELPER: Smart Redirect System
  // ---------------------------------------------
  const redirectUser = (user) => {
    if (!user) return;

    if (!user.primaryGoal) {
      setTimeout(() => router.push('/role-selection'), 1000);
      return;
    }

    if (user.primaryGoal === 'SENDER') {
      setTimeout(() => router.push('/sender'), 1000);
      return;
    }

    if (user.primaryGoal === 'COURIER') {
      setTimeout(() => router.push('/courier'), 1000);
      return;
    }

    if (user.primaryGoal === 'BOTH') {
      if (user.lastActiveMode === 'COURIER') {
        setTimeout(() => router.push('/courier'), 1000);
      } else {
        setTimeout(() => router.push('/sender'), 1000);
      }
    }
  };

  // ---------------------------------------------
  // MODAL HANDLERS
  // ---------------------------------------------

  const handleVerificationSuccess = () => {
    setShowVerifyModal(false);
    setToast({ show: true, message: 'Phone verified! Continuing...', type: 'success' });
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      redirectUser(JSON.parse(storedUser));
    } else {
      router.push('/role-selection');
    }
  };

  const handleModalClose = () => {
    setShowVerifyModal(false);
    setToast({ show: true, message: 'Verification skipped for now. Redirecting...', type: 'success' });
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      redirectUser(user);
    } else {
      router.push('/role-selection'); 
    }
  };

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!res.ok) throw new Error("Failed to resend email");

      setShowEmailModal(false);
      router.push(`/check-email?email=${encodeURIComponent(formData.email)}`);

    } catch (err) {
      setToast({ show: true, message: err.message || "Failed to resend verification.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // CORE AUTH RESPONSE HANDLER
  // ---------------------------------------------
  const handleAuthResponse = (data) => {
    // 1. CHECK IF EMAIL VERIFICATION IS REQUIRED (Standard Signup)
    if (data.requireEmailVerification) {
      router.push(`/check-email?email=${encodeURIComponent(data.email)}`);
      return;
    }

    // 2. HANDLE SUCCESSFUL LOGIN (Save Session Data)
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    // 3. CHECK MOBILE VERIFICATION
    const isVerified = data.user?.isPhoneVerified;

    if (isVerified) {
      setToast({ show: true, message: 'Success! Redirecting...', type: 'success' });
      redirectUser(data.user);
    } else {
      setToast({ show: true, message: 'Account access granted. Please verify your mobile number.', type: 'success' });
      setShowVerifyModal(true);
    }
  };

  // ---------------------------------------------
  // 2. HANDLE GOOGLE LOGIN
  // ---------------------------------------------
  const handleGoogleLogin = async () => {
    setToast({ show: false, message: '', type: 'success' });
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token, 
          email: user.email,
          name: user.displayName,
          photo: user.photoURL
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google login failed');

      handleAuthResponse(data);

    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        console.log("Google Auth Cancelled by User");
      } else {
        console.error(err);
        setToast({ show: true, message: err.message || "Google login failed.", type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // 3. HANDLE EMAIL SUBMIT
  // ---------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ show: false, message: '', type: 'success' }); 
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const url = `${API_URL}${endpoint}`;
      const payload = isLogin ? { email: formData.email, password: formData.password } : formData;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // --- THE FIX: Specific 403 Handling ---
      if (res.status === 403) {
        setLoading(false);
        // Only show modal if the backend confirmed it's an email verification issue
        if (data.requireEmailVerification) {
          setShowEmailModal(true);
        } else {
          setToast({ show: true, message: data.message || "Access Forbidden", type: 'error' });
        }
        return; // Stop execution here
      }

      if (!res.ok) throw new Error(data.message || 'Something went wrong');

      handleAuthResponse(data);

    } catch (err) {
      setToast({ show: true, message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- STYLES FOR TABS ---
  const tabBaseStyle = {
    flex: 1,
    padding: '12px',
    fontWeight: '600',
    background: 'none',
    cursor: 'pointer',
    marginBottom: '-2px',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    transition: 'all 0.2s ease-out'
  };

  const activeTabStyle = {
    ...tabBaseStyle,
    color: 'var(--text-main)',
    borderBottom: '2px solid var(--brand-gold)',
  };

  const inactiveTabStyle = {
    ...tabBaseStyle,
    color: 'var(--text-muted)',
    borderBottom: '2px solid transparent',
  };

  return (
    <>
      <div className="login-wrapper fade-in">
        
        {/* --- TAB SWITCHER --- */}
        <div className="auth-tabs" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '1.5rem', 
          borderBottom: '2px solid var(--border-light)' 
        }}>
          <button 
            type="button"
            onClick={() => { 
              setIsLogin(true); 
              setToast({ show: false, message: '', type: 'success' }); 
              window.location.hash = 'signin'; 
            }}
            style={isLogin ? activeTabStyle : inactiveTabStyle}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { 
              setIsLogin(false); 
              setToast({ show: false, message: '', type: 'success' }); 
              window.location.hash = 'signup'; 
            }}
            style={!isLogin ? activeTabStyle : inactiveTabStyle}
          >
            Sign Up
          </button>
        </div>

        <h1 className="auth-title">{isLogin ? 'Welcome Back' : 'Join Local Miles'}</h1>
        <p className="auth-subtitle">
          {isLogin ? 'Enter your details to access your account.' : 'Start sending or delivering today.'}
        </p>

        {/* GOOGLE BUTTON */}
        <button 
          className="btn-google" 
          type="button" 
          onClick={handleGoogleLogin} 
          disabled={loading}
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google" 
            width={20} 
            height={20} 
          />
          <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <div className="divider">
          <span>OR CONTINUE WITH EMAIL</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>Password</label>
              {isLogin && (
                <Link href="/forgot-password" className="forgot-link">Forgot Password?</Link>
              )}
            </div>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <button 
                type="button" 
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlashIcon width={20} /> : <EyeIcon width={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="checkbox-group">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">
                By creating an account, you agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
              </label>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
            <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>
                {isLogin ? "New to Local Miles? " : "Already have an account? "}
                <button 
                    onClick={() => { 
                      const newState = !isLogin;
                      setIsLogin(newState); 
                      setToast({ show: false, message: '', type: 'success' });
                      window.location.hash = newState ? 'signin' : 'signup';
                    }} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {isLogin ? 'Create Account' : 'Sign In here'}
                </button>
            </p>
        </div>
      </div>

      {/* --- MODALS & NOTIFICATIONS --- */}
      
      <VerifyMobileModal 
        isOpen={showVerifyModal}
        onClose={handleModalClose} 
        onVerified={handleVerificationSuccess}
      />

      <EmailUnverifiedModal 
        isOpen={showEmailModal}
        email={formData.email}
        onClose={() => setShowEmailModal(false)}
        onResend={handleResendEmail}
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