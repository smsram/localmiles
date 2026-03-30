'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  TruckIcon, MapPinIcon, ClockIcon, QrCodeIcon, 
  CalendarIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { 
  PaperAirplaneIcon, UserIcon,
} from '@heroicons/react/24/solid';

import ActivityCard from '@/components/ui/ActivityCard';
import Skeleton from '@/components/ui/Skeleton';
import ToastNotification from '@/components/ui/ToastNotification';
import '@/styles/CourierActivitiesPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Dynamically import the Reusable Map safely
const CourierMap = dynamic(() => import('@/components/ui/CourierMap'), { 
  ssr: false, 
  loading: () => <Skeleton width="100%" height="100%" borderRadius="24px" /> 
});

// Helper: Haversine Distance Calculator (km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function CourierActivitiesPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('active');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState({ activeJobs: [], scheduledJobs: [], historyJobs: [] });
  const [activeRoutePath, setActiveRoutePath] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // 1. Live Location Tracking
  useEffect(() => {
    const ANDHRA_PRADESH = { lat: 15.9129, lng: 79.7400 };

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Location watch failed", err);
          if (!userLocation) setUserLocation(ANDHRA_PRADESH);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setUserLocation(ANDHRA_PRADESH);
    }
  }, []);

  // 2. Fetch Backend Data
  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/packages/courier/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setActivities(data.data);
      }
    } catch (err) {
      setToast({ show: true, message: "Failed to load activities", type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // 3. Compute Map Path for the first Active Job
  const activeJob = activities.activeJobs[0];
  
  useEffect(() => {
    const fetchPath = async () => {
      if (activeJob) {
        try {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${activeJob.pickupLng},${activeJob.pickupLat};${activeJob.dropLng},${activeJob.dropLat}?overview=full&geometries=geojson`;
          const res = await fetch(osrmUrl);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            setActiveRoutePath(data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]));
          }
        } catch (e) { console.error("OSRM Error", e); }
      }
    };
    fetchPath();
  }, [activeJob]);

  // --- TAB RENDERERS ---

  const renderActiveTab = () => {
    if (loading) return <div style={{ height: '380px' }}><Skeleton width="100%" height="100%" borderRadius="24px" /></div>;
    
    if (!activeJob) return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
        <TruckIcon style={{ width: 48, margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.5 }} />
        <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No Active Deliveries</h3>
        <p style={{ color: 'var(--text-muted)' }}>You don't have any packages currently in transit.</p>
        <button className="btn-verify" style={{marginTop: '16px', border: '1.5px solid var(--brand-gold)', background: 'transparent', color: 'var(--brand-gold)'}} onClick={() => router.push('/courier/jobs')}>Find Jobs</button>
      </div>
    );

    const isHeadingToPickup = activeJob.status === 'ASSIGNED';
    const targetLat = isHeadingToPickup ? activeJob.pickupLat : activeJob.dropLat;
    const targetLng = isHeadingToPickup ? activeJob.pickupLng : activeJob.dropLng;

    let gapDistance = null;
    if (userLocation && targetLat && targetLng) {
      gapDistance = calculateDistance(userLocation.lat, userLocation.lng, targetLat, targetLng).toFixed(1);
    }

    return (
      <div className="fade-in">
        <div className="active-job-card">
          <div className="job-details-panel">
            <div>
              <div className="job-status-row">
                <span className="live-badge" style={{ background: '#10B981', color: '#fff' }}>
                   LIVE: {activeJob.status.replace('_', ' ')}
                </span>
                <span className="pickup-time">{activeJob.distanceKm} km Total Trip</span>
              </div>

              <div className="timeline-container">
                <div className="timeline-line"></div>
                
                {/* 1. CURRENT COURIER LOCATION */}
                <div className="timeline-item">
                  <div className="timeline-icon-circle active">
                    <TruckIcon style={{ width: 20 }} />
                  </div>
                  <div className="timeline-content">
                    <h3 className="text-white">Your Location</h3>
                    <p>{gapDistance ? `${gapDistance} km gap to ${isHeadingToPickup ? 'Pickup' : 'Dropoff'}` : 'Locating GPS...'}</p>
                  </div>
                </div>

                {/* 2. PICKUP */}
                <div className="timeline-item" style={{ opacity: isHeadingToPickup ? 1 : 0.6 }}>
                  <div className="timeline-icon-circle" style={{ borderColor: isHeadingToPickup ? 'var(--brand-gold)' : '#374151' }}>
                    <UserIcon style={{ width: 20, color: isHeadingToPickup ? 'var(--brand-gold)' : '#9CA3AF' }} />
                  </div>
                  <div className="timeline-content">
                    <h3 className="text-white">Pickup: {activeJob.pickupAddress.split(',')[0]}</h3>
                    <p>{activeJob.title} • Order {activeJob.publicId}</p>
                  </div>
                </div>

                {/* 3. DROPOFF */}
                <div className="timeline-item" style={{ opacity: isHeadingToPickup ? 0.4 : 1 }}>
                  <div className="timeline-icon-circle" style={{ borderStyle: 'dashed', borderColor: !isHeadingToPickup ? '#EF4444' : '#374151' }}>
                    <MapPinIcon style={{ width: 20, color: !isHeadingToPickup ? '#EF4444' : '#9CA3AF' }} />
                  </div>
                  <div className="timeline-content">
                    <h3 className="text-white">Drop: {activeJob.dropAddress.split(',')[0]}</h3>
                    <p>{isHeadingToPickup ? 'Next Stop' : 'Heading here now'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button className="btn-navigate" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}&travelmode=driving`, '_blank')}>
                <PaperAirplaneIcon style={{ width: 20 }} /> Navigate
              </button>
              <button className="btn-verify" onClick={() => router.push(`/courier/jobs/${activeJob.publicId}`)}>
                <QrCodeIcon style={{ width: 20 }} /> View Details
              </button>
            </div>
          </div>

          <div className="job-map-panel">
            <CourierMap 
              theme={theme}
              userLocation={userLocation}
              jobs={[activeJob]}
              mapPath={activeRoutePath}
              zoomControl={false}
              scrollWheelZoom={false}
            />
            <div className="map-overlay-info">
              {gapDistance && (
                <div className="info-block">
                  <ClockIcon style={{width: 18, color: '#D4AF37'}} /> 
                  <span>{gapDistance} km left</span>
                </div>
              )}
              <div className="info-block">
                <MapPinIcon style={{width: 18, color: '#D4AF37'}} /> 
                <span>{activeJob.urgency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduledTab = () => {
    if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{[1,2].map(i => <Skeleton key={i} width="100%" height="150px" borderRadius="16px" />)}</div>;
    if (activities.scheduledJobs.length === 0) return <p style={{ color: 'var(--text-muted)', padding: '20px' }}>No upcoming scheduled jobs.</p>;

    return (
      <div className="fade-in">
        <div className="section-title-row" style={{ marginTop: '0', marginBottom: '24px' }}>
          <CalendarIcon style={{ width: 24, color: '#D4AF37' }} />
          <h2 className="section-title">Upcoming Deliveries</h2>
        </div>
        {activities.scheduledJobs.map((job) => (
          <div key={job.id} onClick={() => router.push(`/courier/jobs/${job.publicId}`)} style={{cursor: 'pointer'}}>
            <div className="date-header">
              {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pending'}
            </div>
            <ActivityCard type="scheduled" data={{
              id: job.publicId,
              timeSlot: job.scheduledDate ? new Date(job.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'ASAP',
              badge: job.urgency,
              pickup: job.pickupAddress.split(',')[0],
              drop: job.dropAddress.split(',')[0],
              cargo: `${job.category} • ${job.weight}kg`,
              earnings: job.driverFee.toFixed(2)
            }} />
          </div>
        ))}
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{[1,2,3].map(i => <Skeleton key={i} width="100%" height="80px" borderRadius="16px" />)}</div>;

    const filteredHistory = activities.historyJobs.filter(job => {
      if (historyFilter === 'completed') return job.status === 'DELIVERED';
      if (historyFilter === 'cancelled') return job.status === 'CANCELLED';
      return true;
    });

    return (
      <div className="fade-in">
        <div className="history-filters">
          {['All', 'Completed', 'Cancelled'].map(f => (
            <button key={f} className={`filter-chip ${historyFilter === f.toLowerCase() ? 'active' : ''}`} onClick={() => setHistoryFilter(f.toLowerCase())}>{f}</button>
          ))}
        </div>
        {filteredHistory.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No history found.</p> : (
          <div className="history-list">
            {filteredHistory.map((trip) => (
              <ActivityCard key={trip.id} type="history" data={{
                id: trip.publicId,
                status: trip.status === 'DELIVERED' ? 'success' : 'failed',
                route: `${trip.pickupAddress.split(',')[0]} ➔ ${trip.dropAddress.split(',')[0]}`,
                date: new Date(trip.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                amount: `₹ ${trip.driverFee.toFixed(2)}`
              }} onClick={() => router.push(`/courier/jobs/${trip.publicId}`)} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container activities-page">
      <div className="page-header">
        <h1 className="page-title">My Activities</h1>
        <div className="status-indicator">
          <div className="status-dot"></div> ONLINE
        </div>
      </div>

      <div className="activities-tabs">
        {['active', 'scheduled', 'history'].map((tab) => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)} 
            {tab === 'active' && activities.activeJobs.length > 0 && <span className="tab-badge">{activities.activeJobs.length}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'active' && renderActiveTab()}
      {activeTab === 'scheduled' && renderScheduledTab()}
      {activeTab === 'history' && renderHistoryTab()}

      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}