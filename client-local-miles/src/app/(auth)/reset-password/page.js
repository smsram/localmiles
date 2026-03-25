'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowLeftIcon 
} from '@heroicons/react/24/solid';

// --- MAIN PAGE COMPONENT ---
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

// --- LOADING SPINNER ---
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner"></div>
      <style jsx>{`
        .spinner {
          width: 40px; height: 40px; 
          border: 4px solid #E5E7EB; 
          border-top: 4px solid #D4AF37; 
          border-radius: 50%; 
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// --- CONTENT COMPONENT ---
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const [status, setStatus] = useState('validating'); // 'validating', 'valid', 'invalid', 'success'
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. VALIDATE TOKEN ON MOUNT
  useEffect(() => {
    if (!token) {
      router.push('/forgot-password');
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/validate-reset-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        const data = await res.json();
        
        if (res.ok && data.valid) {
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      } catch (error) {
        setStatus('invalid');
      }
    };

    validateToken();
  }, [token, router, API_URL]);

  // 2. HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      setStatus('success');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="login-wrapper">
      <AnimatePresence mode="wait">
        
        {/* STATE: VALIDATING */}
        {status === 'validating' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <LoadingSpinner />
             <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6B7280' }}>Verifying security token...</p>
          </motion.div>
        )}

        {/* STATE: INVALID TOKEN */}
        {status === 'invalid' && (
          <motion.div 
            key="invalid"
            variants={slideVariants}
            initial="hidden" animate="visible" exit="exit"
            style={{ textAlign: 'center', padding: '20px' }}
          >
            <div style={{ margin: '0 auto 20px', width: '60px', height: '60px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircleIcon width={32} color="#EF4444" />
            </div>
            <h1 className="auth-title">Link Expired</h1>
            <p className="auth-subtitle">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link href="/forgot-password" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Request New Link
            </Link>
          </motion.div>
        )}

        {/* STATE: VALID FORM */}
        {status === 'valid' && (
          <motion.div
            key="form"
            variants={slideVariants}
            initial="hidden" animate="visible" exit="exit"
          >
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">
              Please choose a new, secure password for your account.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              
              {/* Password Field */}
              <div className="form-group">
                <label>New Password</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <input 
                    type={showPass ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    style={{ width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                  >
                    {showPass ? <EyeSlashIcon width={20} /> : <EyeIcon width={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Confirm Password</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <input 
                    type={showConfirmPass ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                    style={{ width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                  >
                    {showConfirmPass ? <EyeSlashIcon width={20} /> : <EyeIcon width={20} />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '10px' }}>
                  {errorMsg}
                </p>
              )}

              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '24px' }}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6B7280', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                <ArrowLeftIcon width={16} /> Back to Sign In
              </Link>
            </div>
          </motion.div>
        )}

        {/* STATE: SUCCESS */}
        {status === 'success' && (
          <motion.div
            key="success"
            variants={slideVariants}
            initial="hidden" animate="visible" exit="exit"
            style={{ textAlign: 'center' }}
          >
            <div style={{ margin: '0 auto 24px', width: '80px', height: '80px', borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon width={48} color="#10B981" />
            </div>
            
            <h1 className="auth-title">Password Reset!</h1>
            <p className="auth-subtitle">
              Your password has been successfully updated. You can now use your new password to sign in.
            </p>

            <Link href="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '24px' }}>
              Sign In Now
            </Link>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}