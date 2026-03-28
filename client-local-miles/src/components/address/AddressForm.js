'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, MapPinIcon, HomeIcon, 
  BuildingOfficeIcon, HeartIcon, UserIcon, 
  PhoneIcon, EnvelopeIcon 
} from '@heroicons/react/24/outline';
import MapPicker from '@/components/ui/MapPicker'; 
import ToastNotification from '@/components/ui/ToastNotification';
import Skeleton from '@/components/ui/Skeleton';
import '@/styles/CreateAddress.css'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddressForm({ addressId }) {
  const router = useRouter();
  const isEditMode = !!addressId;
  
  const [loading, setLoading] = useState(isEditMode); 
  const [submitting, setSubmitting] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    title: '', type: 'home', 
    line1: '', line2: '', city: '', pincode: '',
    contactName: '', contactPhone: '', contactEmail: '', 
    isDefault: false, lat: 12.9716, lng: 77.5946, addressText: '' 
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchAddress = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/addresses/${addressId}`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (data.success) {
            const addr = data.data;
            setFormData({
              title: addr.title, type: addr.type, line1: addr.line1 || '', line2: addr.line2 || '',
              city: addr.city || '', pincode: addr.pincode || '', contactName: addr.contactName || '',
              contactPhone: addr.contactPhone || '', contactEmail: addr.contactEmail || '', 
              isDefault: addr.isDefault, lat: addr.lat, lng: addr.lng, addressText: addr.address
            });
          } else {
            setToast({ show: true, message: "Address not found", type: 'error' });
            setTimeout(() => router.push('/sender/address'), 1500);
          }
        } catch (error) {
          setToast({ show: true, message: "Network error", type: 'error' });
        } finally {
          setLoading(false);
        }
      };
      fetchAddress();
    } else {
      handleCurrentLocation(true);
    }
  }, [addressId, isEditMode, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLocationSelect = async (loc) => {
    setFormData(prev => ({ ...prev, lat: loc.lat, lng: loc.lng }));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`);
      const data = await res.json();
      
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || '';
        const areaParts = [];
        if (addr.road) areaParts.push(addr.road);
        if (addr.neighbourhood) areaParts.push(addr.neighbourhood);
        if (addr.suburb) areaParts.push(addr.suburb);
        if (addr.village || addr.hamlet) areaParts.push(addr.village || addr.hamlet);
        
        const uniqueAreaParts = [...new Set(areaParts)].filter(part => part !== city);

        setFormData(prev => ({
          ...prev,
          line2: uniqueAreaParts.join(', '), 
          city: city, 
          pincode: addr.postcode || '',
          addressText: data.display_name
        }));
      }
    } catch (err) {
      console.error("Reverse Geocoding Failed:", err);
    }
  };

  const handleCurrentLocation = (isAutoLoad = false) => {
    if (!navigator.geolocation) {
      if (!isAutoLoad) setToast({ show: true, message: "Geolocation not supported", type: 'error' });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSelect({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoLoading(false);
      },
      (error) => {
        if (!isAutoLoad) setToast({ show: true, message: "Location permission denied or unavailable.", type: 'error' });
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const finalAddress = formData.addressText || [formData.line1, formData.line2, formData.city].filter(Boolean).join(', ');
      const addressPayload = { ...formData, address: finalAddress };

      const endpoint = isEditMode ? `${API_URL}/addresses/${addressId}` : `${API_URL}/addresses`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addressPayload)
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ show: true, message: `Address ${isEditMode ? 'updated' : 'saved'} successfully!`, type: 'success' });
        setTimeout(() => router.push('/sender/address'), 1000); 
      } else {
        setToast({ show: true, message: data.message || "Failed to save address", type: 'error' });
      }
    } catch (error) {
      setToast({ show: true, message: "Network error occurred", type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-address-container" style={{ paddingTop: '40px' }}>
        <div className="header-row" style={{ marginBottom: '32px' }}>
            <Skeleton width="40px" height="40px" circle={true} />
            <Skeleton width="200px" height="32px" style={{ marginLeft: '12px' }} />
        </div>
        <div className="layout-grid">
           <div className="map-section">
              <Skeleton width="100%" height="300px" borderRadius="12px" />
              <Skeleton width="100%" height="40px" style={{ marginTop: '16px' }} />
           </div>
           <div className="form-section">
              <div className="skeleton-row" style={{ marginBottom: '24px' }}>
                 <Skeleton width="30%" height="45px" borderRadius="8px" />
                 <Skeleton width="30%" height="45px" borderRadius="8px" />
                 <Skeleton width="30%" height="45px" borderRadius="8px" />
              </div>
              {[1, 2, 3, 4].map(n => (
                 <div key={n} style={{ marginBottom: '20px' }}>
                    <Skeleton width="120px" height="14px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="100%" height="48px" borderRadius="8px" />
                 </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-address-container">
      <div className="header-row">
        <button onClick={() => router.back()} className="back-btn"><ArrowLeftIcon className="icon-20" /></button>
        <h1>{isEditMode ? 'Edit Address' : 'Add New Address'}</h1>
      </div>

      <div className="layout-grid">
        <div className="map-section">
          <div className="map-wrapper">
            <MapPicker lat={formData.lat} lng={formData.lng} onLocationSelect={handleLocationSelect} />
            <button type="button" className={`geo-btn ${geoLoading ? 'loading' : ''}`} onClick={() => handleCurrentLocation(false)} disabled={geoLoading}>
              <MapPinIcon className="icon-20" /> {geoLoading ? 'Locating...' : 'Use Current Location'}
            </button>
          </div>
          <div className="lat-lng-display">
            <small>Selected: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}</small>
            {formData.addressText && <p className="detected-address">{formData.addressText}</p>}
          </div>
        </div>

        <div className="form-section">
          <form onSubmit={handleSubmit}>
            <div className="type-selector">
              {['home', 'office', 'other'].map(t => (
                <button key={t} type="button" className={`type-btn ${formData.type === t ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, type: t }))}>
                  {t === 'home' ? <HomeIcon className="icon-20" /> : t === 'office' ? <BuildingOfficeIcon className="icon-20" /> : <HeartIcon className="icon-20" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label>Address Label *</label>
              <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. My Apartment" required />
            </div>

            <div className="row-2">
              <div className="form-group"><label>Flat / House No. (Optional)</label><input name="line1" value={formData.line1} onChange={handleChange} placeholder="Flat 4B" /></div>
              <div className="form-group"><label>Street / Area / Village *</label><input name="line2" value={formData.line2} onChange={handleChange} required /></div>
            </div>

            <div className="row-2">
              <div className="form-group"><label>City *</label><input name="city" value={formData.city} onChange={handleChange} required /></div>
              <div className="form-group"><label>Pincode *</label><input name="pincode" value={formData.pincode} onChange={handleChange} required /></div>
            </div>

            <hr className="divider" />

            <div className="form-group"><label><UserIcon className="icon-16 inline" /> Contact Name (Optional)</label><input name="contactName" value={formData.contactName} onChange={handleChange} placeholder="e.g. John Doe" /></div>
            <div className="form-group"><label><PhoneIcon className="icon-16 inline" /> Phone Number (Optional)</label><input name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="+91..." /></div>
            <div className="form-group"><label><EnvelopeIcon className="icon-16 inline" /> Email (Optional)</label><input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="name@example.com" /></div>

            <label className="checkbox-container">
              <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} />
              <span className="checkmark"></span> Set as default address
            </label>

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving...' : (isEditMode ? 'Update Address' : 'Save Address')}
            </button>
          </form>
        </div>
      </div>

      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}