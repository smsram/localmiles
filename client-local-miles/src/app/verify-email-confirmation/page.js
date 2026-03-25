'use client';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import '@/styles/EmailConfirmation.css'; // Reusing your previous css logic or similar

export default function EmailConfirmationPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F9FAFB', // Light gray bg
      padding: '20px'
    }}>
      
      <div style={{
        background: 'white',
        width: '100%',
        maxWidth: '480px',
        borderRadius: '24px',
        padding: '48px 32px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
      }}>
        
        {/* Email Graphic */}
        <div style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          background: '#FEFCE8', /* Light Yellow/Gold tint */
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <EnvelopeIcon style={{ width: 40, color: '#4B382A' }} /> {/* Dark Brown Icon */}
          <div style={{
            position: 'absolute',
            top: 0, right: 0,
            background: '#D4AF37', /* Gold */
            borderRadius: '50%',
            padding: '4px',
            border: '2px solid white'
          }}>
            <CheckCircleIcon style={{ width: 16, color: 'white' }} />
          </div>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F2937', marginBottom: '12px' }}>
          Check your Inbox
        </h1>
        
        <p style={{ color: '#6B7280', marginBottom: '24px', lineHeight: '1.5' }}>
          We have sent a verification link to the email address you provided:<br/>
          <strong style={{ color: '#1F2937' }}>arjun@example.com</strong>
        </p>

        {/* Action Box */}
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '0.9rem',
          color: '#374151'
        }}>
          Click the link in the email to verify your account and continue.
        </div>

        {/* Resend */}
        <div style={{ marginBottom: '32px', fontSize: '0.9rem', color: '#D4AF37', fontWeight: 700, cursor: 'pointer' }}>
          ↻ Resend in 30s
        </div>

        {/* Back Link */}
        <Link href="/login" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#9CA3AF',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          <ArrowLeftIcon style={{ width: 16 }} /> Entered the wrong email? Go Back
        </Link>

      </div>
    </div>
  );
}