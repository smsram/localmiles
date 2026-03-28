'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTheme } from '@/components/providers/ThemeProvider'; 
import { 
  BriefcaseIcon, HomeIcon, TruckIcon, MapPinIcon, CheckIcon, TrashIcon, XMarkIcon, PencilSquareIcon, BookmarkIcon
} from '@heroicons/react/24/solid';
import { ArchiveBoxIcon, MapIcon } from '@heroicons/react/24/outline'; 

// Components
import ToastNotification from '@/components/ui/ToastNotification';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Skeleton from '@/components/ui/Skeleton';
import MapPicker from '@/components/ui/MapPicker';

import '@/styles/CourierRoutePage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- DYNAMICALLY IMPORT THE WHOLE MAP COMPONENT safely ---
const CourierMap = dynamic(() => import('@/components/ui/CourierMap'), { 
  ssr: false,
  loading: () => <Skeleton width="100%" height="100%" borderRadius="0" /> // Shows a nice skeleton while map loads
});

// --- SAVED ADDRESSES MODAL ---
function SavedAddressModal({ mode, savedAddresses, onClose, onConfirm }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  return (
    <div className="saved-address-overlay" onClick={onClose}>
      <div className="saved-address-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h3>Saved Addresses</h3>
          <button onClick={onClose} className="sheet-close-btn"><XMarkIcon className="icon-24" /></button>
        </div>
        <div className="sheet-body">
          <div className="saved-list-scroll">
            {savedAddresses.length === 0 && <div className="empty-saved-state"><p className="text-muted">No saved addresses found.</p></div>}
            {savedAddresses.map(addr => (
              <div key={addr.id} className="saved-list-item" onClick={() => onConfirm({ address: addr.address, lat: addr.lat, lng: addr.lng })}>
                <div className="saved-icon-wrapper">{addr.type === 'home' ? <HomeIcon className="icon-20" /> : <BriefcaseIcon className="icon-20" />}</div>
                <div className="saved-details-wrapper"><strong>{addr.title}</strong><p>{addr.address}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function CourierRoutePage() {
  const { theme } = useTheme(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit'); 

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  
  const [pickingMode, setPickingMode] = useState(null);
  const [savedModalMode, setSavedModalMode] = useState(null);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  
  const [mapPath, setMapPath] = useState([]);

  const defaultFormData = {
    pickupAddress: '', pickupLat: null, pickupLng: null,
    dropoffAddress: '', dropoffLat: null, dropoffLng: null,
    time: '', isRecurring: false, detour: 2.5, vehicle: 'backpack'
  };
  const [formData, setFormData] = useState(defaultFormData);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const addrRes = await fetch(`${API_URL}/addresses`, { headers: { 'Authorization': `Bearer ${token}` } });
      const addrData = await addrRes.json();
      if (addrData.success) setSavedAddresses(addrData.data);

      const routeRes = await fetch(`${API_URL}/courier-routes`, { headers: { 'Authorization': `Bearer ${token}` } });
      const routeData = await routeRes.json();
      if (routeData.success) setRoutes(routeData.data);
    } catch (error) { console.error("Error fetching data"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (editId && routes.length > 0) {
      const routeToEdit = routes.find(r => r.id === editId);
      if (routeToEdit) {
        setFormData({
          pickupAddress: routeToEdit.pickupAddress, pickupLat: routeToEdit.pickupLat, pickupLng: routeToEdit.pickupLng,
          dropoffAddress: routeToEdit.dropoffAddress, dropoffLat: routeToEdit.dropoffLat, dropoffLng: routeToEdit.dropoffLng,
          time: routeToEdit.time, isRecurring: routeToEdit.isRecurring, 
          detour: routeToEdit.maxDetourKm, vehicle: routeToEdit.vehicleCapacity
        });
      }
    } else if (!editId) {
      setFormData(defaultFormData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, routes]);

  useEffect(() => {
    const fetchPath = async () => {
      if (formData.pickupLat && formData.dropoffLat) {
        try {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${formData.pickupLng},${formData.pickupLat};${formData.dropoffLng},${formData.dropoffLat}?overview=full&geometries=geojson`;
          const res = await fetch(osrmUrl);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            setMapPath(data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]));
          }
        } catch (e) { console.error("OSRM Error"); }
      } else {
        setMapPath([]);
      }
    };
    fetchPath();
  }, [formData.pickupLat, formData.dropoffLat, formData.pickupLng, formData.dropoffLng]);

  const handleMapClick = async (latlng) => {
    if (!pickingMode) return;
    const { lat, lng } = latlng;
    
    setToast({ show: true, message: "Fetching address...", type: 'info' });
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const address = data.display_name || "Selected Location";

      if (pickingMode === 'pickup') {
        setFormData(prev => ({ ...prev, pickupAddress: address, pickupLat: lat, pickupLng: lng }));
      } else {
        setFormData(prev => ({ ...prev, dropoffAddress: address, dropoffLat: lat, dropoffLng: lng }));
      }
      setToast({ show: true, message: "Location set successfully!", type: 'success' });
    } catch (err) {
      if (pickingMode === 'pickup') setFormData(prev => ({ ...prev, pickupAddress: "Selected on Map", pickupLat: lat, pickupLng: lng }));
      else setFormData(prev => ({ ...prev, dropoffAddress: "Selected on Map", dropoffLat: lat, dropoffLng: lng }));
      setToast({ show: true, message: "Coordinates saved.", type: 'success' });
    } finally {
      setPickingMode(null);
    }
  };

  const handleSavedAddressConfirm = (loc) => {
    if (savedModalMode === 'pickup') setFormData(prev => ({ ...prev, pickupAddress: loc.address, pickupLat: loc.lat, pickupLng: loc.lng }));
    else setFormData(prev => ({ ...prev, dropoffAddress: loc.address, dropoffLat: loc.lat, dropoffLng: loc.lng }));
    setSavedModalMode(null);
  };

  const handleSaveRoute = async () => {
    if (!formData.pickupLat || !formData.dropoffLat || !formData.time) {
      return setToast({ show: true, message: "Please fill in Start, Destination, and Time", type: 'error' });
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = editId ? `${API_URL}/courier-routes/${editId}` : `${API_URL}/courier-routes`;
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, maxDetourKm: formData.detour, vehicleCapacity: formData.vehicle })
      });
      const data = await res.json();

      if (data.success) {
        setToast({ show: true, message: `Route ${editId ? 'updated' : 'saved'} successfully!`, type: 'success' });
        router.push('/courier/route');
        setFormData(defaultFormData);
        fetchData();
      } else {
        setToast({ show: true, message: data.message || "Failed to save route", type: 'error' });
      }
    } catch (err) { setToast({ show: true, message: "Network error", type: 'error' }); } 
    finally { setSubmitting(false); }
  };

  const toggleRouteStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/courier-routes/${id}/toggle`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      setRoutes(prev => prev.map(r => r.id === id ? { ...r, isActive: !currentStatus } : r));
    } catch (err) {}
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/courier-routes/${confirmModal.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setToast({ show: true, message: "Route deleted", type: 'success' });
        setRoutes(prev => prev.filter(r => r.id !== confirmModal.id));
        if (editId === confirmModal.id) router.push('/courier/route'); 
      }
      setConfirmModal({ isOpen: false, id: null });
    } catch (err) {}
  };

  return (
    <div className="page-container courier-route-page fade-in">
      <div className="route-form-panel">
        <div className="panel-header"><h1 className="panel-title">Courier Route Manager</h1></div>

        <div className="form-section-title">{editId ? 'Edit Route' : 'Plan a New Route'}</div>
        
        {/* START LOCATION INPUT */}
        <div className="form-group">
          <label className="form-label">Start Location</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div 
              className={`input-field ${pickingMode === 'pickup' ? 'picking-active' : ''}`} 
              style={{ cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1, borderColor: pickingMode === 'pickup' ? 'var(--brand-gold)' : 'var(--border-light)' }} 
              onClick={() => setPickingMode(pickingMode === 'pickup' ? null : 'pickup')}
            >
              {pickingMode === 'pickup' ? <span style={{color: 'var(--brand-gold)'}}>Click on map to select...</span> : 
               formData.pickupAddress ? formData.pickupAddress : <span style={{color: 'var(--text-muted)'}}><MapIcon className="icon-16 inline" /> Pick on map</span>}
            </div>
            <button onClick={() => setSavedModalMode('pickup')} style={{ padding: '0 12px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-main)' }} title="Saved Addresses">
              <BookmarkIcon width={20} />
            </button>
          </div>
        </div>

        {/* DESTINATION INPUT */}
        <div className="form-group">
          <label className="form-label">Destination</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div 
              className={`input-field ${pickingMode === 'dropoff' ? 'picking-active' : ''}`} 
              style={{ cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1, borderColor: pickingMode === 'dropoff' ? 'var(--brand-gold)' : 'var(--border-light)' }} 
              onClick={() => setPickingMode(pickingMode === 'dropoff' ? null : 'dropoff')}
            >
              {pickingMode === 'dropoff' ? <span style={{color: 'var(--brand-gold)'}}>Click on map to select...</span> : 
               formData.dropoffAddress ? formData.dropoffAddress : <span style={{color: 'var(--text-muted)'}}><MapIcon className="icon-16 inline" /> Pick on map</span>}
            </div>
            <button onClick={() => setSavedModalMode('dropoff')} style={{ padding: '0 12px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-main)' }} title="Saved Addresses">
              <BookmarkIcon width={20} />
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Time</label>
          <div className="time-group">
            <div className="time-input-wrapper">
              <input type="time" className="input-field" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
            </div>
            <label className="checkbox-wrapper">
              <input type="checkbox" className="custom-checkbox-input" checked={formData.isRecurring} onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})} />
              <div className="custom-checkbox-box"><CheckIcon className="checkmark-icon" /></div>
              <span className="checkbox-text">Recurring</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <div className="slider-header"><span className="form-label">Max Detour</span><span className="highlight-val">{formData.detour} km</span></div>
          <div className="slider-container">
            <input type="range" min="0.5" max="5" step="0.5" className="range-slider" value={formData.detour} onChange={(e) => setFormData({...formData, detour: e.target.value})} />
            <div className="slider-labels"><span>0.5 km</span><span>5 km</span></div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Vehicle Capacity</label>
          <div className="vehicle-options">
            <div className={`vehicle-btn ${formData.vehicle === 'backpack' ? 'active' : ''}`} onClick={() => setFormData({...formData, vehicle: 'backpack'})}>
              <ArchiveBoxIcon style={{width: 18}} /> Backpack
            </div>
            <div className={`vehicle-btn ${formData.vehicle === 'trunk' ? 'active' : ''}`} onClick={() => setFormData({...formData, vehicle: 'trunk'})}>
              <TruckIcon style={{width: 18}} /> Trunk
            </div>
          </div>
        </div>

        <div style={{display: 'flex', gap: '10px', marginTop: '16px'}}>
          {editId && (
            <button className="btn-save-route" style={{background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)', marginTop: 0}} onClick={() => router.push('/courier/route')}>Cancel</button>
          )}
          <button className="btn-save-route" style={{marginTop: 0}} onClick={handleSaveRoute} disabled={submitting || pickingMode}>
            {submitting ? 'Saving...' : (editId ? 'Update Route' : 'Save Route')}
          </button>
        </div>

        <div className="form-section-title" style={{marginTop: '32px'}}>My Commutes</div>
        
        <div className="commute-list">
          {loading ? (
            Array.from({length: 2}).map((_, i) => (
              <div key={i} className="commute-card">
                <Skeleton width="44px" height="44px" borderRadius="10px" />
                <div style={{flex: 1, marginLeft: '16px'}}>
                  <Skeleton width="120px" height="16px" style={{marginBottom: '6px'}}/>
                  <Skeleton width="80px" height="12px" />
                </div>
              </div>
            ))
          ) : routes.length === 0 ? (
            <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>No active routes saved.</p>
          ) : (
            routes.map(route => (
              <div key={route.id} className={`commute-card ${route.isActive ? 'active' : ''}`}>
                <div className="commute-info">
                  <div className="commute-icon-box">
                    {route.title.toLowerCase().includes('home') ? <HomeIcon style={{width: 20}} /> : <BriefcaseIcon style={{width: 20}} />}
                  </div>
                  <div className="commute-text" style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    <h4>{route.title}</h4>
                    <p>{route.time} {route.isRecurring ? '(Daily)' : ''}</p>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <label className="switch" style={{marginRight: '4px'}}>
                    <input type="checkbox" checked={route.isActive} onChange={() => toggleRouteStatus(route.id, route.isActive)} />
                    <span className="slider"></span>
                  </label>
                  <button onClick={() => router.push(`?edit=${route.id}`)} title="Edit Route" style={{background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px'}}>
                    <PencilSquareIcon width={20} />
                  </button>
                  <button onClick={() => setConfirmModal({isOpen: true, id: route.id})} title="Delete Route" style={{background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px'}}>
                    <TrashIcon width={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="map-panel" style={{ cursor: pickingMode ? 'crosshair' : 'grab', position: 'relative' }}>
        
        {/* INSTRUCTION BANNER WHEN PICKING */}
        {pickingMode && (
          <div style={{
            position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
            background: 'var(--brand-gold)', color: '#171717', padding: '10px 20px', borderRadius: '24px',
            fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeInDown 0.3s ease'
          }}>
            <MapPinIcon width={18} /> Click anywhere on the map to set {pickingMode === 'pickup' ? 'Start Location' : 'Destination'}
            <XMarkIcon width={20} style={{marginLeft: '8px', cursor: 'pointer'}} onClick={() => setPickingMode(null)} />
          </div>
        )}

        <CourierMap 
          theme={theme}
          pickupLat={formData.pickupLat} pickupLng={formData.pickupLng}
          dropoffLat={formData.dropoffLat} dropoffLng={formData.dropoffLng}
          mapPath={mapPath}
          onMapClick={handleMapClick}
        />
        
        <div className="route-info-card">
          <div className="route-info-title">
            <div className="legend-dot" style={{background: theme === 'dark' ? '#D4AF37' : '#3B82F6'}}></div>
            {mapPath.length > 0 ? 'Draft Route Active' : 'Waiting for locations...'}
          </div>
          <div className="route-info-sub">
            <div className="legend-dot" style={{background: 'var(--border-light)'}}></div>
            Detour Buffer ({formData.detour} km)
          </div>
        </div>
      </div>

      {savedModalMode && <SavedAddressModal mode={savedModalMode} savedAddresses={savedAddresses} onClose={() => setSavedModalMode(null)} onConfirm={handleSavedAddressConfirm} />}
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({isOpen: false, id: null})} onConfirm={handleDelete} title="Delete Route" message="Are you sure you want to delete this route?" confirmText="Delete" cancelText="Cancel" isDanger={true} />
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}