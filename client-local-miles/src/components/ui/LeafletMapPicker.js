'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultCenter = {
  lat: 12.9716, // Bangalore
  lng: 77.5946
};

// Component to handle map clicks
function ClickHandler({ onLocationSelect, setMarker }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setMarker({ lat, lng });
      if (onLocationSelect) onLocationSelect({ lat, lng });
    },
  });
  return null;
}

// Component to control map center
function MapController({ center }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LeafletMapPicker({ label, onLocationSelect }) {
  const [center, setCenter] = useState(defaultCenter);
  const [marker, setMarker] = useState(null);

  // Get user's current location on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(pos);
      });
    }
  }, []);

  return (
    <div style={{ 
      marginBottom: '16px', 
      overflow: 'hidden', 
      borderRadius: '12px', 
      border: '1px solid #E5E7EB',
      height: '200px', // Explicit height needed for Leaflet container
      position: 'relative',
      zIndex: 1
    }}>
      {label && (
        <label style={{ 
          display: 'block', 
          fontSize: '0.85rem', 
          fontWeight: 600, 
          color: '#374151', 
          marginBottom: '8px',
          padding: '12px 12px 0 12px',
          position: 'absolute',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '0 0 4px 0'
        }}>
          {label}
        </label>
      )}

      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {marker && <Marker position={marker} icon={icon} />}
        <ClickHandler onLocationSelect={onLocationSelect} setMarker={setMarker} />
        <MapController center={center} />
      </MapContainer>
    </div>
  );
}