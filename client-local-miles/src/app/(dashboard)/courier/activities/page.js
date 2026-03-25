'use client';
import { useState, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  TruckIcon, MapPinIcon, ClockIcon, QrCodeIcon, 
  CalendarIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { 
  PaperAirplaneIcon, UserIcon,
} from '@heroicons/react/24/solid';

import ActivityCard from '@/components/ui/ActivityCard';
import '@/styles/CourierActivitiesPage.css';

// --- MOCK DATA ---
const todayUpcoming = [
  { id: 101, title: 'Evening Return Trip', route: 'Central Hub to North Warehouse', time: 'Today • 6:00 PM', earnings: 450, status: 'scheduled' }
];

const scheduledJobs = [
  { id: 'job_201', dateGroup: 'Tomorrow, 12th Aug', timeSlot: '09:00 AM - 10:00 AM', badge: 'Morning Commute Match', pickup: 'Adyar', drop: 'Velachery', cargo: 'Small Box • 2 kg', earnings: 140 },
  { id: 'job_202', dateGroup: 'Tomorrow, 12th Aug', timeSlot: '05:00 PM - 06:00 PM', badge: 'Return Trip', pickup: 'Velachery', drop: 'Guindy', cargo: 'Documents • 0.5 kg', earnings: 90 }
];

const historyJobs = [
  { id: '#TRIP-8821', status: 'success', route: 'Anna Nagar ➔ T. Nagar', date: 'Aug 10, 10:30 AM', amount: '₹ 120.00' },
  { id: '#TRIP-8820', status: 'failed', route: 'Mylapore ➔ Adyar', date: 'Aug 09, 04:15 PM', amount: '₹ 0.00' },
  { id: '#TRIP-8819', status: 'success', route: 'T. Nagar ➔ Guindy', date: 'Aug 08, 09:00 AM', amount: '₹ 210.00' }
];

// --- MAP CONFIG ---
const containerStyle = { width: '100%', height: '100%' };
const center = { lat: 19.0760, lng: 72.8777 }; 
const path = [{ lat: 19.0760, lng: 72.8777 }, { lat: 19.1200, lng: 72.8500 }];

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

export default function CourierActivitiesPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('active');
  const [historyFilter, setHistoryFilter] = useState('all');

  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    styles: theme === 'dark' ? darkMapStyles : []
  }), [theme]);

  const renderActiveTab = () => (
    <div className="fade-in">
      <div className="active-job-card">
        <div className="job-details-panel">
          <div>
            <div className="job-status-row">
              <span className="live-badge">In Transit</span>
              <span className="pickup-time">Picking Up in 5 mins</span>
            </div>

            <div className="timeline-container">
              <div className="timeline-line"></div>
              <div className="timeline-item">
                <div className="timeline-icon-circle active">
                  <TruckIcon style={{ width: 20 }} />
                </div>
                <div className="timeline-content">
                  <h3 className="text-white">You</h3>
                  <p>Moving towards pickup</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-icon-circle">
                  <UserIcon style={{ width: 20, color: '#9CA3AF' }} />
                </div>
                <div className="timeline-content">
                  <h3 className="text-white">Pickup: Anna Nagar</h3>
                  <p>Box of Books • Order #4829</p>
                  <div className="timeline-sub">Est. arrival 10:45 AM</div>
                </div>
              </div>

              <div className="timeline-item" style={{ opacity: 0.5 }}>
                <div className="timeline-icon-circle" style={{ borderStyle: 'dashed' }}>
                  <MapPinIcon style={{ width: 20 }} />
                </div>
                <div className="timeline-content">
                  <h3 className="text-white">Drop: T. Nagar</h3>
                  <p>Est. arrival 11:30 AM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <button className="btn-navigate">
              <PaperAirplaneIcon style={{ width: 20 }} /> Navigate
            </button>
            <button className="btn-verify">
              <QrCodeIcon style={{ width: 20 }} /> Verify Pickup
            </button>
          </div>
        </div>

        <div className="job-map-panel">
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
                    strokeOpacity: 1, 
                    strokeWeight: 4 
                }} 
              />
            </GoogleMap>
          </LoadScript>
          <div className="map-overlay-info">
            <div className="info-block"><MapPinIcon style={{width: 20, color: '#D4AF37'}} /> 1.2 km left</div>
            <div className="info-block"><ClockIcon style={{width: 20, color: '#D4AF37'}} /> 5 min</div>
          </div>
        </div>
      </div>

      <div className="section-title-row">
        <CalendarIcon style={{ width: 24, color: '#D4AF37' }} />
        <h2 className="section-title">Upcoming for Today</h2>
      </div>

      <div className="upcoming-list">
        {todayUpcoming.map(job => (
          <div key={job.id} className="upcoming-card">
            <div className="upcoming-left">
              <div className="upcoming-icon-box"><TruckIcon style={{ width: 24 }} /></div>
              <div className="upcoming-info">
                <h4>
                  <span className="schedule-tag">Scheduled</span> <span className="text-muted">{job.time}</span>
                </h4>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }} className="text-main">{job.title}</div>
                <div className="upcoming-sub text-muted">{job.route}</div>
              </div>
            </div>
            <div className="upcoming-right">
              <div className="earnings">
                <span className="earnings-label text-muted">Estimated Earnings</span>
                <div className="earnings-val text-main">₹{job.earnings}</div>
              </div>
              <button className="btn-arrow"><ChevronRightIcon style={{ width: 20 }} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderScheduledTab = () => (
    <div className="fade-in">
      {scheduledJobs.map((job) => (
        <div key={job.id}>
          <div className="date-header">{job.dateGroup}</div>
          <ActivityCard type="scheduled" data={job} />
        </div>
      ))}
    </div>
  );

  const renderHistoryTab = () => (
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
      <div className="history-list">
        {historyJobs.map((trip) => (
          <ActivityCard key={trip.id} type="history" data={trip} />
        ))}
      </div>
    </div>
  );

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
            {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'active' && <span className="tab-badge">1</span>}
          </button>
        ))}
      </div>

      {activeTab === 'active' && renderActiveTab()}
      {activeTab === 'scheduled' && renderScheduledTab()}
      {activeTab === 'history' && renderHistoryTab()}
    </div>
  );
}