'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  EnvelopeIcon, 
  CheckIcon,
  ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/solid';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send email');

      setIsSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    // Re-trigger submit logic for resend
    handleSubmit({ preventDefault: () => {} });
  };

  // Animation variants
  const slideVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="login-wrapper">
      <AnimatePresence mode="wait">
        
        {!isSubmitted ? (
          /* --- STATE 1: INPUT FORM --- */
          <motion.div
            key="form"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h1 className="auth-title">Forgot Password?</h1>
            <p className="auth-subtitle">
              Enter your email address to receive a password reset link.
            </p>

            {error && <p style={{color: 'red', textAlign:'center', marginBottom: '1rem'}}>{error}</p>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="back-link-wrapper">
              <Link href="/login" className="link-back">
                <ArrowLeftIcon width={16} />
                Back to Sign In
              </Link>
            </div>
          </motion.div>

        ) : (

          /* --- STATE 2: CHECK EMAIL SUCCESS --- */
          <motion.div
            key="success"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="success-view"
          >
            {/* Icon Group */}
            <div className="icon-success-wrapper">
              <EnvelopeIcon width={40} color="#2B241D" />
              <div className="icon-badge">
                <CheckIcon width={14} strokeWidth={4} />
              </div>
            </div>

            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle" style={{ textAlign: 'center', maxWidth: '350px' }}>
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions.
            </p>

            {/* Open App Button */}
            <a href="mailto:" className="btn-gold-outline">
              <ArrowTopRightOnSquareIcon width={20} />
              Open Email App
            </a>

            <div className="resend-row">
              Didn't receive the email? 
              <button onClick={handleResend} className="btn-resend" disabled={loading}>
                {loading ? 'Sending...' : 'Resend'}
              </button>
            </div>

            <div className="back-link-wrapper" style={{ marginTop: '32px' }}>
              <Link href="/login" className="link-back">
                <ArrowLeftIcon width={16} />
                Back to Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}