'use client';
import { useState, useRef, useEffect } from 'react';
import { PhoneIcon, ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import '@/styles/VerifyModal.css';

export default function VerifyMobilePage() {
  const [step, setStep] = useState('PHONE'); // 'PHONE' or 'OTP'
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(''); 
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  // --- HANDLERS ---

  const handleTruecaller = () => {
    if (!phone || phone.length < 10) return alert("Please enter a valid mobile number");
    setLoadingType('truecaller');
    setIsLoading(true);
    setTimeout(() => {
      alert("Opening Truecaller App...");
      setIsLoading(false);
    }, 1500);
  };

  const handleWhatsApp = () => {
    if (!phone || phone.length < 10) return alert("Please enter a valid mobile number");
    setLoadingType('whatsapp');
    setIsLoading(true);

    // Simulate sending OTP via WhatsApp
    setTimeout(() => {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000); // 6 Digit OTP
      const message = `Your Local Miles verification code is ${generatedOtp}. Please do not share this with anyone.`;
      const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      
      // Switch to OTP Screen
      setIsLoading(false);
      setStep('OTP');
    }, 2000);
  };

  // OTP Input Logic
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
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

  const verifyOtp = () => {
    alert(`Verifying Code: ${otp.join('')}`);
    // Add your API verification logic here
  };

  const goBack = () => {
    setStep('PHONE');
    setOtp(new Array(6).fill(""));
  };

  return (
    <div className="modal-page-container">
      <div className="verification-card">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <div className="loading-text">
              {loadingType === 'whatsapp' ? 'Sending code via WhatsApp...' : 'Verifying with Truecaller...'}
            </div>
          </div>
        )}

        {/* --- STEP 1: PHONE INPUT --- */}
        {step === 'PHONE' && (
          <>
            {/* Header Icon */}
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

            {/* Phone Input */}
            <div className="phone-input-group">
              <span className="country-code">+91</span>
              <input 
                type="tel" 
                className="phone-field" 
                placeholder="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>

            {/* Buttons */}
            <button className="btn-verify btn-truecaller" onClick={handleTruecaller}>
              <PhoneIcon style={{ width: 20 }} /> 1-Tap Verify via Truecaller
            </button>

            <button className="btn-verify btn-whatsapp" onClick={handleWhatsApp}>
              <ChatBubbleLeftRightIcon style={{ width: 22 }} /> Verify via WhatsApp
            </button>

            <p className="disclaimer">
              You will receive an OTP via WhatsApp for instant verification.
            </p>
          </>
        )}

        {/* --- STEP 2: OTP ENTRY --- */}
        {step === 'OTP' && (
          <div className="otp-step-container">
            <button className="btn-back-icon" onClick={goBack}>
              <ArrowLeftIcon width={20} />
            </button>

            <h1 className="modal-title">Enter Verification Code</h1>
            <p className="modal-desc">
              We've sent a 6-digit code to your WhatsApp number <br/>
              <strong>+91 {phone}</strong>
            </p>

            <div className="otp-input-group">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="otp-digit"
                  value={data}
                  ref={el => inputRefs.current[index] = el}
                  onChange={e => handleOtpChange(e.target, index)}
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
              Didn't receive code? <button className="btn-resend-text">Resend via SMS</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}