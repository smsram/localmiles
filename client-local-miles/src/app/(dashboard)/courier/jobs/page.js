'use client';
import { useState, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  MagnifyingGlassIcon,
  CubeIcon,
  DocumentTextIcon,
  ClockIcon,
  MapPinIcon,
  ComputerDesktopIcon,
  GiftIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { 
  PlusIcon,
  MinusIcon,
  MapPinIcon as MapPinSolid 
} from '@heroicons/react/24/solid';

// Import Styles
import '@/styles/CourierJobsPage.css';

// --- MOCK DATA ---
const jobs = [
  {
    id: 1,
    title: 'Box of Books',
    sub: 'Central Library • 4kg',
    price: 220,
    isRecommended: true,
    detour: '+1.2km detour',
    time: '15 mins',
    lat: 19.0760, lng: 72.8777
  },
  {
    id: 2,
    title: 'Legal Documents',
    sub: '2.5km away • Law Firm',
    price: 140,
    isRecommended: false,
    icon: DocumentTextIcon,
    lat: 19.0800, lng: 72.8900
  },
  {
    id: 3,
    title: 'Electronics Parts',
    sub: '0.8km away • Tech Hub',
    price: 310,
    isRecommended: false,
    icon: ComputerDesktopIcon,
    lat: 19.1000, lng: 72.9000
  },
  {
    id: 4,
    title: 'Bouquet Delivery',
    sub: '3.2km away • Florist',
    price: 90,
    isRecommended: false,
    icon: GiftIcon,
    lat: 19.1100, lng: 72.8500
  },
  {
    id: 5,
    title: 'Lunch Box',
    sub: '1.5km away • Home Chef',
    price: 65,
    isRecommended: false,
    icon: CubeIcon,
    lat: 19.1200, lng: 72.8600
  }
];

// --- MAP CONFIG ---
const containerStyle = { width: '100%', height: '100%' };
const center = { lat: 19.0960, lng: 72.8777 }; 

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b9" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

export default function CourierJobsPage() {
  const { theme } = useTheme();
  const [selectedJob, setSelectedJob] = useState(null);

  // Dynamic Map Options
  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    styles: theme === 'dark' ? darkMapStyles : [
       { featureType: "poi", stylers: [{ visibility: "off" }] }
    ]
  }), [theme]);

  return (
    <div className={`page-container jobs-page ${theme}`}>
      
      {/* --- LEFT PANEL: MAP --- */}
      <div className="jobs-map-panel">
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={12}
            options={mapOptions}
          >
            {jobs.map(job => (
              <Marker 
                key={job.id}
                position={{ lat: job.lat, lng: job.lng }}
                // Logic: Red markers for recommended, Blue for others (Standard Google Icons)
                icon={job.isRecommended 
                  ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" 
                  : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"}
              />
            ))}
          </GoogleMap>
        </LoadScript>

        {/* Custom Overlays */}
        <div className="map-overlay-container">
          <div className="controls-column">
            <button className="btn-map-control">
              <MapPinSolid style={{ width: 20 }} />
            </button>
            <div className="zoom-group">
              <button className="btn-zoom"><PlusIcon style={{ width: 20 }} /></button>
              <button className="btn-zoom"><MinusIcon style={{ width: 20 }} /></button>
            </div>
          </div>

          <div className="map-legend">
            <div className="legend-item">
              <div className="dot-legend dot-gold"></div>
              <span>Best Match</span>
            </div>
            <div className="legend-item">
              <div className="dot-legend dot-grey"></div>
              <span>Others</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: JOBS LIST --- */}
      <div className="jobs-list-panel">
        
        <div className="jobs-header">
          <div className="search-bar">
            <MagnifyingGlassIcon style={{ width: 20 }} className="search-icon" />
            <input type="text" placeholder="Search locations or items..." className="search-input" />
          </div>
        </div>

        <div className="jobs-scroll-area">
          <div className="section-label">
            <span>Recommended for You</span>
            <StarIcon style={{ width: 14, color: '#D4AF37' }} />
          </div>

          {jobs.filter(j => j.isRecommended).map(job => (
            <div key={job.id} className="job-card-recommended">
              <div className="match-badge">98% Match</div>
              <div className="rec-header">
                <div className="rec-icon-circle">
                  <CubeIcon style={{ width: 24 }} />
                </div>
                <div className="rec-content">
                  <h4 className="rec-title">{job.title}</h4>
                  <p className="rec-sub">{job.sub}</p>
                </div>
                <div className="rec-price">₹{job.price}</div>
              </div>
              <div className="rec-footer">
                <div className="pill-detour">
                  <div style={{width: 12}}><MapPinSolid /></div> 
                  {job.detour}
                </div>
                <div className="pill-time">
                  <ClockIcon style={{width: 16}} /> 
                  {job.time}
                </div>
              </div>
            </div>
          ))}

          <div className="section-label" style={{ marginTop: '16px' }}>All Nearby Jobs (24)</div>

          {jobs.filter(j => !j.isRecommended).map(job => (
            <div key={job.id} className="job-card-standard">
              <div className="std-left">
                <div className="std-icon-box">
                  <job.icon style={{ width: 22 }} />
                </div>
                <div className="std-info">
                  <h4>{job.title}</h4>
                  <p>{job.sub}</p>
                </div>
              </div>
              <div className="std-price">₹{job.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}