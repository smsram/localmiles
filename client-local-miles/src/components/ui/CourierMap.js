'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- GLOBAL LEAFLET ICON FIX ---
// This ensures standard Google/Leaflet icons don't break in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- CUSTOM MARKER GENERATOR ---
// Used for "Find Jobs" to show colored dots instead of standard pins
const createCustomIcon = (type, isSelected) => {
  let color = '#9CA3AF'; // Standard (Grey)
  if (type === 'user') color = '#3B82F6'; // User Location (Blue)
  if (type === 'recommended') color = '#D4AF37'; // Recommended (Gold)
  if (isSelected) color = '#10B981'; // Selected (Green)

  const size = type === 'user' ? 16 : (isSelected ? 24 : 20);
  const zIndex = isSelected ? 1000 : (type === 'recommended' ? 500 : 1);

  return L.divIcon({
    className: 'custom-job-marker',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); z-index: ${zIndex}; transition: all 0.2s;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};


// --- MAP CONTROL COMPONENTS ---

// 1. Bounds & Center Updater (For routing & panning)
const MapUpdater = ({ bounds, center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try { 
        map.fitBounds(bounds, { padding: [50, 50], animate: true }); 
      } catch(e) { console.warn("Map bounds error", e); }
    } else if (center) {
      map.flyTo(center, zoom || 13, { animate: true, duration: 1.5 });
    }
  }, [map, bounds, center, zoom]);
  return null;
};

// 2. Click Listener (For picking locations)
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e.latlng);
    },
  });
  return null;
};

// --- MAIN EXPORT COMPONENT ---
export default function CourierMap({ 
  theme, 
  
  // Single/Route Location Props
  pickupLat, pickupLng, 
  dropoffLat, dropoffLng, 
  
  // "Find Jobs" Props
  jobs = [], // Array of job objects {id, pickupLat, pickupLng, isRecommended}
  userLocation = null, // {lat, lng}
  selectedJobId = null,
  
  // Shared Props
  mapPath = [], 
  onMapClick,
  onMarkerClick,
  zoomControl = false,
  scrollWheelZoom = true,
}) {
  
  // Determine Base Center
  const defaultCenter = [19.0760, 72.8777]; // Mumbai Fallback
  let initialCenter = defaultCenter;
  let currentZoom = 12;

  // Logic to determine where the map should look right now
  if (userLocation && jobs.length > 0) {
    // If in "Jobs" mode with a user location
    initialCenter = [userLocation.lat, userLocation.lng];
  } else if (pickupLat) {
    // If in "Route" mode with a pickup selected
    initialCenter = [pickupLat, pickupLng];
    currentZoom = 14;
  }

  // If a specific job is clicked (in "Find Jobs" mode), pan to it
  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const activeCenter = selectedJob ? [selectedJob.pickupLat, selectedJob.pickupLng] : initialCenter;
  const activeZoom = selectedJob ? 15 : currentZoom;

  const tileUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer 
      center={activeCenter} 
      zoom={activeZoom} 
      zoomControl={zoomControl}
      scrollWheelZoom={scrollWheelZoom}
      style={{ width: '100%', height: '100%', zIndex: 1 }}
    >
      <TileLayer url={tileUrl} />
      
      {/* Enables clicking on map to get coordinates (if prop is passed) */}
      <MapClickHandler onMapClick={onMapClick} />
      
      {/* -------------------------------------------------------------
          MODE 1: SINGLE ROUTE (Used in Post Route / Tracking)
      ------------------------------------------------------------- */}
      {pickupLat && jobs.length === 0 && <Marker position={[pickupLat, pickupLng]} />}
      {dropoffLat && jobs.length === 0 && <Marker position={[dropoffLat, dropoffLng]} />}
      
      {/* -------------------------------------------------------------
          MODE 2: MULTIPLE JOBS (Used in Find Jobs)
      ------------------------------------------------------------- */}
      {/* Current User Location Marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('user', false)} />
      )}

      {/* Array of Job Markers */}
      {jobs.map(job => (
        <Marker 
          key={job.id} 
          position={[job.pickupLat, job.pickupLng]} 
          icon={createCustomIcon(job.isRecommended ? 'recommended' : 'standard', job.id === selectedJobId)}
          eventHandlers={{
            click: () => onMarkerClick && onMarkerClick(job.id)
          }}
        />
      ))}

      {/* -------------------------------------------------------------
          SHARED ROUTE PATH (Polylines)
      ------------------------------------------------------------- */}
      {mapPath && mapPath.length > 0 && (
        <Polyline 
          positions={mapPath} 
          pathOptions={{ 
            color: theme === 'dark' ? '#D4AF37' : '#3B82F6', 
            weight: 4, 
            opacity: 0.8, 
            dashArray: '10, 10', 
            lineCap: 'round',
            lineJoin: 'round'
          }} 
        />
      )}

      {/* Auto-Pan Controller */}
      <MapUpdater 
        bounds={mapPath.length > 0 ? mapPath : null} 
        center={activeCenter} 
        zoom={activeZoom} 
      />
    </MapContainer>
  );
}