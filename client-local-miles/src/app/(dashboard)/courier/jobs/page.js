'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  MagnifyingGlassIcon, CubeIcon, DocumentTextIcon, ClockIcon, 
  ComputerDesktopIcon, StarIcon
} from '@heroicons/react/24/outline';
import { MapPinIcon as MapPinSolid } from '@heroicons/react/24/solid';

// Components
import Skeleton from '@/components/ui/Skeleton';
import ToastNotification from '@/components/ui/ToastNotification';
import '@/styles/CourierJobsPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Dynamically import the NEW Reusable Map safely
const CourierMap = dynamic(() => import('@/components/ui/CourierMap'), { 
  ssr: false, 
  loading: () => <Skeleton width="100%" height="100%" borderRadius="0" /> 
});

// Haversine Distance Calculator (km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Map backend categories to icons
const getCategoryIcon = (category) => {
  switch(category) {
    case 'DOCUMENTS': return DocumentTextIcon;
    case 'ELECTRONICS': return ComputerDesktopIcon;
    case 'FOOD': return CubeIcon; 
    default: return CubeIcon;
  }
};

export default function CourierJobsPage() {
  const { theme } = useTheme();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Refs for auto-scrolling the list
  const cardRefs = useRef({});

  // 1. Get User Location & Fetch Jobs
  useEffect(() => {
    const fetchJobs = async (userLat, userLng) => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/packages/available`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          const processedJobs = data.data.map(job => {
            let distanceToPickup = 0;
            let isRecommended = false;

            if (userLat && userLng) {
              distanceToPickup = calculateDistance(userLat, userLng, job.pickupLat, job.pickupLng);
              isRecommended = distanceToPickup < 5; // Recommend if within 5km
            }

            return {
              ...job,
              distanceToPickup,
              isRecommended,
              displayDistance: distanceToPickup ? `${distanceToPickup.toFixed(1)}km away` : 'Distance unknown',
              icon: getCategoryIcon(job.category)
            };
          });

          // Sort: Recommended first, then by closest distance
          processedJobs.sort((a, b) => b.isRecommended - a.isRecommended || a.distanceToPickup - b.distanceToPickup);
          setJobs(processedJobs);
        }
      } catch (error) {
        setToast({ show: true, message: "Failed to load jobs.", type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          fetchJobs(pos.coords.latitude, pos.coords.longitude);
        },
        () => fetchJobs(null, null) 
      );
    } else {
      fetchJobs(null, null);
    }
  }, []);

  // 2. Search Filtering
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Sync Map -> List (Marker click handling)
  const handleMarkerClick = (jobId) => {
    setSelectedJobId(jobId);
    if (cardRefs.current[jobId]) {
      cardRefs.current[jobId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // --- SKELETONS ---
  const renderSkeletons = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Skeleton width="48px" height="48px" circle={true} />
            <div style={{ flex: 1 }}>
              <Skeleton width="60%" height="20px" style={{ marginBottom: '8px' }} />
              <Skeleton width="40%" height="14px" />
            </div>
            <Skeleton width="60px" height="24px" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`page-container jobs-page fade-in`}>
      
      {/* --- LEFT PANEL: REUSABLE MAP --- */}
      <div className="jobs-map-panel">
        <CourierMap 
          theme={theme} 
          jobs={filteredJobs} 
          userLocation={userLocation} 
          selectedJobId={selectedJobId}
          onMarkerClick={handleMarkerClick}
          zoomControl={false}
        />

        {/* Custom Overlays */}
        <div className="map-overlay-container">
          <div className="controls-column">
            <button className="btn-map-control" title="My Location" onClick={() => {
              if (userLocation) setToast({ show: true, message: "Location active", type: 'info' });
              else setToast({ show: true, message: "Location not available", type: 'warning' });
            }}>
              <MapPinSolid style={{ width: 20 }} />
            </button>
          </div>

          <div className="map-legend">
            <div className="legend-item"><div className="dot-legend dot-gold"></div><span>Best Match</span></div>
            <div className="legend-item"><div className="dot-legend dot-grey"></div><span>Others</span></div>
            <div className="legend-item"><div className="dot-legend dot-blue" style={{background: '#3B82F6'}}></div><span>You</span></div>
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: JOBS LIST --- */}
      <div className="jobs-list-panel">
        
        <div className="jobs-header">
          <div className="search-bar">
            <MagnifyingGlassIcon style={{ width: 20 }} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search pickup locations..." 
              className="search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="jobs-scroll-area">
          {loading ? renderSkeletons() : filteredJobs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}>
              <CubeIcon style={{ width: 48, margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No available jobs found matching your search.</p>
            </div>
          ) : (
            <>
              {/* RECOMMENDED SECTION */}
              {filteredJobs.filter(j => j.isRecommended).length > 0 && (
                <>
                  <div className="section-label">
                    <span>Recommended for You</span>
                    <StarIcon style={{ width: 14, color: '#D4AF37' }} />
                  </div>
                  {filteredJobs.filter(j => j.isRecommended).map(job => (
                    <div 
                      key={job.id} 
                      ref={el => cardRefs.current[job.id] = el}
                      className={`job-card-recommended ${selectedJobId === job.id ? 'selected' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      {selectedJobId === job.id && <div className="selected-ring"></div>}
                      <div className="match-badge">Nearby</div>
                      <div className="rec-header">
                        <div className="rec-icon-circle"><job.icon style={{ width: 24 }} /></div>
                        <div className="rec-content">
                          <h4 className="rec-title">{job.title}</h4>
                          <p className="rec-sub">{job.pickupAddress.split(',')[0]} • {job.weight}kg</p>
                        </div>
                        <div className="rec-price">₹{job.price.toFixed(0)}</div>
                      </div>
                      <div className="rec-footer">
                        <div className="pill-detour"><div style={{width: 12}}><MapPinSolid /></div> {job.displayDistance}</div>
                        <div className="pill-time"><ClockIcon style={{width: 16}} /> {job.distanceKm}km Route</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* STANDARD SECTION */}
              {filteredJobs.filter(j => !j.isRecommended).length > 0 && (
                <>
                  <div className="section-label" style={{ marginTop: '16px' }}>All Nearby Jobs</div>
                  {filteredJobs.filter(j => !j.isRecommended).map(job => (
                    <div 
                      key={job.id} 
                      ref={el => cardRefs.current[job.id] = el}
                      className={`job-card-standard ${selectedJobId === job.id ? 'selected' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <div className="std-left">
                        <div className="std-icon-box"><job.icon style={{ width: 22 }} /></div>
                        <div className="std-info">
                          <h4>{job.title}</h4>
                          <p>{job.displayDistance} • {job.pickupAddress.split(',')[0]}</p>
                        </div>
                      </div>
                      <div className="std-price">₹{job.price.toFixed(0)}</div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}