'use client';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import '@/styles/VerifyModal.css'; // Reusing your existing working modal CSS

export default function EmailUnverifiedModal({ isOpen, onClose, onResend, email }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="verification-card" style={{ maxWidth: '450px' }}>
        
        {/* Close Button */}
        <button className="btn-close-modal" onClick={onClose}>
          <XMarkIcon width={24} />
        </button>

        <div style={{ textAlign: 'center', padding: '10px' }}>
          {/* Warning Icon */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '20px' 
          }}>
            <div style={{
              backgroundColor: '#FEF9C3',
              borderRadius: '50%',
              padding: '15px'
            }}>
              <ExclamationTriangleIcon style={{ width: 40, color: '#CA8A04' }} />
            </div>
          </div>

          <h1 className="modal-title" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
            Verify Your Email
          </h1>
          
          <p className="modal-desc" style={{ marginBottom: '20px' }}>
            We noticed that <strong>{email}</strong> hasn't been verified yet. 
            Please check your inbox for the link.
          </p>

          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '25px',
            fontSize: '0.85rem',
            color: '#991B1B',
            textAlign: 'left'
          }}>
            <strong>Note:</strong> Requesting a new link will automatically expire the previous verification email sent to you.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn-verify btn-primary-black" 
              onClick={onResend}
              style={{ backgroundColor: '#000', color: '#fff' }}
            >
              Resend Verification Email
            </button>
            
            <button 
              className="btn-resend-text" 
              onClick={onClose}
              style={{ fontWeight: 600, color: '#666' }}
            >
              I'll do it later
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}