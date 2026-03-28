'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  ArrowLeftIcon, ShieldCheckIcon, 
  CreditCardIcon, WalletIcon, GlobeAltIcon,
  ClockIcon, CubeIcon, PencilSquareIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import 'leaflet/dist/leaflet.css'; 
import '@/styles/Checkout.css';

// --- COMPONENTS ---
import VerifyMobileModal from '@/components/auth/VerifyMobileModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ToastNotification from '@/components/ui/ToastNotification';
import Skeleton from '@/components/ui/Skeleton'; // <-- IMPORT SKELETON

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- DYNAMIC MAP IMPORTS ---
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((m) => m.Polyline), { ssr: false });

const MapUpdater = ({ bounds }) => {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try { map.fitBounds(bounds, { padding: [50, 50], animate: true }); } 
      catch (e) { console.warn("Map bounds error", e); }
    }
  }, [map, bounds]);
  return null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [packageData, setPackageData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0); 
  const [isPhoneVerified, setIsPhoneVerified] = useState(true); 
  
  const [routePath, setRoutePath] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  
  // Modals & Notifications State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [markerIcon, setMarkerIcon] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        setMarkerIcon(L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
        }));
      });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/auth/login'); return; }

        const pkgRes = await fetch(`${API_URL}/packages/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const pkgData = await pkgRes.json();

        const userRes = await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        const userData = await userRes.json();

        if (pkgData.success) setPackageData(pkgData.data);
        else setError(pkgData.message || "Failed to load package");

        if (userData.success) {
          setWalletBalance(userData.data.walletBalance || 0);
          setIsPhoneVerified(userData.data.isPhoneVerified);
        }
      } catch (err) { setError("Network error."); } 
      finally { 
        setTimeout(() => setLoading(false), 800); 
      }
    };
    if (id) fetchData();
  }, [id, router]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!packageData) return;
      const { pickupLat, pickupLng, dropLat, dropLng } = packageData;
      const fallbackRoute = [[pickupLat, pickupLng], [dropLat, dropLng]];
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${dropLng},${dropLat}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) setRoutePath(data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]));
        else setRoutePath(fallbackRoute);
      } catch (err) { setRoutePath(fallbackRoute); }
    };
    if (packageData) fetchRoute();
  }, [packageData]);

  const handleBack = () => router.push(`/sender/send?edit=${id}`);

  const handleInitialPayClick = () => {
    if (!isPhoneVerified) setShowVerifyModal(true);
    else setShowConfirmModal(true);
  };

  const onMobileVerified = () => {
    setIsPhoneVerified(true);
    setShowVerifyModal(false);
    setTimeout(() => setShowConfirmModal(true), 300); 
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/packages/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod }) 
      });

      const data = await res.json();

      if (data.success) {
        setShowConfirmModal(false);
        setToast({ show: true, message: 'Payment successful! Searching for couriers...', type: 'success' });
        setTimeout(() => {
          router.push(`/sender/shipments/${id}`); 
        }, 1500);
      } else {
        setShowConfirmModal(false);
        setToast({ show: true, message: data.message || "Payment Failed.", type: 'error' });
      }
    } catch (err) {
      setShowConfirmModal(false);
      setToast({ show: true, message: "Network error processing payment.", type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- SKELETON RENDERER ---
  const renderSkeletons = () => (
    <div className="checkout-page-container">
      <header className="checkout-header">
        <div className="header-left">
           <Skeleton width="40px" height="40px" circle={true} />
           <div style={{ marginLeft: '12px' }}>
              <Skeleton width="180px" height="24px" style={{ marginBottom: '8px' }} />
              <Skeleton width="120px" height="14px" />
           </div>
        </div>
      </header>
      <div className="checkout-grid">
        <div className="left-column">
           <Skeleton width="100%" height="350px" borderRadius="16px" style={{ marginBottom: '24px' }} />
           <div className="card" style={{ padding: '24px' }}>
              <Skeleton width="150px" height="20px" style={{ marginBottom: '20px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                 <Skeleton width="100%" height="60px" borderRadius="12px" />
                 <Skeleton width="100%" height="60px" borderRadius="12px" />
                 <Skeleton width="100%" height="60px" borderRadius="12px" />
              </div>
           </div>
        </div>
        <div className="right-column">
           <div className="card" style={{ padding: '24px' }}>
              <Skeleton width="60%" height="24px" style={{ marginBottom: '24px' }} />
              <Skeleton width="100%" height="16px" style={{ marginBottom: '12px' }} />
              <Skeleton width="100%" height="16px" style={{ marginBottom: '12px' }} />
              <Skeleton width="100%" height="1px" style={{ margin: '20px 0' }} />
              <Skeleton width="100%" height="32px" style={{ marginBottom: '24px' }} />
              <Skeleton width="100%" height="50px" borderRadius="10px" />
           </div>
        </div>
      </div>
    </div>
  );

  if (loading) return renderSkeletons();
  if (!packageData) return null;

  const isWalletInsufficient = walletBalance < packageData.price;

  return (
    <div className="checkout-page-container fade-in">
      <header className="checkout-header">
        <div className="header-left">
          <button onClick={handleBack} className="back-btn"><ArrowLeftIcon className="icon-24" /></button>
          <div className="header-text">
            <h1>Review & Pay</h1>
            <span className="order-id">ID: {packageData.publicId}</span>
          </div>
        </div>
      </header>

      <div className="checkout-grid">
        <div className="left-column">
          <div className="map-card">
            <div className="map-overlay-pill"><ClockIcon className="icon-16" /><span>{packageData.distanceKm} km</span></div>
            <div className="map-wrapper">
              <MapContainer 
                key={packageData.publicId} center={[packageData.pickupLat, packageData.pickupLng]} 
                zoom={13} zoomControl={true} scrollWheelZoom={true} dragging={true} doubleClickZoom={true}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                {routePath.length > 0 && <Polyline positions={routePath} pathOptions={{ color: '#D4AF37', weight: 5, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }} />}
                {markerIcon && (
                  <>
                    <Marker position={[packageData.pickupLat, packageData.pickupLng]} icon={markerIcon} />
                    <Marker position={[packageData.dropLat, packageData.dropLng]} icon={markerIcon} />
                  </>
                )}
                <MapUpdater bounds={routePath.length > 0 ? routePath : [[packageData.pickupLat, packageData.pickupLng], [packageData.dropLat, packageData.dropLng]]} />
              </MapContainer>
            </div>
          </div>

          <section className="section-block">
            <div className="section-header"><h3>Package Details</h3><button className="edit-link" onClick={handleBack}>Edit</button></div>
            <div className="details-row">
              <div className="detail-pill"><div className="pill-icon"><PencilSquareIcon className="icon-20" /></div><div><strong>{packageData.title}</strong><span>{packageData.category}</span></div></div>
              <div className="detail-pill"><div className="pill-icon"><CubeIcon className="icon-20" /></div><div><strong>{packageData.size}</strong><span>{packageData.weight} kg</span></div></div>
              <div className="detail-pill"><div className="pill-icon"><ShieldCheckIcon className="icon-20" /></div><div><strong>Value</strong><span>₹{packageData.declaredValue || 0}</span></div></div>
            </div>
          </section>
        </div>

        <div className="right-column">
          <div className="payment-card">
            <h3>Payment Summary</h3>
            <div className="bill-row"><span>Delivery Fee</span><strong>₹{packageData.driverFee.toFixed(2)}</strong></div>
            <div className="bill-row"><span>Platform Fee</span><strong>₹{packageData.platformFee.toFixed(2)}</strong></div>
            {packageData.taxAmount > 0 && <div className="bill-row"><span>GST ({packageData.taxRateApplied}%)</span><strong>₹{packageData.taxAmount.toFixed(2)}</strong></div>}
            <div className="divider"></div>
            <div className="bill-total"><span>Total to Pay</span><span className="total-amount">₹{packageData.price.toFixed(2)}</span></div>

            <div className="payment-method-section">
              <label>PAYMENT METHOD</label>
              
              <div className={`pm-option ${paymentMethod === 'WALLET' ? 'active' : ''} ${isWalletInsufficient ? 'disabled' : ''}`} onClick={() => !isWalletInsufficient && setPaymentMethod('WALLET')}>
                <div className="pm-left">
                  <WalletIcon className="icon-20" />
                  <div>
                    <span>Wallet</span>
                    <small style={{display:'block', fontSize:'0.75rem', color: isWalletInsufficient ? '#EF4444' : '#6B7280'}}>
                      Bal: ₹{walletBalance.toFixed(2)} {isWalletInsufficient && "(Low Balance)"}
                    </small>
                  </div>
                </div>
                {paymentMethod === 'WALLET' && <CheckCircleIcon className="check-icon" />}
              </div>

              <div className={`pm-option ${paymentMethod === 'ONLINE' ? 'active' : ''}`} onClick={() => setPaymentMethod('ONLINE')}>
                <div className="pm-left"><GlobeAltIcon className="icon-20" /><span>Pay Online</span></div>
                {paymentMethod === 'ONLINE' && <CheckCircleIcon className="check-icon" />}
              </div>
            </div>

            <button className="pay-btn" onClick={handleInitialPayClick} disabled={isProcessing || (paymentMethod === 'WALLET' && isWalletInsufficient)}>
              {isProcessing ? 'Processing...' : `Pay ₹${packageData.price.toFixed(2)} & Find Courier`}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmPayment}
        title="Confirm Payment" message={`Are you sure you want to pay ₹${packageData.price.toFixed(2)} for this delivery?`}
        confirmText="Pay Now" cancelText="Cancel" isLoading={isProcessing}
      />

      <VerifyMobileModal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} onVerified={onMobileVerified} />

      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}