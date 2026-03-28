'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, PhoneIcon, EnvelopeIcon, FingerPrintIcon, IdentificationIcon,
  ShieldCheckIcon, DocumentTextIcon, CloudArrowUpIcon, CameraIcon, PencilSquareIcon, TruckIcon 
} from '@heroicons/react/24/outline';
import { 
  StarIcon, CheckBadgeIcon, ExclamationCircleIcon, CheckCircleIcon
} from '@heroicons/react/24/solid';

// Components
import ToastNotification from '@/components/ui/ToastNotification';
import VerifyMobileModal from '@/components/auth/VerifyMobileModal';
import Skeleton from '@/components/ui/Skeleton';
import Dropdown from '@/components/ui/Dropdown'; 
import '@/styles/CourierProfilePage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function CourierProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  
  // UI States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Data States
  const [user, setUser] = useState({});
  const [courierData, setCourierData] = useState({});
  
  // Backup states for Cancel logic
  const [originalUser, setOriginalUser] = useState({});
  const [originalCourier, setOriginalCourier] = useState({});
  
  // File Upload States
  const [avatarImage, setAvatarImage] = useState(null);
  const [vehicleImage, setVehicleImage] = useState(null);
  const [docs, setDocs] = useState({ rcBook: null, insurance: null, pollution: null, aadhaar: null, dl: null });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');
      const res = await fetch(`${API_URL}/user/courier-profile`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setOriginalUser(data.data);
        setCourierData(data.data.courierProfile || {});
        setOriginalCourier(data.data.courierProfile || {});
      }
    } catch (err) { setToast({ show: true, message: "Network Error", type: 'error' }); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleCancelProfile = () => {
    setUser(originalUser);
    setAvatarImage(null);
    setDocs(prev => ({...prev, aadhaar: null, dl: null}));
    setIsEditingProfile(false);
  };

  const handleCancelVehicle = () => {
    setCourierData(originalCourier);
    setVehicleImage(null);
    setDocs(prev => ({...prev, rcBook: null, insurance: null, pollution: null}));
    setIsEditingVehicle(false);
  };

  // Convert File to Base64
  const toBase64 = file => new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        fullName: user.fullName,
        avatarBase64: await toBase64(avatarImage),
        aadhaarBase64: await toBase64(docs.aadhaar),
        dlBase64: await toBase64(docs.dl)
      };

      const res = await fetch(`${API_URL}/user/courier-details`, { // Point to new combined endpoint
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setToast({ show: true, message: "Profile updated successfully!", type: 'success' });
        setIsEditingProfile(false);
        setAvatarImage(null);
        setDocs(prev => ({...prev, aadhaar: null, dl: null}));
        fetchProfile(); 
      } else {
        setToast({ show: true, message: "Failed to update profile", type: 'error' });
      }
    } catch (err) { setToast({ show: true, message: "Network error", type: 'error' }); } 
    finally { setSavingProfile(false); }
  };

  const handleVehicleSave = async () => {
    setSavingVehicle(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...courierData,
        vehicleImageBase64: await toBase64(vehicleImage),
        rcBookBase64: await toBase64(docs.rcBook),
        insuranceBase64: await toBase64(docs.insurance),
        pollutionBase64: await toBase64(docs.pollution),
      };

      const res = await fetch(`${API_URL}/user/courier-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setToast({ show: true, message: "Vehicle updated successfully!", type: 'success' });
        setIsEditingVehicle(false);
        setVehicleImage(null); 
        setDocs(prev => ({...prev, rcBook: null, insurance: null, pollution: null}));
        fetchProfile();
      } else {
        setToast({ show: true, message: "Failed to update vehicle", type: 'error' });
      }
    } catch (err) { setToast({ show: true, message: "Network error", type: 'error' }); } 
    finally { setSavingVehicle(false); }
  };

  if (loading) return <div className="page-container"><Skeleton width="100%" height="300px" borderRadius="20px" /></div>;

  // Rating Display Logic
  const displayRating = courierData.averageRating > 0 ? courierData.averageRating.toFixed(1) : "New";
  const displayReviews = courierData.totalReviews || 0;

  return (
    <div className="page-container profile-page fade-in">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <div className="status-badge"><div className="status-dot"></div>ONLINE</div>
      </div>

      {/* 1. PROFILE CARD */}
      <div className="profile-card">
        <div className="profile-left">
          
          <div className="avatar-container" style={{ position: 'relative' }}>
            {avatarImage || user.avatarUrl ? (
              <img src={avatarImage ? URL.createObjectURL(avatarImage) : user.avatarUrl} alt={user.fullName} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">{getInitials(user.fullName)}</div>
            )}
            
            {isEditingProfile && (
              <label style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--bg-card)', padding: '6px', borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--border-light)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CameraIcon style={{ width: 18, color: 'var(--text-main)' }} />
                <input type="file" accept="image/*" hidden onChange={(e) => setAvatarImage(e.target.files[0])} />
              </label>
            )}
          </div>
          
          <div className="profile-details" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              {isEditingProfile ? (
                <input 
                  type="text" value={user.fullName} 
                  onChange={(e) => setUser({...user, fullName: e.target.value})} 
                  className="input-field" style={{ fontSize: '1.1rem', fontWeight: 800, padding: '8px 12px', width: '220px' }} 
                />
              ) : (
                <h2>{user.fullName}</h2>
              )}
              
              {!isEditingProfile && (
                <button className="btn-edit" onClick={() => setIsEditingProfile(true)}><PencilSquareIcon style={{ width: 18 }} /> Edit</button>
              )}
            </div>

            <div className="rating-row">
              <StarIcon className="star-icon" />
              <span className="rating-text">{displayRating}</span>
              <span className="review-count">({displayReviews} Reviews)</span>
            </div>
            
            <div className="contact-row">
              <EnvelopeIcon style={{ width: 18 }} /> 
              <input type="email" value={user.email || ''} readOnly className="input-field" style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--text-muted)' }} />
            </div>

            <div className="contact-row" style={{ alignItems: 'center', display: 'flex', gap: '10px' }}>
              <PhoneIcon style={{ width: 18 }} />
              {user.phone ? (
                <>
                  <input type="text" value={user.phone} readOnly className="input-field" style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--text-muted)' }} />
                  {user.isPhoneVerified && <CheckBadgeIcon style={{ width: 16, color: '#10B981' }} title="Verified" />}
                </>
              ) : (
                <button onClick={() => setShowVerifyModal(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#F59E0B', color: '#fff' }}>
                  Verify Phone Required
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Compliance Status */}
        <div className="profile-right">
          <div className="section-head"><ShieldCheckIcon style={{ width: 24, color: 'var(--text-main)' }} /> Compliance Status</div>
          <div className="compliance-list">
            
            <div className="compliance-item">
              <div className="comp-label"><FingerPrintIcon className="comp-icon" /> Aadhaar Card</div>
              {courierData.aadhaarVerified ? (
                <div className="badge-pill badge-verified"><CheckBadgeIcon style={{ width: 16 }} /> Verified</div>
              ) : courierData.aadhaarUrl ? (
                <div className="badge-pill badge-pending"><ExclamationCircleIcon style={{ width: 16 }} /> Reviewing</div>
              ) : (
                isEditingProfile ? (
                  <label className="btn-upload-sm">
                    {docs.aadhaar ? 'Selected' : 'Upload'}
                    <input type="file" hidden onChange={e => setDocs({...docs, aadhaar: e.target.files[0]})} />
                  </label>
                ) : <div className="badge-pill badge-pending"><ExclamationCircleIcon style={{ width: 16 }} /> Missing</div>
              )}
            </div>

            <div className="compliance-item">
              <div className="comp-label"><IdentificationIcon className="comp-icon" /> Driving License</div>
              {courierData.dlVerified ? (
                <div className="badge-pill badge-verified"><CheckBadgeIcon style={{ width: 16 }} /> Verified</div>
              ) : courierData.dlUrl ? (
                <div className="badge-pill badge-pending"><ExclamationCircleIcon style={{ width: 16 }} /> Reviewing</div>
              ) : (
                isEditingProfile ? (
                  <label className="btn-upload-sm">
                    {docs.dl ? 'Selected' : 'Upload'}
                    <input type="file" hidden onChange={e => setDocs({...docs, dl: e.target.files[0]})} />
                  </label>
                ) : <div className="badge-pill badge-pending"><ExclamationCircleIcon style={{ width: 16 }} /> Missing</div>
              )}
            </div>

            <div className="compliance-item">
              <div className="comp-label"><ShieldCheckIcon className="comp-icon" /> Background Check</div>
              {courierData.bgVerified ? (
                <div className="badge-pill badge-verified"><CheckBadgeIcon style={{ width: 16 }} /> Verified</div>
              ) : (
                <div className="badge-pill badge-pending"><ExclamationCircleIcon style={{ width: 16 }} /> Pending Checks</div>
              )}
            </div>

          </div>

          {isEditingProfile && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={handleCancelProfile} className="btn-secondary">Cancel</button>
              <button onClick={handleProfileSave} disabled={savingProfile} className="btn-primary">
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. VEHICLE CARD */}
      <div className="vehicle-card">
        <div className="card-header-row">
          <div className="header-title"><TruckIcon style={{ width: 28, color: 'var(--brand-gold)' }} /> My Vehicle</div>
          {!isEditingVehicle && <button className="btn-edit" onClick={() => setIsEditingVehicle(true)}><PencilSquareIcon style={{ width: 18 }} /> Edit Details</button>}
        </div>

        <div className="vehicle-grid">
          {/* Left: Image & Plate */}
          <div className="vehicle-visual">
            
            <div className="vehicle-img-box" style={{ position: 'relative' }}>
              {vehicleImage || courierData.vehicleImage ? (
                <img src={vehicleImage ? URL.createObjectURL(vehicleImage) : courierData.vehicleImage} alt="Vehicle" className="vehicle-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color:'var(--text-muted)' }}>
                  <TruckIcon width={64} style={{ opacity: 0.5, marginBottom: '12px' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>NO VEHICLE PHOTO</span>
                </div>
              )}
              {isEditingVehicle && (
                <label style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', padding: '10px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <CameraIcon width={20} />
                  <input type="file" accept="image/*" hidden onChange={(e) => setVehicleImage(e.target.files[0])} />
                </label>
              )}
            </div>
            
            {isEditingVehicle ? (
              <input 
                type="text" value={courierData.plateNumber || ''} placeholder="TN-01-AB-1234"
                onChange={e => setCourierData({...courierData, plateNumber: e.target.value.toUpperCase()})}
                className="input-field" style={{ textAlign: 'center', fontWeight: 800, letterSpacing: '2px', fontSize: '1.1rem' }}
              />
            ) : (
              <div className="plate-box">{courierData.plateNumber && courierData.plateNumber !== "NOT SET" ? courierData.plateNumber : "TN-XX-XXXX"}</div>
            )}
          </div>

          {/* Right: Info & Docs */}
          <div className="vehicle-content">
            
            <div className="vehicle-info-grid">
              <div className="info-item">
                <label>Vehicle Model</label>
                {isEditingVehicle ? <input type="text" className="input-field" value={courierData.vehicleModel || ''} onChange={e => setCourierData({...courierData, vehicleModel: e.target.value})} /> : <span>{courierData.vehicleModel || '-'}</span>}
              </div>
              <div className="info-item">
                <label>Color</label>
                {isEditingVehicle ? <input type="text" className="input-field" value={courierData.vehicleColor || ''} onChange={e => setCourierData({...courierData, vehicleColor: e.target.value})} /> : <span>{courierData.vehicleColor || '-'}</span>}
              </div>
              <div className="info-item">
                {isEditingVehicle ? (
                  <Dropdown 
                    label="Fuel Type" name="fuelType" value={courierData.fuelType || ''}
                    options={[ {label: 'Select...', value: ''}, {label: 'Petrol', value: 'Petrol'}, {label: 'Diesel', value: 'Diesel'}, {label: 'Electric (EV)', value: 'EV'} ]}
                    onChange={(e) => setCourierData({...courierData, fuelType: e.target.value})}
                  />
                ) : (
                  <><label>Fuel Type</label><span>{courierData.fuelType || '-'}</span></>
                )}
              </div>
              <div className="info-item">
                <label>Registration Year</label>
                {isEditingVehicle ? <input type="number" className="input-field" value={courierData.regYear || ''} onChange={e => setCourierData({...courierData, regYear: e.target.value})} /> : <span>{courierData.regYear || '-'}</span>}
              </div>
            </div>

            <div className="docs-title">Document Status</div>
            <div className="docs-row">
              
              {/* RC Book */}
              <div className={`doc-card ${!courierData.rcBookUrl && !docs.rcBook ? 'expired' : ''}`}>
                <div className={`doc-icon-circle ${courierData.rcVerified ? 'bg-green-light' : (courierData.rcBookUrl || docs.rcBook ? 'bg-yellow-light' : 'bg-red-light')}`}><DocumentTextIcon style={{ width: 20 }} /></div>
                <div>
                  <div className="doc-name">RC Book</div>
                  <div className={`doc-status ${courierData.rcVerified ? 'text-green' : (courierData.rcBookUrl || docs.rcBook ? 'text-yellow' : 'text-red')}`}>
                    {courierData.rcVerified ? <><CheckCircleIcon style={{ width: 14 }} /> Verified</> : (courierData.rcBookUrl || docs.rcBook ? <><ExclamationCircleIcon style={{ width: 14 }} /> Reviewing</> : <><ExclamationCircleIcon style={{ width: 14 }} /> Missing</>)}
                  </div>
                </div>
                {isEditingVehicle && (
                  <label className="btn-upload-sm" style={{ marginTop: '8px' }}>
                    {docs.rcBook ? 'File Selected' : 'Upload'}
                    <input type="file" hidden onChange={e => setDocs({...docs, rcBook: e.target.files[0]})} />
                  </label>
                )}
              </div>

              {/* Insurance */}
              <div className={`doc-card ${!courierData.insuranceUrl && !docs.insurance ? 'expired' : ''}`}>
                <div className={`doc-icon-circle ${courierData.insuranceVerified ? 'bg-green-light' : (courierData.insuranceUrl || docs.insurance ? 'bg-yellow-light' : 'bg-red-light')}`}><ShieldCheckIcon style={{ width: 20 }} /></div>
                <div>
                  <div className="doc-name">Insurance</div>
                  <div className={`doc-status ${courierData.insuranceVerified ? 'text-green' : (courierData.insuranceUrl || docs.insurance ? 'text-yellow' : 'text-red')}`}>
                    {courierData.insuranceVerified ? <><CheckCircleIcon style={{ width: 14 }} /> Verified</> : (courierData.insuranceUrl || docs.insurance ? <><ExclamationCircleIcon style={{ width: 14 }} /> Reviewing</> : <><ExclamationCircleIcon style={{ width: 14 }} /> Missing</>)}
                  </div>
                </div>
                {isEditingVehicle && (
                  <label className="btn-upload-sm" style={{ marginTop: '8px' }}>
                    {docs.insurance ? 'File Selected' : 'Upload'}
                    <input type="file" hidden onChange={e => setDocs({...docs, insurance: e.target.files[0]})} />
                  </label>
                )}
              </div>

              {/* Pollution */}
              <div className={`doc-card ${!courierData.pollutionUrl && !docs.pollution ? 'expired' : ''}`}>
                <div className={`doc-icon-circle ${courierData.pollutionVerified ? 'bg-green-light' : (courierData.pollutionUrl || docs.pollution ? 'bg-yellow-light' : 'bg-red-light')}`}><CloudArrowUpIcon style={{ width: 20 }} /></div>
                <div>
                  <div className="doc-name">Pollution Cert</div>
                  <div className={`doc-status ${courierData.pollutionVerified ? 'text-green' : (courierData.pollutionUrl || docs.pollution ? 'text-yellow' : 'text-red')}`}>
                    {courierData.pollutionVerified ? <><CheckCircleIcon style={{ width: 14 }} /> Verified</> : (courierData.pollutionUrl || docs.pollution ? <><ExclamationCircleIcon style={{ width: 14 }} /> Reviewing</> : <><ExclamationCircleIcon style={{ width: 14 }} /> Missing</>)}
                  </div>
                </div>
                {isEditingVehicle && (
                  <label className="btn-upload-sm" style={{ marginTop: '8px' }}>
                    {docs.pollution ? 'File Selected' : 'Upload'}
                    <input type="file" hidden onChange={e => setDocs({...docs, pollution: e.target.files[0]})} />
                  </label>
                )}
              </div>

            </div>

            {isEditingVehicle && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button onClick={handleCancelVehicle} className="btn-secondary">Cancel</button>
                <button onClick={handleVehicleSave} disabled={savingVehicle} className="btn-primary">
                  {savingVehicle ? 'Saving...' : 'Save Vehicle'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <VerifyMobileModal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} onVerified={() => { setShowVerifyModal(false); fetchProfile(); }} />
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}