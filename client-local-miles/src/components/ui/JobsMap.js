'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom CSS-based Markers (Matches theme, no external images needed)
const createIcon = (type, isSelected) => {
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

// Map Pan Controller
const MapPanner = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

export default function JobsMap({ theme, jobs, userLocation, selectedJobId, onMarkerClick }) {
  const tileUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const defaultCenter = [19.0960, 72.8777]; // Mumbai Fallback
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  // Determine if map should pan to a selected job
  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const panCenter = selectedJob ? [selectedJob.pickupLat, selectedJob.pickupLng] : mapCenter;
  const panZoom = selectedJob ? 15 : 12;

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={12} 
      zoomControl={false}
      style={{ width: '100%', height: '100%', zIndex: 1 }}
    >
      <TileLayer url={tileUrl} />
      
      <MapPanner center={panCenter} zoom={panZoom} />

      {/* Current User Location Marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={createIcon('user', false)} />
      )}

      {/* Job Markers */}
      {jobs.map(job => (
        <Marker 
          key={job.id} 
          position={[job.pickupLat, job.pickupLng]} 
          icon={createIcon(job.isRecommended ? 'recommended' : 'standard', job.id === selectedJobId)}
          eventHandlers={{
            click: () => onMarkerClick(job.id)
          }}
        />
      ))}
    </MapContainer>
  );
}