'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { io } from 'socket.io-client';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  ArrowLeftIcon, MapPinIcon, CheckCircleIcon, 
  UserIcon, PhoneIcon, DocumentTextIcon, PhotoIcon,
  CubeIcon, TruckIcon, CheckBadgeIcon, ShieldExclamationIcon, 
  BanknotesIcon, EnvelopeIcon, ArrowPathIcon, XMarkIcon, MapIcon, PlayIcon, StopIcon, QrCodeIcon
} from '@heroicons/react/24/outline';

// --- COMPONENTS ---
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';
import ImageGallery from '@/components/ui/ImageGallery'; 
import Skeleton from '@/components/ui/Skeleton';
import ToastNotification from '@/components/ui/ToastNotification';
import '@/styles/PackageDetails.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, ''); 
const TRACKING_STEPS = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

const CourierMap = dynamic(() => import('@/components/ui/CourierMap'), { 
  ssr: false, 
  loading: () => <Skeleton width="100%" height="250px" borderRadius="12px" /> 
});

// --- HELPER: HAVERSINE DISTANCE CALCULATOR (Returns KM) ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

export default function CourierJobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { theme } = useTheme();

  const [pkg, setPkg] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cloudName, setCloudName] = useState(null); 
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const [routePath, setRoutePath] = useState([]);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [lastSharedLocation, setLastSharedLocation] = useState(null);
  
  // Guard ref to prevent spamming the auto-transit API
  const isAutoStartingRef = useRef(false);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, title: '', message: '', isDanger: false, isProcessing: false });
  const [otpModal, setOtpModal] = useState({ isOpen: false, type: 'PICKUP', otp: '', isProcessing: false, error: '', scanMode: false });

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetch(`${API_URL}/config/cloudinary`).then(res => res.json()).then(data => { if (data.success) setCloudName(data.cloudName); }).catch(console.error);
  }, []);

  const fetchJobDetails = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/packages/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();

      if (data.success) {
        setPkg(data.data);
        if (data.data.lastLiveLat && data.data.lastLiveLng) {
          setLastSharedLocation({
            lat: data.data.lastLiveLat, lng: data.data.lastLiveLng,
            time: new Date(data.data.lastLiveUpdatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          });
        }
      } else throw new Error(data.message || "Failed to load job details.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchJobDetails(); }, [fetchJobDetails]);

  useEffect(() => {
    if (pkg && pkg.pickupLat && pkg.dropLat) {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pkg.pickupLng},${pkg.pickupLat};${pkg.dropLng},${pkg.dropLat}?overview=full&geometries=geojson`;
      fetch(osrmUrl).then(res => res.json()).then(data => {
        if (data.routes && data.routes.length > 0) setRoutePath(data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]));
      }).catch(console.error);
    }
  }, [pkg]);

  // --- MANUAL & AUTO TRANSIT LOGIC ---
  const handleStartTransit = async (isAuto = false) => {
    if (isAuto) isAutoStartingRef.current = true;
    else setConfirmModal(prev => ({ ...prev, isProcessing: true }));

    try {
      const token = localStorage.getItem('token');
      // Uses your existing status update endpoint
      const res = await fetch(`${API_URL}/packages/${pkg.publicId}/status`, { 
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_TRANSIT' })
      });
      const data = await res.json();

      if (data.success) { 
        setConfirmModal({ isOpen: false, isProcessing: false }); 
        setToast({ show: true, message: isAuto ? 'Auto-started Transit!' : 'Transit Started!', type: 'success' });
        fetchJobDetails(); 
      } else { 
        if (!isAuto) setToast({ show: true, message: data.message || 'Action failed', type: 'error' });
        setConfirmModal(prev => ({ ...prev, isProcessing: false })); 
      }
    } catch (err) { 
      if (!isAuto) setToast({ show: true, message: 'Network error occurred.', type: 'error' });
      setConfirmModal(prev => ({ ...prev, isProcessing: false })); 
    } finally {
      if (isAuto) isAutoStartingRef.current = false;
    }
  };

  // --- LIVE LOCATION & AUTO-TRANSIT TRIGGER ---
  useEffect(() => {
    let watchId;
    if (isSharingLocation && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) };
          setUserLocation(loc);
          setLastSharedLocation(loc);
          if (socket && pkg) socket.emit('update_location', { packageId: pkg.publicId, lat: loc.lat, lng: loc.lng, time: loc.time });

          // [NEW] AUTO-TRANSIT LOGIC
          if (pkg?.status === 'PICKED_UP' && !isAutoStartingRef.current) {
            const totalDistance = calculateDistance(pkg.pickupLat, pkg.pickupLng, pkg.dropLat, pkg.dropLng);
            const currentDistanceToDrop = calculateDistance(loc.lat, loc.lng, pkg.dropLat, pkg.dropLng);
            
            // If the courier is exactly half-way (or closer) to the drop-off point
            if (currentDistanceToDrop <= (totalDistance / 2)) {
              handleStartTransit(true); 
            }
          }
        },
        (err) => {
          console.error("GPS Error:", err);
          setToast({ show: true, message: 'GPS signal lost. Check permissions.', type: 'warning' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setUserLocation(null); 
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isSharingLocation, socket, pkg]);

  const handleAction = async () => {
    const { action } = confirmModal;
    if (action === 'START_TRANSIT') return handleStartTransit();
    
    setConfirmModal(prev => ({ ...prev, isProcessing: true }));
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      if (action === 'ACCEPT_JOB') endpoint = 'accept';
      else if (action === 'RESEND_PICKUP_OTP') endpoint = 'resend-pickup-otp';
      else if (action === 'RESEND_DELIVERY_OTP') endpoint = 'resend-delivery-otp';

      const res = await fetch(`${API_URL}/packages/${pkg.publicId}/${endpoint}`, { 
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) { 
        setConfirmModal({ isOpen: false, isProcessing: false }); 
        setToast({ show: true, message: data.message || 'Success!', type: 'success' });
        if (action === 'ACCEPT_JOB') fetchJobDetails(); 
      } else { 
        setToast({ show: true, message: data.message || 'Action failed', type: 'error' });
        setConfirmModal(prev => ({ ...prev, isProcessing: false })); 
      }
    } catch (err) { 
      setToast({ show: true, message: 'Network error occurred.', type: 'error' });
      setConfirmModal(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  const triggerResendOtp = (type) => {
    setConfirmModal({
      isOpen: true, action: type === 'PICKUP' ? 'RESEND_PICKUP_OTP' : 'RESEND_DELIVERY_OTP',
      title: 'Resend OTP', message: `Send a new OTP to the ${type === 'PICKUP' ? 'Sender' : 'Receiver'}? The previous OTP will expire.`, isDanger: false
    });
  };

  const handleVerifyOtp = async () => {
    if (otpModal.otp.length !== 4 && otpModal.otp.length !== 6) return setOtpModal(prev => ({ ...prev, error: 'Please enter a valid OTP' }));
    setOtpModal(prev => ({ ...prev, isProcessing: true, error: '' }));
    try {
      const endpoint = otpModal.type === 'PICKUP' ? 'verify-pickup' : 'verify-delivery';
      const res = await fetch(`${API_URL}/packages/${pkg.publicId}/${endpoint}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpModal.otp })
      });
      const data = await res.json();
      if (data.success) { 
        setOtpModal({ isOpen: false, type: 'PICKUP', otp: '', scanMode: false }); 
        setToast({ show: true, message: 'Verification Successful!', type: 'success' });
        fetchJobDetails(); 
      } else {
        setOtpModal(prev => ({ ...prev, isProcessing: false, error: data.message || 'Invalid OTP' }));
      }
    } catch (err) { setOtpModal(prev => ({ ...prev, isProcessing: false, error: 'Network error.' })); }
  };

  const handleScanSuccess = async (scannedText) => {
    const cleanOtp = scannedText.replace(/\D/g, '');
    if (cleanOtp.length >= 4 && cleanOtp.length <= 6) {
      setOtpModal(prev => ({ ...prev, otp: cleanOtp, scanMode: false, isProcessing: true, error: '' }));
      try {
        const token = localStorage.getItem('token');
        const endpoint = otpModal.type === 'PICKUP' ? 'verify-pickup' : 'verify-delivery';
        const res = await fetch(`${API_URL}/packages/${pkg.publicId}/${endpoint}`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: cleanOtp })
        });
        const data = await res.json();
        if (data.success) {
          setOtpModal({ isOpen: false, type: 'PICKUP', otp: '', scanMode: false });
          setToast({ show: true, message: 'QR Scan & Verification Successful!', type: 'success' });
          fetchJobDetails();
        } else {
          setOtpModal(prev => ({ ...prev, scanMode: false, isProcessing: false, error: data.message || 'Invalid QR/OTP' }));
        }
      } catch (err) { setOtpModal(prev => ({ ...prev, scanMode: false, isProcessing: false, error: 'Network error.' })); }
    } else { setToast({ show: true, message: 'Invalid QR format detected.', type: 'error' }); }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return '#F59E0B'; case 'ASSIGNED': return '#8B5CF6'; case 'PICKED_UP': return '#6366F1';
      case 'IN_TRANSIT': return '#3B82F6'; case 'DELIVERED': return '#10B981'; case 'CANCELLED': return '#EF4444';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) return (
    <div className="pd-container fade-in">
      <Skeleton width="150px" height="20px" style={{marginBottom: '24px'}} />
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '32px'}}>
        <div><Skeleton width="300px" height="36px" style={{marginBottom: '8px'}} /><Skeleton width="200px" height="20px" /></div>
        <Skeleton width="180px" height="40px" borderRadius="8px" />
      </div>
      <Skeleton width="100%" height="100px" borderRadius="16px" style={{marginBottom: '24px'}} />
      <div className="pd-main-grid">
        <div className="pd-col-left"><Skeleton width="100%" height="300px" borderRadius="16px" style={{marginBottom: '24px'}} /><Skeleton width="100%" height="200px" borderRadius="16px" /></div>
        <div className="pd-col-right"><Skeleton width="100%" height="450px" borderRadius="16px" style={{marginBottom: '24px'}} /><Skeleton width="100%" height="150px" borderRadius="16px" /></div>
      </div>
    </div>
  );

  if (error || !pkg) return <div className="pd-loading-screen" style={{color: 'var(--error-red)'}}><p>{error || "Job not found."}</p><button className="pd-btn pd-btn-primary" onClick={() => router.back()} style={{marginTop: '16px'}}>Go Back</button></div>;

  const hasAccepted = pkg.courierId && user && pkg.courierId === user.id;
  const canSeeSender = hasAccepted && pkg.status !== 'CANCELLED';
  const isPickedUp = pkg.status === 'PICKED_UP' || pkg.status === 'IN_TRANSIT' || pkg.status === 'DELIVERED';
  const currentStepIndex = TRACKING_STEPS.indexOf(pkg.status);

  const maskAddress = (address, isVisible) => {
    if (isVisible) return address;
    return address.split(',')[0] + " (Exact details masked)";
  };

  return (
    <div className="pd-container fade-in">
      <div className="pd-header">
        <button className="pd-back-btn" onClick={() => router.back()}><ArrowLeftIcon width={20} /> Back to Jobs</button>
        <div className="pd-title-row">
          <div><h1 className="pd-title">{pkg.title}</h1><p className="pd-id">Job ID: {pkg.publicId} • {pkg.distanceKm}km Route</p></div>
          <div className="pd-actions">
            <span className="pd-badge" style={{ backgroundColor: `${getStatusColor(pkg.status)}20`, color: getStatusColor(pkg.status), border: `1px solid ${getStatusColor(pkg.status)}` }}>{pkg.status.replace('_', ' ')}</span>
            <div className="pd-button-group">
              {pkg.status === 'PENDING' && (
                <button className="pd-btn pd-btn-primary" style={{ background: '#10B981', color: 'white' }} onClick={() => setConfirmModal({isOpen: true, action: 'ACCEPT_JOB', title: 'Accept Job', message: 'Commit to this delivery?', isDanger: false})}>
                  <CheckBadgeIcon width={18}/> Accept Delivery Job
                </button>
              )}
              {pkg.status === 'ASSIGNED' && hasAccepted && (
                <><button className="pd-btn pd-btn-outline" onClick={() => triggerResendOtp('PICKUP')}><ArrowPathIcon width={16} /> Resend OTP</button>
                  <button className="pd-btn pd-btn-primary" onClick={() => setOtpModal({isOpen: true, type: 'PICKUP', otp: '', scanMode: false})}>Confirm Pickup (OTP / QR)</button></>
              )}
              {/* [NEW] START TRANSIT BUTTON */}
              {pkg.status === 'PICKED_UP' && hasAccepted && (
                <button className="pd-btn pd-btn-primary" style={{ background: '#3B82F6', color: 'white' }} onClick={() => setConfirmModal({isOpen: true, action: 'START_TRANSIT', title: 'Start Transit', message: 'Are you heading to the destination now?', isDanger: false})}>
                  <TruckIcon width={18}/> Start Transit
                </button>
              )}
              {pkg.status === 'IN_TRANSIT' && hasAccepted && (
                <><button className="pd-btn pd-btn-outline" onClick={() => triggerResendOtp('DELIVERY')}><ArrowPathIcon width={16} /> Resend OTP</button>
                  <button className="pd-btn pd-btn-primary" style={{ background: '#10B981', color: 'white' }} onClick={() => setOtpModal({isOpen: true, type: 'DELIVERY', otp: '', scanMode: false})}>Mark Delivered (OTP / QR)</button></>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pd-card pd-stepper-card">
        <div className="pd-stepper-container">
          {TRACKING_STEPS.map((step, index) => (
            <div key={step} className={`pd-step ${index <= currentStepIndex ? 'active' : ''}`}>
              <div className="pd-step-circle">{index <= currentStepIndex ? <CheckCircleIcon width={16} /> : ''}</div>
              <div className="pd-step-label">{step.replace('_', ' ')}</div>
              {index < TRACKING_STEPS.length - 1 && <div className="pd-step-line"><div className="pd-step-line-progress" style={{ width: index + 1 <= currentStepIndex ? '100%' : '0%' }}></div></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="pd-main-grid">
        <div className="pd-col-left">
          <div className="pd-card">
            <h2 className="pd-card-title"><CubeIcon width={20} /> Logistics Specs</h2>
            <div className="pd-info-grid">
              <div className="pd-info-item"><label>Category</label><p>{pkg.category}</p></div>
              <div className="pd-info-item"><label>Weight</label><p>{pkg.weight}kg</p></div>
              <div className="pd-info-item"><label>Urgency</label><p>{pkg.urgency}</p></div>
            </div>
            {pkg.description && <div className="pd-description"><label>Instructions:</label><p>{pkg.description}</p></div>}
            <div className="pd-gallery-section" style={{marginTop: '24px'}}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><PhotoIcon width={18}/> Package Photos</label>
              {pkg.images?.length > 0 ? <ImageGallery images={pkg.images} cloudName={cloudName} /> : <div className="pd-no-images">No photos attached</div>}
            </div>
          </div>

          <div className="pd-card pd-people-card">
            {!canSeeSender && <div className="pd-privacy-warning"><ShieldExclamationIcon width={20} /> Contacts hidden until accepted.</div>}
            <div className="pd-person">
              <h3 className="pd-card-subtitle"><UserIcon width={18} /> Sender</h3>
              <p className="pd-person-name">{canSeeSender && pkg.sender ? pkg.sender.fullName : "Sender Hidden"}</p>
              <div className="pd-contact-stack">
                {canSeeSender && pkg.sender ? (
                  <>
                    <a href={`tel:${pkg.sender.phone}`} className="pd-contact-link active-link"><PhoneIcon width={14} /> {pkg.sender.phone}</a>
                    {pkg.sender.email && <a href={`mailto:${pkg.sender.email}`} className="pd-contact-link active-link"><EnvelopeIcon width={14} /> {pkg.sender.email}</a>}
                  </>
                ) : <span className="pd-contact-link disabled-link"><PhoneIcon width={14} /> +91 ••••• •••••</span>}
              </div>
            </div>
            <div className="pd-person-divider"></div>
            <div className="pd-person">
              <h3 className="pd-card-subtitle"><MapPinIcon width={18} /> Receiver</h3>
              <p className="pd-person-name">{hasAccepted ? pkg.receiverName : "Receiver Hidden"}</p>
              <div className="pd-contact-stack">
                {hasAccepted ? (
                  isPickedUp ? (
                    <a href={`tel:${pkg.receiverPhone}`} className="pd-contact-link active-link"><PhoneIcon width={14} /> {pkg.receiverPhone}</a>
                  ) : (
                    <span className="pd-contact-link disabled-link" style={{ color: 'var(--text-main)', border: '1px solid var(--border-light)' }}>
                      <PhoneIcon width={14} /> {pkg.receiverPhone}
                    </span>
                  )
                ) : <span className="pd-contact-link disabled-link"><PhoneIcon width={14} /> +91 ••••• •••••</span>}
                {hasAccepted && pkg.receiverEmail && (
                  <a href={`mailto:${pkg.receiverEmail}`} className="pd-contact-link active-link" style={{ color: 'var(--text-main)', border: '1px solid var(--border-light)' }}>
                    <EnvelopeIcon width={14} /> {pkg.receiverEmail}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pd-col-right">
          <div className="pd-card">
            <h2 className="pd-card-title"><MapIcon width={20} /> Route Map</h2>
            <div className="pd-map-container" style={{ height: '280px', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px', border: '1px solid var(--border-light)', position: 'relative' }}>
               <CourierMap theme={theme} pickupLat={pkg.pickupLat} pickupLng={pkg.pickupLng} dropoffLat={pkg.dropLat} dropoffLng={pkg.dropLng} mapPath={routePath} zoomControl={true} userLocation={isSharingLocation ? userLocation : lastSharedLocation} />
            </div>
            <div className="pd-route-timeline">
              <div className="pd-route-node">
                <div className="pd-node-dot"></div>
                <div className="pd-node-content">
                  <label>Pickup Location</label>
                  <p>{maskAddress(pkg.pickupAddress, canSeeSender)}</p>
                </div>
              </div>
              <div className="pd-route-line-container">
                <div className="pd-route-dashed-line"></div>
                <span className="pd-route-distance">{pkg.distanceKm} km</span>
              </div>
              <div className="pd-route-node">
                <div className="pd-node-dot drop-dot"></div>
                <div className="pd-node-content">
                  <label>Drop Location</label>
                  <p>{maskAddress(pkg.dropAddress, hasAccepted)}</p>
                </div>
              </div>
            </div>
          </div>

          {hasAccepted && pkg.status !== 'DELIVERED' && (
            <div className="pd-card" style={{ border: isSharingLocation ? '2px solid #10B981' : '1px solid var(--border-light)' }}>
              <h2 className="pd-card-title"><MapPinIcon width={20} /> Live Tracking Options</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                   <p style={{ margin: 0, fontWeight: 600, color: isSharingLocation ? '#10B981' : 'var(--text-main)' }}>{isSharingLocation ? 'Sharing Active' : 'Sharing Stopped'}</p>
                   {lastSharedLocation && !isSharingLocation && <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last active: {lastSharedLocation.time}</p>}
                 </div>
                 <button className={`pd-btn ${isSharingLocation ? 'pd-btn-danger' : 'pd-btn-primary'}`} style={!isSharingLocation ? { background: '#3B82F6', color: 'white' } : {}} onClick={() => setIsSharingLocation(!isSharingLocation)}>
                   {isSharingLocation ? <><StopIcon width={16}/> Stop</> : <><PlayIcon width={16}/> Go Live</>}
                 </button>
               </div>
            </div>
          )}

          <div className="pd-card pd-receipt" style={{ border: '2px solid var(--brand-gold)' }}>
            <h2 className="pd-card-title"><BanknotesIcon width={20} style={{ color: 'var(--brand-gold)' }} /> Estimated Earnings</h2>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAYOUT FOR THIS JOB</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>₹{pkg.driverFee ? pkg.driverFee.toFixed(0) : '0'}</div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false })} onConfirm={handleAction} title={confirmModal.title} message={confirmModal.message} confirmText="Confirm" isLoading={confirmModal.isProcessing} />
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      
      <Modal isOpen={otpModal.isOpen} onClose={() => setOtpModal({...otpModal, isOpen: false})} maxWidth="420px">
        <div style={{ textAlign: 'center' }}>
          {otpModal.scanMode ? (
            <>
              <QrCodeIcon width={48} style={{ color: 'var(--brand-gold)', margin: '0 auto 16px' }} />
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>Scan QR Code</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Ask the {otpModal.type === 'PICKUP' ? 'Sender' : 'Receiver'} to show their package QR code.</p>
              
              <div style={{ width: '100%', height: '260px', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', border: '2px solid var(--brand-gold)' }}>
                 <Scanner onScan={(detectedCodes) => { if (detectedCodes && detectedCodes.length > 0) { handleScanSuccess(detectedCodes[0].rawValue); } }} onError={(error) => console.log(error?.message)} scanDelay={1000} />
              </div>
              <button className="pd-btn pd-btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOtpModal({...otpModal, scanMode: false})}>Switch to Manual OTP</button>
            </>
          ) : (
            <>
              <ShieldExclamationIcon width={48} style={{ color: 'var(--brand-gold)', margin: '0 auto 16px' }} />
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>{otpModal.type === 'PICKUP' ? 'Confirm Pickup' : 'Confirm Delivery'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Ask the {otpModal.type === 'PICKUP' ? 'Sender' : 'Receiver'} for the OTP sent to their mobile number.</p>

              <input type="text" placeholder="Enter OTP" maxLength="6" value={otpModal.otp} onChange={(e) => setOtpModal({...otpModal, otp: e.target.value.replace(/\D/g, ''), error: ''})} style={{ width: '100%', padding: '16px', fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center', borderRadius: '12px', border: '2px solid var(--border-light)', background: 'var(--bg-page)', color: 'var(--text-main)', marginBottom: '8px', outline: 'none' }} />
              {otpModal.error && <p style={{ color: '#EF4444', fontSize: '0.85rem', margin: '0 0 16px 0', fontWeight: 600 }}>{otpModal.error}</p>}

              <button className="pd-btn pd-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '14px' }} onClick={handleVerifyOtp} disabled={otpModal.isProcessing || otpModal.otp.length < 4}>
                {otpModal.isProcessing ? 'Verifying...' : 'Verify & Confirm'}
              </button>
              
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span><div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
              </div>

              <button className="pd-btn pd-btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }} onClick={() => setOtpModal({...otpModal, scanMode: true, error: ''})}>
                <QrCodeIcon width={18} /> Scan QR Code Instead
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}