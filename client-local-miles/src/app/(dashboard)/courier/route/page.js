'use client';
import { useState, useMemo } from 'react'; // Added useMemo for map styles
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { useTheme } from '@/components/providers/ThemeProvider'; // Assuming you have a theme hook
import { 
  BriefcaseIcon, 
  HomeIcon, 
  TruckIcon, 
  PlusIcon, 
  MapPinIcon,
  CheckIcon 
} from '@heroicons/react/24/solid';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline'; 

import '@/styles/CourierRoutePage.css';

// --- MAP CONFIG ---
const containerStyle = { width: '100%', height: '100%' };
const center = { lat: 19.0760, lng: 72.8777 }; 
const path = [
  { lat: 19.0760, lng: 72.8777 },
  { lat: 19.0800, lng: 72.8900 },
  { lat: 19.1000, lng: 72.9000 },
  { lat: 19.1200, lng: 72.8500 }
];

// Dark Mode Map JSON
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b9" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

export default function CourierRoutePage() {
  const { theme } = useTheme(); // Access current theme
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    time: '',
    isRecurring: false,
    detour: 2.5,
    vehicle: 'backpack'
  });

  const [commutes, setCommutes] = useState([
    { id: 1, title: 'Home to Office', sub: 'Daily at 9:00 AM', active: false, icon: HomeIcon },
    { id: 2, title: 'Office to Home', sub: 'Daily at 6:00 PM', active: true, icon: BriefcaseIcon }
  ]);

  // Memoize map options to prevent re-renders and handle theme switching
  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: false,
    styles: theme === 'dark' ? darkMapStyles : [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
    ]
  }), [theme]);

  const toggleCommute = (id) => {
    setCommutes(prev => prev.map(c => 
      c.id === id ? { ...c, active: !c.active } : c
    ));
  };

  return (
    <div className="page-container courier-route-page">
      <div className="route-form-panel">
        <div className="panel-header">
          <h1 className="panel-title">Courier Route Manager</h1>
        </div>

        <div className="form-section-title">Plan a New Route</div>
        
        <div className="form-group">
          <label className="form-label">Start Location</label>
          <input 
            type="text" 
            placeholder="Enter pickup address" 
            className="input-field"
            value={formData.pickup}
            onChange={(e) => setFormData({...formData, pickup: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Destination</label>
          <input 
            type="text" 
            placeholder="Enter drop-off address" 
            className="input-field"
            value={formData.dropoff}
            onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Time</label>
          <div className="time-group">
            <div className="time-input-wrapper">
              <input 
                type="time" 
                className="input-field"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>
            
            <label className="checkbox-wrapper">
              <input 
                type="checkbox" 
                className="custom-checkbox-input"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
              />
              <div className="custom-checkbox-box">
                <CheckIcon className="checkmark-icon" />
              </div>
              <span className="checkbox-text">Recurring</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <div className="slider-header">
            <span className="form-label">Max Detour</span>
            <span className="highlight-val">{formData.detour} km</span>
          </div>
          <div className="slider-container">
            <input 
              type="range" 
              min="0.5" max="5" step="0.5"
              className="range-slider"
              value={formData.detour}
              onChange={(e) => setFormData({...formData, detour: e.target.value})}
            />
            <div className="slider-labels">
              <span>0.5 km</span>
              <span>5 km</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Vehicle Capacity</label>
          <div className="vehicle-options">
            <div 
              className={`vehicle-btn ${formData.vehicle === 'backpack' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, vehicle: 'backpack'})}
            >
              <ArchiveBoxIcon style={{width: 18}} /> Backpack
            </div>
            <div 
              className={`vehicle-btn ${formData.vehicle === 'trunk' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, vehicle: 'trunk'})}
            >
              <TruckIcon style={{width: 18}} /> Trunk
            </div>
          </div>
        </div>

        <button className="btn-save-route">Save Route</button>

        <div className="form-section-title" style={{marginTop: '32px'}}>My Commutes</div>
        
        <div className="commute-list">
          {commutes.map(commute => (
            <div key={commute.id} className={`commute-card ${commute.active ? 'active' : ''}`}>
              <div className="commute-info">
                <div className="commute-icon-box">
                  <commute.icon style={{width: 20}} />
                </div>
                <div className="commute-text">
                  <h4>{commute.title}</h4>
                  <p>{commute.sub}</p>
                </div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={commute.active}
                  onChange={() => toggleCommute(commute.id)}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="map-panel">
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={12}
            options={mapOptions}
          >
            <Marker position={path[0]} />
            <Marker position={path[path.length-1]} />
            <Polyline 
              path={path}
              options={{ 
                strokeColor: theme === 'dark' ? '#D4AF37' : '#3B82F6', 
                strokeOpacity: 0.8, 
                strokeWeight: 4, 
                strokeDasharray: [10, 10] 
              }} 
            />
          </GoogleMap>
        </LoadScript>

        <div className="map-controls">
          <button className="map-btn" title="Current Location">
            <MapPinIcon style={{width: 20}} />
          </button>
          <button className="map-btn" title="Zoom In">
            <PlusIcon style={{width: 20}} />
          </button>
        </div>

        <div className="route-info-card">
          <div className="route-info-title">
            <div className="legend-dot" style={{background: theme === 'dark' ? '#D4AF37' : '#3B82F6'}}></div>
            Active Route (12.4 km)
          </div>
          <div className="route-info-sub">
            <div className="legend-dot" style={{background: 'var(--border-light)'}}></div>
            Detour Buffer ({formData.detour} km)
          </div>
        </div>
      </div>
    </div>
  );
}