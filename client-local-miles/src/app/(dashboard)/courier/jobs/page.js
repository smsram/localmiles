'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  MagnifyingGlassIcon, CubeIcon, DocumentTextIcon, ClockIcon, 
  ComputerDesktopIcon, StarIcon, ExclamationCircleIcon,
  MapPinIcon as MapPinOutline, FlagIcon
} from '@heroicons/react/24/outline';
import { MapPinIcon as MapPinSolid } from '@heroicons/react/24/solid';

// Components
import Skeleton from '@/components/ui/Skeleton';
import ToastNotification from '@/components/ui/ToastNotification';
import '@/styles/CourierJobsPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CourierMap = dynamic(() => import('@/components/ui/CourierMap'), { 
  ssr: false, 
  loading: () => <Skeleton width="100%" height="100%" borderRadius="0" /> 
});

const getCategoryIcon = (category) => {
  switch(category) {
    case 'DOCUMENTS': return DocumentTextIcon;
    case 'ELECTRONICS': return ComputerDesktopIcon;
    case 'FOOD': return CubeIcon; 
    default: return CubeIcon;
  }
};

export default function CourierJobsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const cardRefs = useRef({});

  // 1. Get User Location & Fetch Jobs
  useEffect(() => {
    const ANDHRA_PRADESH = { lat: 15.9129, lng: 79.7400 };

    const fetchJobs = async (userLat, userLng) => {
      try {
        const token = localStorage.getItem('token');
        
        let url = `${API_URL}/packages/available`;
        if (userLat && userLng) url += `?lat=${userLat}&lng=${userLng}`;

        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (data.success) {
          const finalJobs = data.data.map(job => ({
            ...job,
            displayDistance: job.distanceToPickup ? `${job.distanceToPickup.toFixed(1)}km away` : 'Distance unknown',
            icon: getCategoryIcon(job.category)
          }));
          setJobs(finalJobs);
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
        (err) => {
          console.warn("Location access denied/failed. Defaulting to AP.", err.message);
          setToast({ show: true, message: "Using default location (Andhra Pradesh)", type: 'info' });
          setUserLocation(ANDHRA_PRADESH);
          fetchJobs(ANDHRA_PRADESH.lat, ANDHRA_PRADESH.lng);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setUserLocation(ANDHRA_PRADESH);
      fetchJobs(ANDHRA_PRADESH.lat, ANDHRA_PRADESH.lng);
    }
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.dropAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkerClick = (jobId) => {
    setSelectedJobId(jobId);
    if (cardRefs.current[jobId]) {
      cardRefs.current[jobId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleViewDetails = (e, publicId) => {
    e.stopPropagation(); // Prevents the card's onClick from firing
    router.push(`/courier/jobs/${publicId}`);
  };

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

  const highPriorityJobs = filteredJobs.filter(j => j.isRecommended || j.urgency === 'URGENT');
  const lowPriorityJobs = filteredJobs.filter(j => !j.isRecommended && j.urgency !== 'URGENT');

  return (
    <div className={`page-container jobs-page fade-in`}>
      <div className="jobs-map-panel">
        <CourierMap 
          theme={theme} jobs={filteredJobs} userLocation={userLocation} 
          selectedJobId={selectedJobId} onMarkerClick={handleMarkerClick} zoomControl={false}
        />
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

      <div className="jobs-list-panel">
        <div className="jobs-header">
          <div className="search-bar">
            <MagnifyingGlassIcon style={{ width: 20 }} className="search-icon" />
            <input type="text" placeholder="Search pickup or drop..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
              {/* HIGH PRIORITY SECTION */}
              {highPriorityJobs.length > 0 && (
                <>
                  <div className="section-label">
                    <span>Priority & Recommended Matches</span>
                    <StarIcon style={{ width: 14, color: '#D4AF37' }} />
                  </div>
                  {highPriorityJobs.map(job => (
                    <div 
                      key={job.id} ref={el => cardRefs.current[job.id] = el}
                      className={`job-card-recommended ${selectedJobId === job.id ? 'selected' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      {selectedJobId === job.id && <div className="selected-ring"></div>}
                      
                      {/* Top Badges */}
                      <div className="job-badges">
                        {job.isRecommended && <div className="match-badge">{job.matchReason || 'Nearby'}</div>}
                        {job.urgency === 'URGENT' && (
                          <div className="urgent-badge">
                            <ExclamationCircleIcon width={12} /> URGENT
                          </div>
                        )}
                        {job.urgency === 'SCHEDULED' && (
                          <div className="scheduled-badge">
                            <ClockIcon width={12} /> {new Date(job.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        )}
                        {job.urgency === 'STANDARD' && (
                          <div className="today-badge">TODAY</div>
                        )}
                      </div>

                      <div className="rec-header">
                        <div className="rec-icon-circle"><job.icon style={{ width: 24 }} /></div>
                        <div className="rec-content">
                          <h4 className="rec-title">{job.title}</h4>
                          <p className="rec-sub">{job.weight}kg • {job.category}</p>
                        </div>
                        <div className="rec-price">₹{job.price.toFixed(0)}</div>
                      </div>

                      {/* Route Timeline */}
                      <div className="route-timeline">
                        <div className="route-point">
                          <MapPinOutline className="route-icon pickup" />
                          <span className="route-text">{job.pickupAddress.split(',')[0]}</span>
                        </div>
                        <div className="route-line"></div>
                        <div className="route-point">
                          <FlagIcon className="route-icon dropoff" />
                          <span className="route-text">{job.dropAddress.split(',')[0]}</span>
                        </div>
                      </div>

                      <div className="rec-footer">
                        <div className="pill-group">
                          <div className="pill-detour"><MapPinSolid style={{width: 12}} /> {job.displayDistance}</div>
                          <div className="pill-time"><ClockIcon style={{width: 14}} /> {job.distanceKm}km Route</div>
                        </div>
                        <button 
                          className="btn-view-details" 
                          onClick={(e) => handleViewDetails(e, job.publicId)}
                        >
                          Review & Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* LOW PRIORITY SECTION */}
              {lowPriorityJobs.length > 0 && (
                <>
                  <div className="section-label" style={{ marginTop: '16px' }}>Other Available Jobs</div>
                  {lowPriorityJobs.map(job => (
                    <div 
                      key={job.id} ref={el => cardRefs.current[job.id] = el}
                      className={`job-card-standard ${selectedJobId === job.id ? 'selected' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <div className="std-top">
                        <div className="std-left">
                          <div className="std-icon-box"><job.icon style={{ width: 22 }} /></div>
                          <div className="std-info">
                            <h4>
                              {job.title} 
                              {job.urgency === 'SCHEDULED' && <span className="std-scheduled-text">(Scheduled)</span>}
                            </h4>
                            <p>{job.displayDistance} • {job.weight}kg</p>
                          </div>
                        </div>
                        <div className="std-price">₹{job.price.toFixed(0)}</div>
                      </div>
                      
                      <div className="std-route-simple">
                        <span className="truncate">{job.pickupAddress.split(',')[0]}</span>
                        <span className="route-arrow">→</span>
                        <span className="truncate">{job.dropAddress.split(',')[0]}</span>
                      </div>

                      <div className="std-footer">
                        <span className="std-distance">{job.distanceKm}km total</span>
                        <button 
                          className="btn-view-details-sm" 
                          onClick={(e) => handleViewDetails(e, job.publicId)}
                        >
                          Details
                        </button>
                      </div>
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