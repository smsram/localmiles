'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  loading: () => <Skeleton width="100%" height="100%" borderRadius="0" /> 
});

export default function CourierActivitiesPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('active');
  const [historyFilter, setHistoryFilter] = useState('all');
  
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState({ activeJobs: [], scheduledJobs: [], historyJobs: [] });
  const [activeRoutePath, setActiveRoutePath] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // 1. Fetch Backend Data
  const fetchActivities = async () => {
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
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // 2. Compute Map Path for Active Job
  const activeJob = activities.activeJobs[0]; // Assuming taking the first active job
  
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
        } catch (e) { console.error("OSRM Error"); }
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
      </div>
    );

    return (
      <div className="fade-in">
        <div className="active-job-card">
          <div className="job-details-panel">
            <div>
              <div className="job-status-row">
                <span className="live-badge">{activeJob.status.replace('_', ' ')}</span>
                <span className="pickup-time">{activeJob.distanceKm} km Trip</span>
              </div>

              <div className="timeline-container">
                <div className="timeline-line"></div>
                <div className="timeline-item">
                  <div className="timeline-icon-circle active">
                    <TruckIcon style={{ width: 20 }} />
                  </div>
                  <div className="timeline-content">
                    <h3 className="text-white">You</h3>
                    <p>Moving towards destination</p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-icon-circle">
                    <UserIcon style={{ width: 20, color: '#9CA3AF' }} />
                  </div>
                  <div className="timeline-content">
                    <h3 className="text-white">Pickup: {activeJob.pickupAddress.split(',')[0]}</h3>
                    <p>{activeJob.title} • Order {activeJob.publicId}</p>
                  </div>
                </div>

                <div className="timeline-item" style={{ opacity: 0.5 }}>
                  <div className="timeline-icon-circle" style={{ borderStyle: 'dashed' }}>
                    <MapPinIcon style={{ width: 20 }} />
                  </div>
                  <div className="timeline-content">
                    <h3 className="text-white">Drop: {activeJob.dropAddress.split(',')[0]}</h3>
                    <p>Standard Delivery</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button className="btn-navigate">
                <PaperAirplaneIcon style={{ width: 20 }} /> Navigate
              </button>
              <button className="btn-verify">
                <QrCodeIcon style={{ width: 20 }} /> View Details
              </button>
            </div>
          </div>

          <div className="job-map-panel">
            <CourierMap 
              theme={theme}
              pickupLat={activeJob.pickupLat} pickupLng={activeJob.pickupLng}
              dropoffLat={activeJob.dropLat} dropoffLng={activeJob.dropLng}
              mapPath={activeRoutePath}
              zoomControl={false}
              scrollWheelZoom={false}
            />
            <div className="map-overlay-info">
              <div className="info-block"><MapPinIcon style={{width: 20, color: '#D4AF37'}} /> {activeJob.distanceKm} km</div>
              <div className="info-block"><ClockIcon style={{width: 20, color: '#D4AF37'}} /> Active</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduledTab = () => {
    if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{[1,2].map(i => <Skeleton key={i} width="100%" height="150px" borderRadius="16px" />)}</div>;

    if (activities.scheduledJobs.length === 0) return <p style={{ color: 'var(--text-muted)' }}>No upcoming scheduled jobs.</p>;

    return (
      <div className="fade-in">
        <div className="section-title-row" style={{ marginTop: '0', marginBottom: '24px' }}>
          <CalendarIcon style={{ width: 24, color: '#D4AF37' }} />
          <h2 className="section-title">Upcoming Deliveries</h2>
        </div>

        {activities.scheduledJobs.map((job) => {
          // Format data for ActivityCard
          const formattedData = {
            id: job.publicId,
            dateGroup: job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pending Pickup',
            timeSlot: job.scheduledDate ? new Date(job.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'ASAP',
            badge: job.urgency,
            pickup: job.pickupAddress.split(',')[0],
            drop: job.dropAddress.split(',')[0],
            cargo: `${job.category} • ${job.weight}kg`,
            earnings: job.driverFee.toFixed(2)
          };

          return (
            <div key={job.id}>
              <div className="date-header">{formattedData.dateGroup}</div>
              <ActivityCard type="scheduled" data={formattedData} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{[1,2,3].map(i => <Skeleton key={i} width="100%" height="80px" borderRadius="16px" />)}</div>;

    // Filter Logic
    const filteredHistory = activities.historyJobs.filter(job => {
      if (historyFilter === 'completed') return job.status === 'DELIVERED';
      if (historyFilter === 'cancelled') return job.status === 'CANCELLED';
      if (historyFilter === 'last 7 days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return new Date(job.updatedAt) >= sevenDaysAgo;
      }
      return true; // 'all'
    });

    return (
      <div className="fade-in">
        <div className="history-filters">
          {['All', 'Last 7 Days', 'Completed', 'Cancelled'].map(f => (
            <button 
              key={f} 
              className={`filter-chip ${historyFilter === f.toLowerCase() ? 'active' : ''}`}
              onClick={() => setHistoryFilter(f.toLowerCase())}
            >
              {f}
            </button>
          ))}
        </div>
        
        {filteredHistory.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No history found for this filter.</p>
        ) : (
          <div className="history-list">
            {filteredHistory.map((trip) => {
              const isSuccess = trip.status === 'DELIVERED';
              const formattedData = {
                id: trip.publicId,
                status: isSuccess ? 'success' : 'failed',
                route: `${trip.pickupAddress.split(',')[0]} ➔ ${trip.dropAddress.split(',')[0]}`,
                date: new Date(trip.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                amount: `₹ ${trip.driverFee.toFixed(2)}`
              };
              
              return <ActivityCard key={trip.id} type="history" data={formattedData} />;
            })}
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
          <button 
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
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