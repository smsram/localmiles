'use client';
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  FingerPrintIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CameraIcon,
  PencilSquareIcon,
  TruckIcon 
} from '@heroicons/react/24/outline';
import { 
  StarIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

// Updated import path as requested
import '@/styles/CourierProfilePage.css';

// Mock Data
const userData = {
  name: 'Arjun Patel',
  email: 'arjun.patel@localmiles.com',
  phone: '+91 98765 43210',
  avatarUrl: '', // Intentionally empty to show "Letter Avatar" logic
};

// Helper for Initials
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function CourierProfilePage() {
  return (
    <div className="page-container profile-page">
      
      {/* 1. HEADER */}
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <div className="status-badge">
          <div className="status-dot"></div>
          ONLINE
        </div>
      </div>

      {/* 2. PROFILE & COMPLIANCE CARD */}
      <div className="profile-card">
        
        {/* Left: Personal Info */}
        <div className="profile-left">
          <div className="avatar-container">
            {/* Logic: Show Image if exists, else show Letter Placeholder */}
            {userData.avatarUrl ? (
              <img 
                src={userData.avatarUrl} 
                alt={userData.name} 
                className="avatar-img"
              />
            ) : (
              <div className="avatar-placeholder">
                {getInitials(userData.name)}
              </div>
            )}
            
            <button className="avatar-edit-btn">
              <CameraIcon style={{ width: 18 }} />
            </button>
          </div>
          
          <div className="profile-details">
            <h2>{userData.name}</h2>
            <div className="rating-row">
              <StarIcon className="star-icon" />
              <StarIcon className="star-icon" />
              <StarIcon className="star-icon" />
              <StarIcon className="star-icon" />
              <StarIcon className="star-icon" />
              <span className="rating-text">4.9</span>
              <span className="review-count">(120 Reviews)</span>
            </div>
            
            <div className="contact-row">
              <PhoneIcon style={{ width: 18 }} /> {userData.phone}
            </div>
            <div className="contact-row">
              <EnvelopeIcon style={{ width: 18 }} /> {userData.email}
            </div>
          </div>
        </div>

        {/* Right: Compliance Status */}
        <div className="profile-right">
          <div className="section-head">
            <ShieldCheckIcon style={{ width: 24, color: '#4B5563' }} />
            Compliance Status
          </div>
          
          <div className="compliance-list">
            
            {/* Aadhaar */}
            <div className="compliance-item">
              <div className="comp-label">
                <FingerPrintIcon className="comp-icon" />
                Aadhaar Card
              </div>
              <div className="badge-pill badge-verified">
                <CheckBadgeIcon style={{ width: 16 }} /> Verified
              </div>
            </div>

            {/* License */}
            <div className="compliance-item">
              <div className="comp-label">
                <IdentificationIcon className="comp-icon" />
                Driving License
              </div>
              <div className="badge-pill badge-verified">
                <CheckBadgeIcon style={{ width: 16 }} /> Verified
              </div>
            </div>

            {/* Background Check */}
            <div className="compliance-item">
              <div className="comp-label">
                <ShieldCheckIcon className="comp-icon" />
                Background Check
              </div>
              <div className="badge-pill badge-pending">
                <ExclamationCircleIcon style={{ width: 16 }} /> Pending
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. VEHICLE MANAGEMENT CARD */}
      <div className="vehicle-card">
        
        <div className="card-header-row">
          <div className="header-title">
            {/* Replaced Emoji with Icon */}
            <TruckIcon style={{ width: 28, color: '#D4AF37' }} />
            My Vehicle
          </div>
          <button className="btn-edit">
            <PencilSquareIcon style={{ width: 18 }} /> Edit Details
          </button>
        </div>

        <div className="vehicle-grid">
          
          {/* Left: Visuals */}
          <div className="vehicle-visual">
            <div className="vehicle-img-box">
              {/* Internal asset or placeholder image required here. Using text fallback if image fails/missing for clean UI */}
              <img 
                src="/vehicle-placeholder.png" 
                alt="Honda Activa" 
                className="vehicle-img"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.style.display='none';
                  e.target.parentNode.style.background = '#e5e7eb';
                  e.target.parentNode.innerHTML = '<span style="color:#9ca3af; font-weight:700;">No Image</span>';
                }}
              />
            </div>
            <div className="plate-box">TN-01-AB-1234</div>
          </div>

          {/* Right: Info & Docs */}
          <div className="vehicle-content">
            
            {/* Specs Grid */}
            <div className="vehicle-info-grid">
              <div className="info-item">
                <label>Vehicle Model</label>
                <span>Honda Activa 6G</span>
              </div>
              <div className="info-item">
                <label>Color</label>
                <span>Pearl Precious White</span>
              </div>
              <div className="info-item">
                <label>Fuel Type</label>
                <span>Petrol</span>
              </div>
              <div className="info-item">
                <label>Registration Year</label>
                <span>2022</span>
              </div>
            </div>

            {/* Document Status */}
            <div className="docs-title">Document Status</div>
            <div className="docs-row">
              
              {/* RC Book */}
              <div className="doc-card">
                <div className="doc-icon-circle bg-green-light">
                  <DocumentTextIcon style={{ width: 20 }} />
                </div>
                <div>
                  <div className="doc-name">RC Book</div>
                  <div className="doc-status text-green">
                    <CheckCircleIcon style={{ width: 14 }} /> Verified
                  </div>
                </div>
              </div>

              {/* Insurance (Expired Example) */}
              <div className="doc-card expired">
                <div className="doc-icon-circle bg-red-light">
                  <ExclamationCircleIcon style={{ width: 20 }} />
                </div>
                <div>
                  <div className="doc-name">Insurance</div>
                  <div className="doc-status text-red">
                    <ExclamationCircleIcon style={{ width: 14 }} /> Expired
                  </div>
                </div>
                <button className="btn-upload">Upload Renewal</button>
              </div>

              {/* Pollution Cert */}
              <div className="doc-card">
                <div className="doc-icon-circle bg-green-light">
                  <CloudArrowUpIcon style={{ width: 20 }} />
                </div>
                <div>
                  <div className="doc-name">Pollution Cert</div>
                  <div className="doc-status text-green">
                    <CheckCircleIcon style={{ width: 14 }} /> Verified
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}