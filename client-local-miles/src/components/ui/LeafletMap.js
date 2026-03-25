'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Fix Leaflet Default Icons in React ---
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// --- Click Handler Component ---
function MapEventHandler({ onLocationSelect, setPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      if (onLocationSelect) onLocationSelect({ lat, lng });
    },
  });
  return null;
}

// --- Map Center Controller ---
function MapController({ center }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LeafletMap({ center, onLocationSelect }) {
  const safeCenter = center && center.lat ? center : { lat: 12.9716, lng: 77.5946 };
  const [markerPos, setMarkerPos] = useState(safeCenter);

  return (
    <div className="leaflet-wrapper" style={{ height: '100%', width: '100%', zIndex: 1 }}>
      <MapContainer 
        center={safeCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={markerPos} icon={icon} />
        <MapEventHandler onLocationSelect={onLocationSelect} setPosition={setMarkerPos} />
        <MapController center={safeCenter} />
      </MapContainer>
    </div>
  );
}