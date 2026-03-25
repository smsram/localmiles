'use client';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MagnifyingGlassIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';

// --- CONSTANTS ---
const DEFAULT_VIEW_CENTER = { lat: 12.9716, lng: 77.5946 }; // Default: Bangalore

// --- DYNAMIC IMPORTS ---
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });

// --- CONTROLLER COMPONENT (FIXED TRANSITIONS) ---
const MapController = ({ lat, lng, zoom, onLocationSelect }) => {
  const { useMap, useMapEvents } = require('react-leaflet');
  const L = require('leaflet');
  const map = useMap();

  // Safe client-side icon initialization
  const defaultIcon = useMemo(() => {
    return L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }, [L]);

  // Clean, straightforward effect: Whenever lat/lng changes, fly there!
  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5 });
    }
  }, [lat, lng, zoom, map]);

  useMapEvents({
    click(e) {
      if (onLocationSelect) onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  return (lat !== undefined && lng !== undefined) ? <Marker position={[lat, lng]} icon={defaultIcon} /> : null;
};

// =========================================================
// MAIN COMPONENT
// =========================================================
export default function MapPicker({ 
  label, 
  lat, 
  lng, 
  onLocationSelect, 
  zoom = 15, // Closer street view
  useCurrentLocation = false,
  takeLocation = true
}) {
  const hasProps = (lat !== undefined && lat !== null) && (lng !== undefined && lng !== null);
  
  const activeLat = hasProps ? lat : DEFAULT_VIEW_CENTER.lat;
  const activeLng = hasProps ? lng : DEFAULT_VIEW_CENTER.lng;
  
  const [isMounted, setIsMounted] = useState(false);

  // --- Search State ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(''); 

  useEffect(() => { setIsMounted(true); }, []);

  // Auto-Detect GPS
  useEffect(() => {
    if (isMounted && useCurrentLocation && takeLocation && !hasProps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (onLocationSelect) {
            onLocationSelect({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          }
        },
        () => console.warn("GPS Denied"),
        { enableHighAccuracy: true }
      );
    }
  }, [useCurrentLocation, takeLocation, hasProps, isMounted, onLocationSelect]);

  // --- SEARCH HANDLERS ---
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      
      if (!res.ok) throw new Error("Failed to fetch data");
      
      const data = await res.json();
      
      if (data.length === 0) {
        setSearchError('No locations found. Try a different spelling.');
      } else {
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchError('Network error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    const selectedLat = parseFloat(result.lat);
    const selectedLng = parseFloat(result.lon);
    
    // Pass coordinates back to parent page. 
    // This will update the parent's state, which passes new props down, triggering the map to fly.
    if (onLocationSelect) {
      onLocationSelect({ lat: selectedLat, lng: selectedLng });
    }
    
    // Close & Reset Search
    setSearchResults([]);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchError('');
  };

  if (!isMounted) return <div className="map-skeleton skeleton-pulse" style={{ height: '100%', minHeight: '300px', width: '100%', background: '#f0f0f0', borderRadius: '12px' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {label && <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', flexShrink: 0 }}>{label}</label>}
      
      <div style={{ flex: 1, position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)', minHeight: '300px' }}>
        
        {/* Search Overlay */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {!isSearchOpen ? (
            <button 
              type="button"
              onClick={() => setIsSearchOpen(true)}
              style={{
                background: 'white', border: 'none', borderRadius: '8px', width: '40px', height: '40px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
              title="Search Location"
            >
              <MagnifyingGlassIcon style={{ width: 20, height: 20, color: '#374151' }} />
            </button>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: '300px', overflow: 'hidden' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: (searchResults.length > 0 || searchError) ? '1px solid #E5E7EB' : 'none' }}>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search area, street, or city..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem', color: '#1F2937', background: 'transparent' }}
                />
                
                {/* Clickable Search Button */}
                <button 
                  type="submit" 
                  disabled={isSearching || !searchQuery.trim()}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', marginRight: '4px', opacity: isSearching ? 0.5 : 1 }}
                  title="Search"
                >
                  <MagnifyingGlassIcon style={{ width: 20, height: 20, color: '#10B981' }} />
                </button>

                {isSearching ? (
                  <div style={{ width: '20px', height: '20px', border: '2px solid #E5E7EB', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <button type="button" onClick={() => { setIsSearchOpen(false); setSearchResults([]); setSearchError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <XMarkIcon style={{ width: 20, height: 20, color: '#9CA3AF' }} />
                  </button>
                )}
              </form>
              
              {/* Search Results / Error Dropdown */}
              {(searchResults.length > 0 || searchError) && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white' }}>
                  
                  {/* Error State */}
                  {searchError && (
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontSize: '0.85rem' }}>
                      <ExclamationCircleIcon style={{ width: 18, height: 18 }} />
                      <span>{searchError}</span>
                    </div>
                  )}

                  {/* Results List */}
                  {!searchError && searchResults.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {searchResults.map((res, i) => (
                        <li 
                          key={i} 
                          onClick={() => handleSelectResult(res)}
                          style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', fontSize: '0.85rem', color: '#4B5563', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {res.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* The Map */}
        <MapContainer center={[activeLat, activeLng]} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 0 }} scrollWheelZoom={true}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController lat={activeLat} lng={activeLng} zoom={zoom} onLocationSelect={onLocationSelect} />
        </MapContainer>
        
      </div>
    </div>
  );
}