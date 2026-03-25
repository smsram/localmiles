'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  PhotoIcon, ShieldCheckIcon, ArrowRightIcon, XMarkIcon, 
  MapPinIcon, BoltIcon, CalendarIcon, TruckIcon,
  UserIcon, PhoneIcon, EnvelopeIcon, HomeIcon, BuildingOfficeIcon,
  ArrowPathIcon, ExclamationTriangleIcon, XCircleIcon 
} from '@heroicons/react/24/outline';
import MapPicker from '@/components/ui/MapPicker';
import Dropdown from '@/components/ui/Dropdown';
import ImageGallery from '@/components/ui/ImageGallery'; // <-- Import the Gallery
import '@/styles/SendPackage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const determineSize = (weight, length, width, height) => {
  if (length === 0 && width === 0 && height === 0) return weight <= 1 ? 'ENVELOPE' : 'SMALL_BOX';
  if (weight <= 1 && length <= 35 && width <= 25 && height <= 5) return 'ENVELOPE';
  if (weight <= 5 && length <= 30 && width <= 30 && height <= 30) return 'SMALL_BOX';
  if (weight <= 10 && length <= 45 && width <= 45 && height <= 45) return 'MEDIUM_BOX';
  if (weight <= 20 && length <= 60 && width <= 60 && height <= 60) return 'LARGE_BOX';
  return 'OVERSIZED'; 
};

const truncateAddress = (address) => {
  if (!address) return "";
  return address.length > 25 ? `${address.substring(0, 25)}...` : address;
};

