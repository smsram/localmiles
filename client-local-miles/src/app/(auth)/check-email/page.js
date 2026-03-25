'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnvelopeOpenIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userEmail = searchParams.get('email');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('Click to Resend Email');

  // --- SECURITY: AUTO REDIRECT IF NO EMAIL ---
  useEffect(() => {
    if (!userEmail) {
      router.push('/login');
    }
  }, [userEmail, router]);

  if (!userEmail) return null;

  // Restored the missing function
  const handleOpenMailApp = () => {
    window.location.href = "mailto:";
  };

  const handleResend = async () => {
    setResending(true);
    setResendStatus('Expiring old tokens...');
    
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);

      setResendStatus('New Link Sent!');
      setTimeout(() => setResendStatus('Click to Resend Email'), 5000);
    } catch (error) {
      setResendStatus('Error. Try again.');
      alert(error.message);
    } finally {
      setResending(false);
    }
  };

  // --- INLINE STYLES ---
  const styles = {
    wrapper: { 
      textAlign: 'center', 
      maxWidth: '400px', 
      margin: '0 auto', 
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      justifyContent: 'center'
    },
    iconContainer: { 
      display: 'flex', 
      justifyContent: 'center', 
      marginBottom: '32px' 
    },
    iconRing: { 
      width: '80px', 
      height: '80px', 
      backgroundColor: 'rgba(212, 175, 55, 0.1)', 
      borderRadius: '50%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      position: 'relative' 
    },
    icon: { 
      width: '40px', 
      height: '40px', 
      color: '#D4AF37', 
      zIndex: 2 
    },
    title: { 
      fontSize: '1.75rem', 
      fontWeight: '800', 
      color: '#111', 
      marginBottom: '12px' 
    },
    subtitle: { 
      fontSize: '1rem', 
      color: '#6B7280', 
      marginBottom: '32px', 
      lineHeight: '1.5' 
    },
    emailHighlight: { 
      fontWeight: '700', 
      color: '#111', 
      backgroundColor: '#F3F4F6', 
      padding: '4px 12px', 
      borderRadius: '6px',
      border: '1px solid #E5E7EB',
      display: 'inline-block',
      marginTop: '8px'
    },
    buttonContainer: { 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      marginBottom: '32px',
      width: '100%' 
    },
    btnPrimary: { 
      backgroundColor: '#111', 
      color: 'white', 
      padding: '14px', 
      borderRadius: '12px', 
      fontWeight: '600', 
      border: 'none', 
      cursor: 'pointer', 
      width: '100%', 
      fontSize: '0.95rem' 
    },
    btnSecondary: { 
      backgroundColor: 'transparent', 
      color: '#111', 
      padding: '14px', 
      borderRadius: '12px', 
      fontWeight: '600', 
      border: '1px solid #E5E7EB', 
      cursor: resending ? 'not-allowed' : 'pointer', 
      width: '100%', 
      fontSize: '0.95rem', 
      opacity: resending ? 0.6 : 1, 
      transition: 'background 0.2s' 
    },
    footer: { 
      display: 'flex', 
      justifyContent: 'center', 
      marginBottom: '24px' 
    },
    backLink: { 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '8px', 
      color: '#6B7280', 
      textDecoration: 'none', 
      fontSize: '0.9rem', 
      fontWeight: '500' 
    },
    helpText: { 
      fontSize: '0.85rem', 
      color: '#9CA3AF', 
      lineHeight: '1.5', 
      marginTop: '32px' 
    }
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes pulse-ring { 
          0% { transform: scale(1); opacity: 0.5; } 
          100% { transform: scale(1.5); opacity: 0; } 
        }
        .pulse-ring::after { 
          content: ''; 
          position: absolute; 
          width: 100%; 
          height: 100%; 
          border-radius: 50%; 
          border: 1px solid rgba(212, 175, 55, 0.3); 
          animation: pulse-ring 2s infinite; 
        }
        .btn-hover-effect:hover { opacity: 0.9; }
        .btn-sec-hover:hover { background-color: #F9FAFB; border-color: #D1D5DB; }
      `}</style>

      {/* 1. Header Icon */}
      <div style={styles.iconContainer}>
        <div style={styles.iconRing} className="pulse-ring">
          <EnvelopeOpenIcon style={styles.icon} />
        </div>
      </div>

      {/* 2. Title & Description */}
      <h1 style={styles.title}>Check your inbox</h1>
      <p style={styles.subtitle}>
        We've sent a verification link to: <br />
        <span style={styles.emailHighlight}>{userEmail}</span>
      </p>

      {/* 3. Main Actions */}
      <div style={styles.buttonContainer}>
        <button style={styles.btnPrimary} className="btn-hover-effect" onClick={handleOpenMailApp}>
          Open Email App
        </button>
        <button style={styles.btnSecondary} className="btn-sec-hover" onClick={handleResend} disabled={resending}>
          {resendStatus}
        </button>
      </div>

      {/* 4. Footer Navigation */}
      <div style={styles.footer}>
        <Link href="/login" style={styles.backLink}>
          <ArrowLeftIcon width={16} /> Back to Login
        </Link>
      </div>

      {/* 5. Help Text */}
      <p style={styles.helpText}>
        Did not receive the email? Check your spam filter,<br /> or try resending the email.
      </p>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div style={{textAlign:'center', padding:50}}>Loading...</div>}>
      <CheckEmailContent />
    </Suspense>
  );
}