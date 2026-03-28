'use client';
import { useState, useRef, useEffect } from 'react';
import { PhoneIcon, ShieldCheckIcon, ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import '@/styles/VerifyModal.css';

export default function VerifyMobileModal({ isOpen, onClose, onVerified }) {
  const [step, setStep] = useState('PHONE'); 
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (isOpen) {
      setStep('PHONE');
      setPhone('');
      setOtp(new Array(6).fill(""));
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- 1. REQUEST OTP ---
  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) return setErrorMsg("Please enter a valid 10-digit mobile number");
    setErrorMsg('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Authentication session expired. Please login again.");

      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setStep('OTP');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. TRUECALLER VERIFICATION (Simulated) ---
  const handleTruecaller = async () => {
    if (!phone || phone.length < 10) return setErrorMsg("Enter your number first to use Truecaller");
    setIsLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('token');
      // In production, Truecaller SDK provides a payload. Here we simulate it.
      const simulatedPayload = "truecaller_verified_signature"; 

      const res = await fetch(`${API_URL}/auth/verify-truecaller`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone, payload: simulatedPayload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Truecaller Verification Failed");

      if (onVerified) onVerified();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP INPUT HANDLERS ---
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // --- 3. SUBMIT OTP ---
  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return setErrorMsg("Please enter the complete 6-digit code");
    
    setErrorMsg('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid Code");

      if (onVerified) onVerified(); 
    } catch (err) {
      setErrorMsg(err.message || "Verification Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="verification-card fade-in">
        
        <button className="btn-close-modal" onClick={onClose} aria-label="Close">
          <XMarkIcon width={24} />
        </button>

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <div className="loading-text">
              {step === 'PHONE' ? 'Processing...' : 'Verifying Code...'}
            </div>
          </div>
        )}

        {/* --- STEP 1: PHONE --- */}
        {step === 'PHONE' && (
          <div className="step-fade-in">
            <div className="shield-icon-wrapper">
              <div className="phone-outline">
                <div className="phone-notch"></div>
              </div>
              <div className="secure-badge">
                <ShieldCheckIcon style={{ width: 24, color: '#10B981' }} />
              </div>
            </div>

            <h1 className="modal-title">Secure Your Account</h1>
            <p className="modal-desc">
              To ensure trust and security for all deliveries, we need to verify your Indian mobile number.
            </p>

            {errorMsg && (
              <div className="error-message" style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ExclamationCircleIcon width={16} /> <span>{errorMsg}</span>
              </div>
            )}

            <div className={`phone-input-group ${errorMsg ? 'has-error' : ''}`}>
              <span className="country-code">+91</span>
              <input 
                type="tel" 
                className="phone-field" 
                placeholder="Mobile Number"
                value={phone}
                onChange={(e) => {
                  setErrorMsg('');
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                }}
              />
            </div>

            <button className="btn-verify btn-whatsapp" onClick={handleSendOtp}>
              <ChatBubbleLeftRightIcon style={{ width: 22 }} /> Get OTP (Secure)
            </button>

            <button className="btn-verify btn-truecaller" onClick={handleTruecaller} style={{ marginTop: '12px', background: '#0056D2', color: 'white', border: 'none' }}>
              <PhoneIcon style={{ width: 20 }} /> 1-Tap Verify via Truecaller
            </button>

            <p className="disclaimer">
              For testing purposes, the OTP will be printed in your backend console.
            </p>
          </div>
        )}

        {/* --- STEP 2: OTP --- */}
        {step === 'OTP' && (
          <div className="step-fade-in">
            <button className="btn-back-icon" onClick={() => { setStep('PHONE'); setErrorMsg(''); }}>
              <ArrowLeftIcon width={20} />
            </button>

            <h1 className="modal-title">Enter Verification Code</h1>
            <p className="modal-desc">
              We've generated a secure 6-digit code for your number <br/>
              <strong className="bold-text">+91 {phone}</strong>
            </p>

            {errorMsg && (
              <div className="error-message" style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ExclamationCircleIcon width={16} /> <span>{errorMsg}</span>
              </div>
            )}

            <div className="otp-input-group">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className={`otp-digit ${errorMsg ? 'has-error' : ''}`}
                  value={data}
                  ref={el => inputRefs.current[index] = el}
                  onChange={e => {
                    setErrorMsg('');
                    handleOtpChange(e.target, index);
                  }}
                  onKeyDown={e => handleKeyDown(e, index)}
                  onFocus={e => e.target.select()}
                />
              ))}
            </div>

            <button 
              className="btn-verify btn-primary-black" 
              onClick={verifyOtp}
              disabled={otp.some(digit => digit === "")}
            >
              Verify & Proceed
            </button>

            <div className="resend-timer">
              Didn't receive code? <button className="btn-resend-text" onClick={() => { setStep('PHONE'); setErrorMsg(''); }}>Resend</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}