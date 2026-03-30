'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { io } from 'socket.io-client';
import { UserIcon, PhoneIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import Skeleton from '@/components/ui/Skeleton';
import '@/styles/TrackingPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
// Target the base domain for sockets (remove /api/v1 if present)
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');

const CourierMap = dynamic(() => import('@/components/ui/CourierMap'), { 
  ssr: false, 
  loading: () => <Skeleton width="100%" height="350px" borderRadius="16px" /> 
});

export default function PublicTrackingPage() {
  const { id } = useParams();
  
  const [pkg, setPkg] = useState(null);
  const [courierLoc, setCourierLoc] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [routePath, setRoutePath] = useState([]);
  
  const liveTimeoutRef = useRef(null);

  // 1. Fetch Initial Data
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/packages/public-track/${id}`);
        const data = await res.json();
        if (data.success) {
          setPkg(data.data);
          
          // Load last known location if courier isn't currently active
          if (data.data.lastLiveLat && data.data.lastLiveLng) {
            setCourierLoc({ 
              lat: data.data.lastLiveLat, 
              lng: data.data.lastLiveLng, 
              time: new Date(data.data.lastLiveUpdatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
            });
          }

          // Fetch OSRM Route for the map
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${data.data.pickupLng},${data.data.pickupLat};${data.data.dropLng},${data.data.dropLat}?overview=full&geometries=geojson`;
          fetch(osrmUrl).then(r => r.json()).then(routeData => {
            if (routeData.routes?.[0]) {
              setRoutePath(routeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
            }
          }).catch(() => {});
        }
      } catch (e) { 
        console.error("Fetch error", e); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchStatus();
  }, [id]);

  // 2. Socket.io Real-Time Connection
  useEffect(() => {
    if (!id || pkg?.status === 'DELIVERED') return;

    const socket = io(SOCKET_URL);
    socket.emit('join_tracking', id);

    socket.on('location_updated', (data) => {
      setCourierLoc(data);
      setIsLive(true);
      
      // If no new ping arrives in 15 seconds, mark as offline/signal lost
      if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
      liveTimeoutRef.current = setTimeout(() => setIsLive(false), 15000); 
    });

    return () => {
      socket.disconnect();
      if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
    };
  }, [id, pkg?.status]);

  if (loading) return <div className="track-loading"><div className="spinner"></div><p>Locating package...</p></div>;
  if (!pkg) return <div className="track-loading" style={{color: '#EF4444'}}><p>Invalid Tracking ID.</p></div>;

  const isDelivered = pkg.status === 'DELIVERED';
  const isPickedUp = pkg.status === 'PICKED_UP' || pkg.status === 'IN_TRANSIT' || isDelivered;
  const canCall = pkg.status === 'PICKED_UP' || pkg.status === 'IN_TRANSIT';

  return (
    <div className="track-container fade-in">
      
      <div className="track-header text-center">
        <h2 className="track-title">{isDelivered ? 'Successfully Delivered 🎉' : 'Package on its way!'}</h2>
        <p className="track-subtitle">Order #{pkg.publicId} • {pkg.title}</p>
      </div>

      {/* --- MAP SECTION --- */}
      <div className="track-map-wrapper">
        <CourierMap 
          pickupLat={pkg.pickupLat} pickupLng={pkg.pickupLng}
          dropoffLat={pkg.dropLat} dropoffLng={pkg.dropLng}
          mapPath={routePath}
          userLocation={isDelivered ? null : courierLoc} // Hide courier if delivered
          zoomControl={true}
        />
        
        {/* Live Status Pill Overlay */}
        {!isDelivered && courierLoc && (
          <div className="track-live-pill">
            <div className={`live-dot ${isLive ? 'pulsing' : 'offline'}`}></div>
            <span>{isLive ? 'LIVE' : `LAST SEEN ${courierLoc.time}`}</span>
          </div>
        )}
        
        {/* Fallback if courier hasn't turned on GPS yet */}
        {!isDelivered && !courierLoc && (
          <div className="track-live-pill">
            <div className="live-dot offline"></div>
            <span>WAITING FOR GPS...</span>
          </div>
        )}
      </div>

      {/* --- COURIER PROFILE SECTION --- */}
      <div className="track-card courier-profile-card">
        <div className="courier-info-left">
          <div className="courier-avatar">
            <UserIcon width={24} color="#9CA3AF" />
          </div>
          <div>
            <h4 className="courier-name">{pkg.courier?.fullName || 'Assigning Courier...'}</h4>
            <p className="courier-vehicle">
               {pkg.courier?.courierProfile?.vehicleModel || 'Standard Vehicle'} • 
               <span className="plate-badge">{pkg.courier?.courierProfile?.plateNumber || 'N/A'}</span>
            </p>
          </div>
        </div>
        
        {/* Call button only active during transit */}
        {canCall ? (
          <a href={`tel:${pkg.courier?.phone}`} className="btn-call-courier">
            <PhoneIcon width={20} />
          </a>
        ) : (
          <div className="btn-call-courier disabled" title="Call available after pickup">
            <PhoneIcon width={20} />
          </div>
        )}
      </div>

      {/* --- MINI STEPPER --- */}
      <div className="track-card">
        <h4 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Delivery Status</h4>
        <div className="mini-stepper">
           <div className="step done">
             <div className="step-icon"><CheckCircleIcon width={24} /></div>
             <div className="step-text">
               <h4>Assigned</h4>
               <p>Courier is heading to pickup</p>
             </div>
           </div>
           
           <div className={`step-connector ${isPickedUp ? 'done' : ''}`}></div>
           
           <div className={`step ${isPickedUp ? 'done' : ''}`}>
             <div className="step-icon">{isPickedUp ? <CheckCircleIcon width={24} /> : <div className="empty-circle"></div>}</div>
             <div className="step-text">
               <h4>In Transit</h4>
               <p>Package is on the move</p>
             </div>
           </div>
           
           <div className={`step-connector ${isDelivered ? 'done' : ''}`}></div>
           
           <div className={`step ${isDelivered ? 'done' : ''}`}>
             <div className="step-icon">{isDelivered ? <CheckCircleIcon width={24} /> : <div className="empty-circle"></div>}</div>
             <div className="step-text">
               <h4>Delivered</h4>
               <p>Safely handed over</p>
             </div>
           </div>
        </div>
      </div>

    </div>
  );
}