'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapIcon, ClockIcon, ArrowRightIcon, CubeIcon, 
  DocumentCheckIcon, WrenchScrewdriverIcon, MapPinIcon, 
  BanknotesIcon // <-- FIXED: BanknotesIcon imported here
} from '@heroicons/react/24/solid';

import Skeleton from '@/components/ui/Skeleton';
import NotificationPanel from '@/components/ui/NotificationPanel';
import '@/styles/CourierDashboard.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const formatHours = (decimalHours) => {
  if (!decimalHours) return '0h 0m';
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  if (hrs === 0 && mins === 0) return '0h 0m';
  return `${hrs}h ${mins}m`;
};

export default function CourierPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const res = await fetch(`${API_URL}/wallet/earnings?weeksAgo=0`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) setStats(data.data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [router]);

  if (loading) {
    return (
      <div className="page-container">
        <Skeleton width="200px" height="40px" style={{ marginBottom: '30px' }} />
        <div className="stats-row" style={{ marginBottom: '24px' }}>
          <Skeleton width="100%" height="160px" borderRadius="16px" />
          <Skeleton width="100%" height="160px" borderRadius="16px" />
          <Skeleton width="100%" height="160px" borderRadius="16px" />
        </div>
        <Skeleton width="100%" height="400px" borderRadius="16px" />
      </div>
    );
  }

  // Goal calculation logic
  const dailyGoal = 8;
  const currentTrips = stats?.todayTrips || 0;
  const goalProgress = Math.min((currentTrips / dailyGoal) * 100, 100);
  const remainingTrips = Math.max(0, dailyGoal - currentTrips);

  return (
    <div className="page-container fade-in">
      
      {/* HEADER */}
      <header className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Welcome back, ready to drive?</p>
        </div>
        <div className="header-actions">
          
          {/* SELF-CONTAINED NOTIFICATION PANEL */}
          <NotificationPanel />

          <div className="status-badge">
            <div className="dot-online"></div>
            Online
          </div>
        </div>
      </header>

      {/* TOP STATS ROW */}
      <div className="stats-row">
        <div className="card">
          <div className="stat-header">
            <span className="label">TODAY'S EARNINGS</span>
            {stats?.todayEarnings > 0 && <span className="growth-tag">Active</span>}
          </div>
          <div className="currency-val">
            ₹ {stats?.todayEarnings ? Math.floor(stats.todayEarnings) : '0'}
            <span className="currency-decimal">
              .{stats?.todayEarnings ? (stats.todayEarnings % 1).toFixed(2).substring(2) : '00'}
            </span>
          </div>
          <div className="sub-text">
            <ClockIcon className="icon-16"/> Last updated: Just now
          </div>
        </div>

        <div className="card">
          <div className="stat-header">
            <div className="icon-bg-circle"><DocumentCheckIcon className="icon-20"/></div>
            <span className="label">Daily Goal: {dailyGoal}</span>
          </div>
          <div>
            <div className="stat-val">{currentTrips} <span className="stat-unit">trips</span></div>
            <div className="sub-text">Completed today</div>
            <div className="progress-container">
              <div className="progress-fill" style={{ width: `${goalProgress}%`, background: goalProgress === 100 ? '#10B981' : '' }}></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="stat-header">
            <div className="icon-bg-circle"><ClockIcon className="icon-20"/></div>
          </div>
          <div>
            <div className="stat-val" style={{ fontSize: '1.8rem' }}>
              {formatHours(stats?.onlineHours)}
            </div>
            <div className="sub-text">Online Duration</div>
            <div className="shift-tag">Shift tracking active</div>
          </div>
        </div>
      </div>

      <div style={{height: '24px'}}></div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        
        {/* LEFT: ROUTE MATCHER */}
        <div className="card route-card">
          <div className="route-header">
            <div className="trip-planner-badge">
               <MapIcon className="icon-24" />
               <span>TRIP PLANNER</span>
            </div>
            <h2>Starting a new trip?</h2>
            <p>Find high-value deliveries along your preferred route.</p>
          </div>

          <div className="input-group">
            <div className="input-field">
              <label className="input-label">START POINT</label>
              <div className="input-wrapper">
                <MapPinIcon className="icon-20 opacity-50"/>
                <input type="text" placeholder="Current Location" readOnly />
              </div>
            </div>
            <div className="input-field">
              <label className="input-label">DESTINATION</label>
              <div className="input-wrapper">
                <MapPinIcon className="icon-20 opacity-50"/>
                <input type="text" placeholder="Where are you heading?" readOnly />
              </div>
            </div>
          </div>

          <button className="btn-match" onClick={() => router.push('/courier/route')}>
            Setup Route <ArrowRightIcon className="icon-20" />
          </button>
        </div>

        {/* RIGHT: RECENT ACTIVITY */}
        <div className="right-sidebar">
          <div className="card no-padding overflow-hidden">
            <div className="list-padding">
              <div className="list-header">
                <h3>Recent Activity</h3>
                <button className="view-all" onClick={() => router.push('/courier/activities')}>View All</button>
              </div>
            </div>
            
            <div className="list-padding-bottom">
              {stats?.combinedActivity?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No recent activity.</p>
              ) : (
                stats?.combinedActivity?.map((item, idx) => (
                  <div className="activity-item" key={idx}>
                    <div className="item-icon">
                      {item.type === 'TXN' ? <BanknotesIcon className="icon-24"/> : <CubeIcon className="icon-24"/>}
                    </div>
                    <div className="item-info">
                      <div className="item-top-row">
                        <h4>{item.type === 'TXN' ? 'Wallet Payout' : item.data.title}</h4>
                        <span className={`status-pill ${item.type === 'PKG' && item.data.status !== 'DELIVERED' ? 'transit' : 'done'}`}>
                          {item.type === 'TXN' ? 'Credit' : item.data.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p>
                        {item.type === 'TXN' 
                          ? `Ref: ${item.data.referenceId || item.data.id.substring(0, 8)}` 
                          : `To: ${item.data.dropAddress.split(',')[0]}`}
                      </p>
                      <span className="item-price">
                        {item.type === 'TXN' ? `+ ₹${item.data.amount.toFixed(2)}` : `₹${item.data.price.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM PRO TIP */}
      <div className="pro-tip">
        <div className="tip-icon">💡</div>
        <div className="tip-content">
          <strong>Pro Tip: {remainingTrips > 0 ? `Complete ${remainingTrips} more trips to hit your daily goal!` : `Daily goal reached! Great job.`}</strong>
          <p>Consistency builds your reputation rating and unlocks higher-paying routes.</p>
        </div>
      </div>
    </div>
  );
}