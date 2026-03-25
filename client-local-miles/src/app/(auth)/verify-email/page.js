'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // States: 'loading', 'success', 'error'
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    // --- SECURITY: AUTO REDIRECT IF NO TOKEN ---
    if (!token) {
      router.push('/login');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Token expired or invalid.');
        }
        
        setStatus('success');
        
        // AUTO REDIRECT TO LOGIN AFTER 2.5 SECONDS
        setTimeout(() => {
            router.push('/login');
        }, 2500);

      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Your verification link has expired or is invalid.');
      }
    };

    verifyToken();
  }, [token, API_URL, router]);

  // If no token (and before redirect completes), show nothing or loader
  if (!token) return <div style={{textAlign:'center', marginTop: 50}}>Redirecting...</div>;

  // --- INLINE STYLES ---
  const styles = {
    container: { 
      maxWidth: '480px', 
      margin: '0 auto', 
      textAlign: 'center', 
      padding: '40px 24px', 
      backgroundColor: 'white', 
      borderRadius: '24px',
      marginTop: '60px'
    },
    iconWrapper: { 
      marginBottom: '24px', 
      display: 'flex', 
      justifyContent: 'center' 
    },
    title: { 
      fontSize: '1.75rem', 
      fontWeight: '800', 
      color: '#111', 
      marginBottom: '12px' 
    },
    desc: { 
      fontSize: '1rem', 
      color: '#6B7280', 
      lineHeight: '1.6', 
      marginBottom: '32px' 
    },
    btnPrimary: { 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '8px', 
      width: '100%', 
      padding: '16px', 
      backgroundColor: '#111', 
      color: 'white', 
      borderRadius: '12px', 
      fontWeight: '700', 
      textDecoration: 'none', 
      fontSize: '1rem', 
      border: 'none', 
      cursor: 'pointer', 
      transition: 'opacity 0.2s' 
    }
  };

  // --- RENDER: LOADING ---
  if (status === 'loading') {
    return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          {/* Simple CSS Spinner */}
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: '#666' }}>Verifying your email...</p>
          <style>{`
            .spinner { 
              width: 40px; 
              height: 40px; 
              border: 4px solid #E5E7EB; 
              border-top: 4px solid #D4AF37; 
              border-radius: 50%; 
              animation: spin 1s linear infinite; 
              margin: 0 auto; 
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
    );
  }

  // --- RENDER: SUCCESS ---
  if (status === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.iconWrapper}>
          <CheckCircleIcon width={80} color="#10B981" />
        </div>
        <h1 style={styles.title}>Email Verified!</h1>
        <p style={styles.desc}>
          Thank you for verifying your email. Your account is active. <br/>
          <strong>Redirecting to login...</strong>
        </p>
        <Link href="/login" style={styles.btnPrimary}>
          Go to Login Now <ArrowRightIcon width={18} />
        </Link>
      </div>
    );
  }

  // --- RENDER: ERROR ---
  return (
    <div style={styles.container}>
      <div style={styles.iconWrapper}>
        <XCircleIcon width={80} color="#EF4444" />
      </div>
      <h1 style={styles.title}>Verification Failed</h1>
      <p style={styles.desc}>
        {message} <br />
        It looks like the link is broken or has already been used.
      </p>
      
      {/* Only option is to go back to Login, removed resend button */}
      <Link href="/login" style={styles.btnPrimary}>
        Back to Login
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{textAlign:'center', padding:50}}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}