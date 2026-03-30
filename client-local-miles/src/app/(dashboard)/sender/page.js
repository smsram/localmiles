'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArchiveBoxIcon, CurrencyRupeeIcon, TruckIcon, 
  PlusIcon, PhoneIcon, BellIcon, QuestionMarkCircleIcon,
  MapIcon // Added missing import
} from '@heroicons/react/24/solid'; 

import Skeleton from '@/components/ui/Skeleton';
import NotificationPanel from '@/components/ui/NotificationPanel';
import '@/styles/SenderDashboard.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SenderPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // 1. Get user info for greeting
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserName(parsed.fullName?.split(' ')[0] || 'User');
    }

    // 2. Fetch Dashboard Data
    const fetchSenderStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        // Note: Using the new dedicated sender endpoint
        const res = await fetch(`${API_URL}/sender/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to load sender stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSenderStats(); // Called the correct function name here
  }, [router]);

  if (loading) {
    return (
      <div className="page-container sender-dashboard-scope">
        <Skeleton width="300px" height="40px" style={{ marginBottom: '24px' }} />
        <div className="stats-row" style={{ marginBottom: '24px' }}>
          <Skeleton width="100%" height="120px" borderRadius="16px" />
          <Skeleton width="100%" height="120px" borderRadius="16px" />
          <Skeleton width="100%" height="120px" borderRadius="16px" />
        </div>
        <Skeleton width="100%" height="400px" borderRadius="16px" />
      </div>
    );
  }

  return (
    <div className="page-container sender-dashboard-scope" style={{ position: 'relative' }}>
      
      {/* NOTIFICATION PANEL - Self contained bell logic inside */}
      <div className="header-notification-wrapper" style={{ position: 'absolute', top: '40px', right: '100px', zIndex: 10 }}>
         {/* Since your NotificationPanel handles its own icon, we can put it here or replace the button below */}
      </div>

      {/* HEADER */}
      <header className="page-header">
        <div>
          <h1>Good Morning, {userName}</h1>
          <p>Manage your shipments and track your active deliveries in real-time.</p>
        </div>
        <div className="header-icons">
          
          {/* Replaced manual button with the interactive Notification Component */}
          <NotificationPanel />

          <button className="icon-btn" title="Help" onClick={() => router.push('/help')}>
            <QuestionMarkCircleIcon className="icon-20"/>
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="main-content">
          
          {/* 1. Stats Row */}
          <div className="stats-row">
            <div className="card stat-card">
              <div className="stat-top">
                <span className="label">Packages Sent</span>
                <div className="icon-bg gold">
                  <ArchiveBoxIcon className="icon-20"/>
                </div>
              </div>
              <div className="stat-val">{stats?.totalPackages || 0}</div>
              <span className="trend positive">Lifetime</span>
            </div>

            <div className="card stat-card">
              <div className="stat-top">
                <span className="label">Total Spent</span>
                <div className="icon-bg green">
                  <CurrencyRupeeIcon className="icon-20"/>
                </div>
              </div>
              <div className="stat-val">₹{stats?.totalSpent?.toFixed(2) || '0.00'}</div>
              <span className="trend neutral">Lifetime</span>
            </div>

            <div className="card stat-card">
              <div className="stat-top">
                <span className="label">Active Shipments</span>
                <div className="icon-bg blue">
                  <TruckIcon className="icon-20"/>
                </div>
              </div>
              <div className="stat-val">{stats?.activeCount || 0}</div>
              <span className="trend highlight">{stats?.activeCount > 0 ? 'On the move' : 'All clear'}</span>
            </div>
          </div>

          {/* 2. Promo Banner */}
          <div className="card promo-banner">
            <div className="promo-content-wrapper">
              <div className="promo-text">
                <span className="badge">Express Service</span>
                <h2>Ready to ship something new?</h2>
                <p>Our couriers are nearby and ready to pick up your package. Create a new delivery request in seconds.</p>
                <div className="promo-actions">
                  <button className="btn-primary" onClick={() => router.push('/sender/new')}>
                    <PlusIcon className="icon-16"/> Send a Package Now
                  </button>
                </div>
              </div>
              <div className="promo-visual">
                 <TruckIcon className="promo-icon-large" />
              </div>
            </div>
          </div>

          {/* 3. Recent Shipments Table */}
          <div className="card table-section">
            <div className="table-header">
              <h3>Recent Shipments</h3>
              <button className="view-all" onClick={() => router.push('/sender/shipments')}>View All</button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>TRACKING ID</th>
                    <th>RECIPIENT</th>
                    <th>DESTINATION</th>
                    <th>STATUS</th>
                    <th>COST</th>
                  </tr>
                </thead>
                <tbody>
                  {!stats?.recentShipments || stats.recentShipments.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No shipments found.</td>
                    </tr>
                  ) : (
                    stats.recentShipments.map(pkg => (
                      <tr key={pkg.publicId}>
                        <td className="fw-bold cursor-pointer" onClick={() => router.push(`/track/${pkg.publicId}`)} style={{color: 'var(--brand-gold)'}}>
                          #{pkg.publicId.split('-')[0]}
                        </td>
                        <td>{pkg.receiverName}</td>
                        <td>{pkg.dropAddress.split(',')[0]}</td>
                        <td>
                          <span className={`pill ${pkg.status.toLowerCase()}`}>
                            {pkg.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="fw-bold">₹{pkg.price.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TRACKING */}
        <div className="right-sidebar">
          <div className="tracking-card">
            {stats?.liveDelivery ? (
              <>
                <div className="track-header">
                  <div>
                    <h3>Active Delivery</h3>
                    <span className="sub-text">Tracking #{stats.liveDelivery.publicId.split('-')[0]}</span>
                  </div>
                  <span className="live-badge">Live</span>
                </div>

                <div className="map-view" style={{ cursor: 'pointer' }} onClick={() => router.push(`/track/${stats.liveDelivery.publicId}`)}>
                  <div className="route-path"></div>
                  <div className="courier-dot">
                     <div className="pulse-ring"></div>
                     <div className="face">{stats.liveDelivery.courier?.fullName?.charAt(0) || 'C'}</div>
                  </div>
                  <div className="eta-tag">{stats.liveDelivery.status.replace('_', ' ')}</div>
                </div>

                <div className="courier-details">
                  <div className="courier-profile">
                    <div className="c-avatar">{stats.liveDelivery.courier?.fullName?.charAt(0) || '?'}</div>
                    <div>
                      <h4>{stats.liveDelivery.courier?.fullName || 'Assigning Courier...'}</h4>
                      <p>Contact ready on pickup</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <MapIcon style={{ width: '48px', color: 'var(--border-light)', margin: '0 auto 16px' }} />
                <h3>No Active Deliveries</h3>
                <p style={{ fontSize: '0.9rem' }}>When you send a package, you can track it live right here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}