'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeftIcon, MapPinIcon, CheckCircleIcon, 
  UserIcon, PhoneIcon, DocumentTextIcon, PhotoIcon,
  CubeIcon, TruckIcon, PencilSquareIcon, TrashIcon, CreditCardIcon, XMarkIcon 
} from '@heroicons/react/24/outline';

// --- COMPONENTS ---
import ConfirmModal from '@/components/ui/ConfirmModal';
import ImageGallery from '@/components/ui/ImageGallery'; 
import '@/styles/PackageDetails.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const TRACKING_STEPS = ['DRAFT', 'PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

export default function PackageDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cloudName, setCloudName] = useState(null); 

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, action: null, title: '', message: '', isDanger: false, isProcessing: false
  });

  // --- FETCH CONFIG ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/config/cloudinary`);
        const data = await res.json();
        if (data.success) setCloudName(data.cloudName);
      } catch (err) { console.error("Cloudinary config error", err); }
    };
    fetchConfig();
  }, []);

  const fetchPackageDetails = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Please log in to view shipment.");

      const res = await fetch(`${API_URL}/packages/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setPkg(data.data);
      } else {
        throw new Error(data.message || "Failed to load package details.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPackageDetails(); }, [fetchPackageDetails]);

  // --- ACTIONS ---
  const handleAction = async () => {
    const { action } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isProcessing: true }));

    try {
      const token = localStorage.getItem('token');
      let url = ''; let method = '';

      if (action === 'DELETE_DRAFT') {
        url = `${API_URL}/packages/${pkg.publicId}`; method = 'DELETE';
      } else if (action === 'CANCEL_ORDER') {
        url = `${API_URL}/packages/${pkg.publicId}/cancel`; method = 'POST';
      }

      const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();

      if (data.success) {
        setConfirmModal({ isOpen: false, isProcessing: false });
        if (action === 'DELETE_DRAFT') {
           router.push('/sender/shipments'); 
        } else {
           fetchPackageDetails(); 
        }
      } else {
        alert(data.message || "Action failed.");
        setConfirmModal(prev => ({ ...prev, isProcessing: false }));
      }
    } catch (err) {
      alert("Something went wrong.");
      setConfirmModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'DRAFT': return 'var(--text-muted)';
      case 'PENDING': return '#F59E0B'; 
      case 'IN_TRANSIT': return '#3B82F6'; 
      case 'DELIVERED': return '#10B981'; 
      case 'CANCELLED': return '#EF4444';
      default: return 'var(--brand-gold)';
    }
  };

  if (loading) return (
    <div className="pd-loading-screen">
      <div className="pd-spinner"></div>
      <p>Loading shipment details...</p>
    </div>
  );

  if (error || !pkg) return (
    <div className="pd-loading-screen" style={{color: 'var(--error-red)'}}>
      <p>{error || "Package not found."}</p>
      <button className="pd-btn pd-btn-primary" onClick={() => router.back()} style={{marginTop: '16px'}}>Go Back</button>
    </div>
  );

  // Determine Stepper Progress
  const currentStepIndex = TRACKING_STEPS.indexOf(pkg.status);

  return (
    <div className="pd-container fade-in">
      
      <div className="pd-header">
        <button className="pd-back-btn" onClick={() => router.back()}>
          <ArrowLeftIcon width={20} /> Back to Shipments
        </button>
        <div className="pd-title-row">
          <div>
            <h1 className="pd-title">{pkg.title}</h1>
            <p className="pd-id">ID: {pkg.publicId} • {new Date(pkg.createdAt).toLocaleString()}</p>
          </div>
          <div className="pd-actions">
            <span className="pd-badge" style={{ backgroundColor: `${getStatusColor(pkg.status)}20`, color: getStatusColor(pkg.status), border: `1px solid ${getStatusColor(pkg.status)}` }}>
              {pkg.status.replace('_', ' ')}
            </span>
            
            {/* Action Buttons */}
            <div className="pd-button-group">
              {pkg.status === 'DRAFT' && (
                <>
                  <button className="pd-btn pd-btn-primary" onClick={() => router.push(`/sender/send/checkout/${pkg.publicId}`)}>
                    <CreditCardIcon width={16}/> Pay Now
                  </button>
                  <button className="pd-btn pd-btn-outline" onClick={() => router.push(`/sender/send?edit=${pkg.publicId}`)}>
                    <PencilSquareIcon width={16}/> Edit
                  </button>
                  <button className="pd-btn pd-btn-danger" 
                    onClick={() => setConfirmModal({isOpen: true, action: 'DELETE_DRAFT', title: 'Delete Draft', message: 'Are you sure you want to delete this draft?', isDanger: true})}
                  >
                    <TrashIcon width={16}/> Delete
                  </button>
                </>
              )}

              {pkg.status === 'PENDING' && (
                <button className="pd-btn pd-btn-danger" 
                  onClick={() => setConfirmModal({isOpen: true, action: 'CANCEL_ORDER', title: 'Cancel Order', message: 'Are you sure you want to cancel this order? Refund rules may apply.', isDanger: true})}
                >
                  <XMarkIcon width={16}/> Cancel Order
                </button>
              )}

              {pkg.status === 'IN_TRANSIT' && <button className="pd-btn pd-btn-primary">Track Live</button>}
            </div>
          </div>
        </div>
      </div>

      {/* --- PROGRESS STEPPER --- */}
      {pkg.status !== 'CANCELLED' && (
        <div className="pd-card pd-stepper-card">
          <div className="pd-stepper-container">
            {TRACKING_STEPS.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isNextActive = index + 1 <= currentStepIndex; // Check to fill the line

              return (
                <div key={step} className={`pd-step ${isActive ? 'active' : ''}`}>
                  <div className="pd-step-circle">{isActive ? <CheckCircleIcon width={16} /> : ''}</div>
                  <div className="pd-step-label">{step.replace('_', ' ')}</div>
                  {/* The Line connecting to the next node */}
                  {index < TRACKING_STEPS.length - 1 && (
                    <div className="pd-step-line">
                      <div className="pd-step-line-progress" style={{ width: isNextActive ? '100%' : '0%' }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pd-main-grid">
        
        {/* LEFT COLUMN */}
        <div className="pd-col-left">
          
          <div className="pd-card">
            <h2 className="pd-card-title"><CubeIcon width={20} /> Package Details</h2>
            <div className="pd-info-grid">
              <div className="pd-info-item"><label>Category</label><p>{pkg.category}</p></div>
              <div className="pd-info-item"><label>Size & Weight</label><p>{pkg.size.replace('_', ' ')} • {pkg.weight}kg</p></div>
              <div className="pd-info-item"><label>Dimensions (cm)</label><p>{pkg.length} x {pkg.breadth} x {pkg.height}</p></div>
              <div className="pd-info-item"><label>Declared Value</label><p>₹{pkg.declaredValue || 0}</p></div>
            </div>

            <div className="pd-tags">
              {pkg.isFragile && <span className="pd-tag fragile">Fragile</span>}
              {pkg.isLiquid && <span className="pd-tag liquid">Liquid</span>}
              {pkg.isGift && <span className="pd-tag gift">Gift</span>}
            </div>

            {pkg.description && (
              <div className="pd-description">
                <label>Instructions:</label>
                <p>{pkg.description}</p>
              </div>
            )}

            {/* IMAGE GALLERY */}
            <div className="pd-gallery-section" style={{marginTop: '24px'}}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <PhotoIcon width={18}/> Attached Photos
              </label>
              {pkg.images && pkg.images.length > 0 ? (
                <ImageGallery images={pkg.images} cloudName={cloudName} />
              ) : (
                <div className="pd-no-images">No images provided</div>
              )}
            </div>
          </div>

          <div className="pd-card pd-people-card">
            <div className="pd-person">
              <h3 className="pd-card-subtitle"><UserIcon width={18} /> Receiver</h3>
              <p className="pd-person-name">{pkg.receiverName}</p>
              <p className="pd-person-contact"><PhoneIcon width={14} /> {pkg.receiverPhone}</p>
              {pkg.receiverEmail && <p className="pd-person-contact"><DocumentTextIcon width={14} /> {pkg.receiverEmail}</p>}
            </div>
            
            <div className="pd-person-divider"></div>

            {/* COURIER STATUS */}
            <div className="pd-person">
              <h3 className="pd-card-subtitle"><TruckIcon width={18} /> Courier</h3>
              {pkg.courier ? (
                <>
                  <p className="pd-person-name">{pkg.courier.fullName}</p>
                  <p className="pd-person-contact"><PhoneIcon width={14} /> {pkg.courier.phone}</p>
                </>
              ) : (
                <p className="pd-text-muted" style={{marginTop: '10px', fontWeight: 500}}>
                  {pkg.status === 'CANCELLED' ? (
                    <span style={{ color: 'var(--error-red)' }}>Order Cancelled</span>
                  ) : pkg.status === 'DRAFT' ? (
                    "Awaiting payment..."
                  ) : (
                    "Searching for courier..."
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="pd-col-right">
          
          <div className="pd-card">
            <h2 className="pd-card-title"><MapPinIcon width={20} /> Route Info</h2>
            
            <div className="pd-map-placeholder">
              <MapPinIcon width={32} style={{color: 'var(--text-muted)', marginBottom: '8px'}} />
              <p style={{margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)'}}>Map View</p>
            </div>

            {/* --- REBUILT PERFECT ROUTE TIMELINE --- */}
            <div className="pd-route-timeline">
              <div className="pd-route-node">
                <div className="pd-node-dot"></div>
                <div className="pd-node-content">
                  <label>Pickup Location</label>
                  <p>{pkg.pickupAddress}</p>
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
                  <p>{pkg.dropAddress}</p>
                </div>
              </div>
            </div>

          </div>

          <div className="pd-card pd-receipt">
            <h2 className="pd-card-title"><DocumentTextIcon width={20} /> Payment Summary</h2>
            
            <div className="pd-receipt-row"><span>Delivery Fee</span><span>₹{pkg.driverFee}</span></div>
            <div className="pd-receipt-row"><span>Platform Fee</span><span>₹{pkg.platformFee}</span></div>
            {pkg.taxAmount > 0 && <div className="pd-receipt-row"><span>Taxes</span><span>₹{pkg.taxAmount}</span></div>}
            
            <div className="pd-receipt-divider"></div>
            
            <div className="pd-receipt-row pd-total"><span>Total Amount</span><span>₹{pkg.price}</span></div>
            <div className="pd-payment-mode">Payment Mode: <strong>{pkg.paymentMode}</strong></div>
          </div>

        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, isProcessing: false })}
        onConfirm={handleAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        isDanger={confirmModal.isDanger}
        isLoading={confirmModal.isProcessing}
      />

    </div>
  );
}