// --- LOCATION MODAL COMPONENT ---
function LocationModal({ mode, savedAddresses, onClose, onConfirm }) {
  const [activeTab, setActiveTab] = useState('saved'); 
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null); 

  useEffect(() => {
    const homeAddress = savedAddresses.find(addr => addr.type?.toLowerCase() === 'home');
    if (homeAddress) {
      setMapCenter({ lat: homeAddress.lat, lng: homeAddress.lng });
      setSelectedLocation({
        id: homeAddress.id, address: homeAddress.address, lat: homeAddress.lat, lng: homeAddress.lng,
        contactName: homeAddress.contactName, contactPhone: homeAddress.contactPhone, contactEmail: homeAddress.contactEmail
      });
    }
  }, [savedAddresses]);

  const handleSavedClick = (addr) => {
    if (selectedLocation?.id === addr.id) { setSelectedLocation(null); return; }
    setSelectedLocation({
      id: addr.id, address: addr.address, lat: addr.lat, lng: addr.lng,
      contactName: addr.contactName, contactPhone: addr.contactPhone, contactEmail: addr.contactEmail
    });
    setMapCenter({ lat: addr.lat, lng: addr.lng });
  };

  const handleMapSelect = async (loc) => {
    setMapCenter({ lat: loc.lat, lng: loc.lng });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`);
      const data = await res.json();
      setSelectedLocation({
        id: null, address: data.display_name || "Pinned Location", lat: loc.lat, lng: loc.lng,
        contactName: '', contactPhone: '', contactEmail: '' 
      });
    } catch (err) {
      setSelectedLocation({ id: null, address: "Pinned Location", lat: loc.lat, lng: loc.lng });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Select {mode === 'pickup' ? 'Pickup' : 'Drop'} Location</h3>
          <button onClick={onClose} className="close-modal-btn"><XMarkIcon className="icon-24" /></button>
        </div>
        <div className="modal-body split-view">
          <div className="modal-sidebar">
            <div className="tabs">
              <button className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>Saved Addresses</button>
              <button className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>Pick on Map</button>
            </div>
            <div className="tab-content">
              {activeTab === 'saved' ? (
                <div className="saved-list-scroll">
                  {savedAddresses.length === 0 && <div className="empty-state"><MapPinIcon className="icon-32 text-muted" style={{margin:'0 auto 8px'}} /><p>No saved addresses found.</p><small>Switch to "Pick on Map"</small></div>}
                  {savedAddresses.map(addr => (
                    <div key={addr.id} className={`saved-item ${selectedLocation?.id === addr.id ? 'selected' : ''}`} onClick={() => handleSavedClick(addr)}>
                      <div className="saved-icon">{addr.type === 'home' ? <HomeIcon className="icon-20" /> : <BuildingOfficeIcon className="icon-20" />}</div>
                      <div className="saved-details"><strong>{addr.title}</strong><p>{addr.address}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><p>Search or click the map to select a precise location.</p></div>
              )}
            </div>
          </div>
          <div className="modal-map">
            <MapPicker lat={mapCenter?.lat} lng={mapCenter?.lng} onLocationSelect={handleMapSelect} zoom={15} useCurrentLocation={!mapCenter} />
          </div>
        </div>
        <div className="modal-footer">
          <div className="selected-summary">
            {selectedLocation ? (<div><strong>SELECTED LOCATION</strong><p title={selectedLocation.address}>{selectedLocation.address}</p></div>) : (<p className="text-muted">Please select an address or pin on map</p>)}
          </div>
          <button className="btn-primary" disabled={!selectedLocation} onClick={() => onConfirm(selectedLocation)}>Confirm Location</button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function SendPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit'); 
  const [cloudName, setCloudName] = useState(null);

  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '', description: '', 
    category: 'DOCUMENTS', otherCategory: '', declaredValue: '', 
    weight: 0.5, length: 0, breadth: 0, height: 0, size: 'SMALL_BOX', 
    urgency: 'STANDARD', scheduledDate: '', paymentMode: 'PREPAID', safetyCheck: false,
    distance: 0, receiverName: '', receiverPhone: '', receiverEmail: '', 
    isGift: false, isFragile: false, isLiquid: false,
    pickupAddress: '', pickupLat: 0, pickupLng: 0, 
    dropAddress: '', dropLat: 0, dropLng: 0
  });

  const [existingImages, setExistingImages] = useState([]); 
  const [deletedImageIds, setDeletedImageIds] = useState([]); 
  const [newImageFiles, setNewImageFiles] = useState([]); 
  const [newImagePreviews, setNewImagePreviews] = useState([]); 

  const [price, setPrice] = useState(null); 
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [modalMode, setModalMode] = useState(null); 
  const [valueError, setValueError] = useState(null);

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

  useEffect(() => {
    if (editId) {
      const fetchDraft = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/packages/${editId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            const pkg = data.data;
            if (pkg.status !== 'DRAFT') {
              alert("Only drafts can be edited.");
              router.push('/dashboard');
              return;
            }
            setFormData({
              title: pkg.title || '', description: pkg.description || '', category: pkg.category,
              otherCategory: pkg.otherCategory || '', declaredValue: pkg.declaredValue || '', weight: pkg.weight,
              length: pkg.length, breadth: pkg.breadth, height: pkg.height, size: pkg.size,
              urgency: pkg.urgency, scheduledDate: pkg.scheduledDate ? new Date(pkg.scheduledDate).toISOString().slice(0, 16) : '',
              paymentMode: pkg.paymentMode, safetyCheck: true, distance: pkg.distanceKm,
              receiverName: pkg.receiverName || '', receiverPhone: pkg.receiverPhone || '', receiverEmail: pkg.receiverEmail || '',
              isGift: !!pkg.isGift, isFragile: !!pkg.isFragile, isLiquid: !!pkg.isLiquid,
              pickupAddress: pkg.pickupAddress, pickupLat: pkg.pickupLat, pickupLng: pkg.pickupLng,
              dropAddress: pkg.dropAddress, dropLat: pkg.dropLat, dropLng: pkg.dropLng
            });
            setPrice(pkg.price);
            setExistingImages(pkg.images || []); 
          }
        } catch (err) { console.error("Failed to load draft"); }
      };
      fetchDraft();
    }
  }, [editId, router]);

  const categoryOptions = [
    { label: 'Documents', value: 'DOCUMENTS' }, { label: 'Electronics', value: 'ELECTRONICS' },
    { label: 'Food', value: 'FOOD' }, { label: 'Clothing', value: 'CLOTHING' },
    { label: 'Furniture', value: 'FURNITURE' }, { label: 'Other', value: 'OTHER' }
  ];

  useEffect(() => {
    const val = parseFloat(formData.declaredValue);
    if (!formData.declaredValue) setValueError(null);
    else if (val > 50000) setValueError({ type: 'error', msg: "Item value too high for bike delivery." });
    else if (val > 5000) setValueError({ type: 'warning', msg: "High value item. Liability limited to ₹2,000." });
    else setValueError(null);
  }, [formData.declaredValue]);

  const calculatePrice = useCallback(async () => {
    if (!formData.pickupLat || !formData.dropLat) return;
    setIsCalculating(true);
    try {
      const res = await fetch(`${API_URL}/pricing/estimate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: formData.pickupLat, pickupLng: formData.pickupLng, dropLat: formData.dropLat, dropLng: formData.dropLng,
          weight: formData.weight, urgency: formData.urgency
        })
      });
      const data = await res.json();
      if (data.success) {
        setPrice(data.data.price);
        setFormData(prev => ({ ...prev, distance: data.data.distance }));
      }
    } catch (error) { console.error(error); } finally { setIsCalculating(false); }
  }, [formData.pickupLat, formData.dropLat, formData.weight, formData.urgency]);

  useEffect(() => {
    const timer = setTimeout(() => calculatePrice(), 800);
    return () => clearTimeout(timer);
  }, [calculatePrice]);

  useEffect(() => {
    const newSize = determineSize(formData.weight, formData.length, formData.breadth, formData.height);
    setFormData(prev => ({ ...prev, size: newSize }));
  }, [formData.weight, formData.length, formData.breadth, formData.height]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_URL}/addresses`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setSavedAddresses(data.data);
      } catch (err) {}
    };
    fetchAddresses();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    if (type === 'range' || ['weight', 'declaredValue'].includes(name)) {
      let numVal = parseFloat(value);
      if (isNaN(numVal) || numVal < 0) numVal = '';
      finalValue = numVal;
    } else if (type === 'checkbox') {
      finalValue = checked;
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleCustomDimensionChange = (e) => {
    const { name, value } = e.target;
    let numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) numVal = 0;
    setFormData(prev => ({ ...prev, [name]: numVal }));
  };

  const handleUrgencySelect = (level) => setFormData(prev => ({ ...prev, urgency: level }));
  
  const handleLocationConfirm = (loc) => {
    if (modalMode === 'pickup') setFormData(prev => ({ ...prev, pickupAddress: loc.address, pickupLat: loc.lat, pickupLng: loc.lng }));
    else if (modalMode === 'drop') setFormData(prev => ({ ...prev, dropAddress: loc.address, dropLat: loc.lat, dropLng: loc.lng, receiverName: loc.contactName || prev.receiverName, receiverPhone: loc.contactPhone || prev.receiverPhone, receiverEmail: loc.contactEmail || prev.receiverEmail }));
    setModalMode(null);
  };

  // --- UNIFIED IMAGE GALLERY HANDLING ---
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalCount = existingImages.length + newImageFiles.length + files.length;
    if (totalCount > 10) return alert("Maximum 10 images allowed.");
    
    setNewImageFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Map state to unified gallery format
  const galleryImages = [
    ...existingImages.map(img => ({ id: img.id, url: img.url, type: 'existing' })),
    ...newImagePreviews.map((url, i) => ({ id: `new-${i}`, url, type: 'new', index: i }))
  ];

  const handleRemoveImage = (image) => {
    if (image.type === 'existing') {
      setExistingImages(prev => prev.filter(img => img.id !== image.id));
      setDeletedImageIds(prev => [...prev, image.id]);
    } else {
      setNewImagePreviews(prev => prev.filter((_, i) => i !== image.index));
      setNewImageFiles(prev => prev.filter((_, i) => i !== image.index));
    }
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!formData.safetyCheck) return alert("Please confirm safety check.");
    if (!formData.pickupAddress || !formData.dropAddress) return alert("Please select locations.");
    if (formData.declaredValue > 50000) return alert("Declared value exceeds limit.");
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        const val = formData[key] !== null && formData[key] !== undefined ? formData[key] : '';
        formDataToSend.append(key, val);
      });
      newImageFiles.forEach(file => formDataToSend.append('images', file));

      let url = `${API_URL}/packages/draft`;
      let method = 'POST';

      if (editId) {
        url = `${API_URL}/packages/${editId}`; 
        method = 'PUT';
        deletedImageIds.forEach(id => formDataToSend.append('deletedImageIds', id));
      }

      const res = await fetch(url, { 
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend 
      });

      const data = await res.json();
      if (data.success) {
        const targetId = editId ? editId : data.data.publicId;
        router.push(`/sender/send/checkout/${targetId}`); 
      } else {
        alert(data.message || "Failed to save draft");
      }
    } catch (error) { console.error(error); alert("Failed to save shipment."); }
  };

  return (
    <div className="send-package-container">
      <div className="page-header"><h1>{editId ? 'Edit Package' : 'Send a Package'}</h1><p>Fill in the details below to match with a local courier.</p></div>
      <div className="dashboard-grid">
        
        <div className="main-content">
          <div className="card form-section">
            <div className="section-header-group"><div className="section-badge">1</div><h2 className="section-title">Package Details</h2></div>
            <div className="form-group">
              <label>What are you sending?</label>
              <input type="text" name="title" value={formData.title} className="input-text" onChange={handleChange} placeholder="e.g. Office Keys" />
            </div>
            <div className="form-group">
              <label>Description & Instructions</label>
              <textarea name="description" value={formData.description} placeholder="Details..." className="input-textarea" rows="3" onChange={handleChange} />
            </div>
            
            {/* GALLERY SECTION */}
            <div className="form-group">
              <label>Photos (Max 10)</label>
              <ImageGallery 
                images={galleryImages} 
                onRemove={handleRemoveImage}
                cloudName={cloudName} // Pass cloud name for formatting
                appendComponent={
                  galleryImages.length < 10 && (
                    <div 
                      onClick={() => fileInputRef.current.click()} 
                      style={{ 
                        margin: 0, width: '100%', height: '100%', aspectRatio: '1',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', 
                        justifyContent: 'center', border: '1px dashed var(--border-light)', 
                        borderRadius: '12px', cursor: 'pointer', background: 'var(--bg-page)',
                        transition: 'border-color 0.2s', color: 'var(--text-muted)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-main)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                    >
                      <input type="file" hidden ref={fileInputRef} accept="image/*" multiple onChange={handleImageUpload} />
                      <PhotoIcon className="icon-24" style={{ marginBottom: '4px' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Add Photo</span>
                    </div>
                  )
                }
              />
            </div>

            <div className="checkbox-group">
              <label className="checkbox-container"><input type="checkbox" name="isFragile" checked={formData.isFragile} onChange={handleChange} /><span className="checkmark"></span> Fragile</label>
              <label className="checkbox-container"><input type="checkbox" name="isLiquid" checked={formData.isLiquid} onChange={handleChange} /><span className="checkmark"></span> Liquid/Food</label>
            </div>
          </div>

          <div className="card form-section">
            <div className="section-header-group"><div className="section-badge">2</div><h2 className="section-title">Properties & Logistics</h2></div>
            <div className="row-2">
              <div className="form-group">
                <Dropdown label="Category" name="category" value={formData.category} options={categoryOptions} onChange={handleChange} />
                {formData.category === 'OTHER' && (
                  <div style={{marginTop: '12px', animation: 'fadeIn 0.3s ease'}}>
                    <label style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block'}}>Please Specify</label>
                    <input type="text" name="otherCategory" value={formData.otherCategory} onChange={handleChange} placeholder="e.g. Art Supplies" className="input-text" />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Weight (kg): {formData.weight}</label>
                <div className="range-wrapper">
                  <input type="range" name="weight" min="0.5" max="20" step="0.5" value={formData.weight} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Declared Value (₹)</label>
              <input type="number" min="0" name="declaredValue" placeholder="0" value={formData.declaredValue} onChange={handleChange} className="input-text" style={valueError?.type === 'error' ? {borderColor: '#EF4444'} : (valueError?.type === 'warning' ? {borderColor: '#F59E0B'} : {})} />
              {valueError && (
                <div style={{marginTop: '8px', padding: '10px', borderRadius: '8px', backgroundColor: valueError.type === 'error' ? '#FEF2F2' : '#FFFBEB', color: valueError.type === 'error' ? '#991B1B' : '#92400E', border: `1px solid ${valueError.type === 'error' ? '#FECACA' : '#FDE68A'}`, display: 'flex', alignItems: 'start', gap: '8px', fontSize: '0.85rem'}}>
                  {valueError.type === 'error' ? <XCircleIcon width={20} /> : <ExclamationTriangleIcon width={20} />}<span>{valueError.msg}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <label style={{margin:0}}>Dimensions (cm)</label>
                <span style={{fontSize:'0.8rem', color:'var(--brand-gold)', fontWeight:600}}>{formData.size.replace('_', ' ')}</span>
              </div>
              <div className="dimensions-grid">
                <div className="dim-input-wrapper"><span className="dim-label">L</span><input type="number" min="0" name="length" value={formData.length || ''} placeholder="0" onChange={handleCustomDimensionChange} className="input-text dim-input" /></div>
                <div className="dim-input-wrapper"><span className="dim-label">W</span><input type="number" min="0" name="breadth" value={formData.breadth || ''} placeholder="0" onChange={handleCustomDimensionChange} className="input-text dim-input" /></div>
                <div className="dim-input-wrapper"><span className="dim-label">H</span><input type="number" min="0" name="height" value={formData.height || ''} placeholder="0" onChange={handleCustomDimensionChange} className="input-text dim-input" /></div>
              </div>
            </div>
          </div>

          <div className="card form-section">
            <div className="section-header-group"><div className="section-badge">3</div><h2 className="section-title">Receiver Details</h2></div>
            <div className="row-2">
              <div className="form-group"><label><UserIcon /> Name</label><input type="text" name="receiverName" value={formData.receiverName} onChange={handleChange} className="input-text" /></div>
              <div className="form-group"><label><PhoneIcon /> Phone</label><input type="text" name="receiverPhone" value={formData.receiverPhone} onChange={handleChange} className="input-text" /></div>
            </div>
            <div className="form-group"><label><EnvelopeIcon /> Email (Optional)</label><input type="email" name="receiverEmail" value={formData.receiverEmail} onChange={handleChange} className="input-text" /></div>
            <label className="checkbox-container"><input type="checkbox" name="isGift" checked={formData.isGift} onChange={handleChange} /><span className="checkmark"></span> Is this a Gift? (Hide price)</label>
          </div>

          <div className="card form-section">
            <div className="section-header-group"><div className="section-badge">4</div><h2 className="section-title">Urgency & Timing</h2></div>
            <div className="urgency-grid">
              <div className={`urgency-card ${formData.urgency === 'URGENT' ? 'selected' : ''}`} onClick={() => handleUrgencySelect('URGENT')}><div className="u-icon"><BoltIcon className="icon-24" /></div><div className="u-content"><h3>Urgent (2 Hours)</h3><p>Immediate Dispatch.</p></div></div>
              <div className={`urgency-card ${formData.urgency === 'STANDARD' ? 'selected' : ''}`} onClick={() => handleUrgencySelect('STANDARD')}><div className="u-icon"><TruckIcon className="icon-24" /></div><div className="u-content"><h3>Standard (Today)</h3><p>Delivery by 9:00 PM.</p></div></div>
              <div className={`urgency-card ${formData.urgency === 'SCHEDULED' ? 'selected' : ''}`} onClick={() => handleUrgencySelect('SCHEDULED')}><div className="u-icon"><CalendarIcon className="icon-24" /></div><div className="u-content"><h3>Scheduled</h3><p>Pick a specific date.</p></div></div>
            </div>
            {formData.urgency === 'SCHEDULED' && <div className="form-group mt-4" style={{marginTop:'20px'}}><label>Select Pickup Date & Time</label><input type="datetime-local" name="scheduledDate" value={formData.scheduledDate} className="input-text" onChange={handleChange} /></div>}
          </div>
        </div>

        <div className="right-sidebar">
          <div className="card route-card sticky-card">
            <h2 className="section-title" style={{marginLeft: 0, marginBottom: '20px'}}>Route</h2>
            <div className="location-block"><div className="loc-dot start"></div><div className="loc-content"><label>Pickup Location</label><div className="address-input-group" onClick={() => setModalMode('pickup')}><div className="fake-input" title={formData.pickupAddress}>{formData.pickupAddress ? truncateAddress(formData.pickupAddress) : "Select Pickup Location"}</div><button className="btn-icon"><MapPinIcon className="icon-20" /></button></div></div></div>
            <div className="location-block"><div className="loc-dot end"></div><div className="loc-content"><label>Drop Location</label><div className="address-input-group" onClick={() => setModalMode('drop')}><div className="fake-input" title={formData.dropAddress}>{formData.dropAddress ? truncateAddress(formData.dropAddress) : "Select Drop Location"}</div><button className="btn-icon"><MapPinIcon className="icon-20" /></button></div></div></div>
            <hr className="divider" />
            <div className="safety-box"><ShieldCheckIcon className="icon-20" /><label className="checkbox-container small"><input type="checkbox" name="safetyCheck" checked={formData.safetyCheck} onChange={handleChange} /><span className="checkmark"></span>I confirm no illegal items.</label></div>
            
            <div className="cost-footer">
              <div className="cost-info">
                <span>Estimated Cost</span>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <strong className="price">₹ {isCalculating ? '...' : (price !== null ? price : '-')}</strong>
                  <button onClick={calculatePrice} title="Estimate Again" className="refresh-price-btn" disabled={isCalculating || !formData.pickupLat}>
                    <ArrowPathIcon className={`icon-16 ${isCalculating ? 'spin' : ''}`} />
                  </button>
                </div>
              </div>
              <button className="btn-find" onClick={handleSubmit} disabled={!formData.safetyCheck || !price || (valueError?.type === 'error')}>
                {editId ? 'Save Changes' : 'Proceed'} <ArrowRightIcon className="icon-20" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {modalMode && <LocationModal mode={modalMode} savedAddresses={savedAddresses} onClose={() => setModalMode(null)} onConfirm={handleLocationConfirm} />}
    </div>
  );
}