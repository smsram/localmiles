'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrophyIcon, ArrowRightIcon, TruckIcon, ClockIcon,
  ChevronLeftIcon, ChevronRightIcon
} from '@heroicons/react/24/solid'; 
import { BuildingLibraryIcon } from '@heroicons/react/24/outline';

import Skeleton from '@/components/ui/Skeleton';
import ToastNotification from '@/components/ui/ToastNotification';
import Modal from '@/components/ui/Modal'; 
import '@/styles/CourierEarningsPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DAILY_TRIP_GOAL = 5; 

const formatHours = (decimalHours) => {
  if (!decimalHours) return '0h 0m';
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  if (hrs === 0 && mins === 0) return '0h 0m';
  return `${hrs}h ${mins}m`;
};

function WithdrawModal({ isOpen, onClose, balance, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert("Enter a valid amount");
    if (val > balance) return alert("Insufficient balance");

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: val, appMode: 'COURIER' })
      });
      const data = await res.json();
      
      if (data.success) {
        onSuccess(data.message);
        setAmount('');
      } else {
        alert(data.message || "Withdrawal failed");
      }
    } catch (err) { 
      alert("Network error"); 
    } finally { 
      setProcessing(false); 
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="400px">
      <div style={{ textAlign: 'center' }}>
        <BuildingLibraryIcon width={48} style={{ color: 'var(--brand-gold)', margin: '0 auto 16px' }} />
        <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>Withdraw Funds</h2>
        
        <div style={{ background: 'var(--bg-page)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Available Balance</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>₹{balance.toFixed(2)}</p>
        </div>

        <form onSubmit={handleWithdraw}>
          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Amount to Withdraw (₹)
            </label>
            <input 
              type="number" min="1" max={balance} step="0.01" 
              value={amount} onChange={e => setAmount(e.target.value)} 
              required placeholder="0.00"
              style={{ 
                width: '100%', padding: '16px', fontSize: '1.5rem', fontWeight: 700, 
                borderRadius: '12px', border: '2px solid var(--border-light)', 
                background: 'var(--bg-page)', color: 'var(--text-main)', outline: 'none'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', background: 'var(--brand-gold)', color: '#171717', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }} 
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Transfer to Bank'}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export default function CourierEarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [weeksAgo, setWeeksAgo] = useState(0);

  const fetchEarnings = async (weekOffset = 0) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const res = await fetch(`${API_URL}/wallet/earnings?weeksAgo=${weekOffset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error(error);
      setToast({ show: true, message: "Failed to load stats", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEarnings(weeksAgo); }, [weeksAgo, router]);

  const handleWithdrawSuccess = (msg) => {
    setShowWithdraw(false);
    setToast({ show: true, message: msg, type: 'success' });
    fetchEarnings(weeksAgo); 
  };

  const maxEarning = stats?.weeklyData ? Math.max(100, ...stats.weeklyData.map(d => d.earnings || 0)) : 100;
  const maxHours = stats?.weeklyData ? Math.max(2, ...stats.weeklyData.map(d => d.hours || 0)) : 2;
  
  const currentTrips = stats?.todayTrips || 0;
  const goalProgress = Math.min((currentTrips / DAILY_TRIP_GOAL) * 100, 100);
  const remainingTrips = Math.max(0, DAILY_TRIP_GOAL - currentTrips);

  // Safely extract transactions from the new API structure
  // The API might send `combinedActivity` or `recentTransactions` depending on the controller logic.
  // We filter to ensure only TXN types show here if using the combined array.
  const transactions = stats?.recentTransactions || 
                       (stats?.combinedActivity ? stats.combinedActivity.filter(i => i.type === 'TXN').map(i => i.data) : []);

  if (loading && !stats) {
    return (
      <div className="page-container earnings-page fade-in">
        <Skeleton width="250px" height="40px" style={{ marginBottom: '32px' }} />
        <div className="stats-grid">
          <Skeleton width="100%" height="180px" borderRadius="16px" />
          <Skeleton width="100%" height="180px" borderRadius="16px" />
          <Skeleton width="100%" height="180px" borderRadius="16px" />
        </div>
        <Skeleton width="100%" height="100px" borderRadius="16px" style={{ marginBottom: '32px' }} />
        <Skeleton width="100%" height="300px" borderRadius="16px" />
      </div>
    );
  }

  return (
    <div className="page-container earnings-page fade-in">
      
      {/* 1. HEADER */}
      <div className="page-header">
        <h1 className="page-title">Earnings & Rewards</h1>
        <div className="status-pill">
          <div className="status-dot"></div>
          ONLINE
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="stats-grid">
        
        <div className="stat-card">
          <div>
            <div className="card-label">
              TOTAL BALANCE
              <BuildingLibraryIcon style={{width: 20, color: 'var(--brand-gold)'}} />
            </div>
            <div className="balance-amount">₹ {stats?.balance.toFixed(2) || '0.00'}</div>
          </div>
          <button className="btn-withdraw" onClick={() => setShowWithdraw(true)} disabled={!stats || stats.balance <= 0}>
            Withdraw <ArrowRightIcon style={{ width: 16 }} />
          </button>
        </div>

        <div className="stat-card">
          <div>
            <div className="card-label">
              TODAY'S PERFORMANCE
              <span className="badge-green">Active</span>
            </div>
            <div className="perf-row">
              <span className="perf-val">₹ {stats?.todayEarnings?.toFixed(2) || '0.00'}</span>
              <span className="perf-unit">Earned</span>
            </div>
          </div>
          <div className="trips-info">
            <TruckIcon style={{ width: 20, color: 'var(--brand-gold)' }} />
            {currentTrips} Trips
          </div>
        </div>

        <div className="stat-card">
          <div className="card-label">TODAY'S ONLINE TIME</div>
          <div className="hours-val" style={{ fontSize: '2.4rem' }}>
            {formatHours(stats?.onlineHours)}
          </div>
          <div className="shift-start">Shift tracking active</div>
          <ClockIcon className="bg-icon-decor" />
        </div>

      </div>

      {/* 3. DAILY GOAL CARD */}
      <div className="goal-card">
        <div className="goal-info">
          <div className="goal-title">
            <TrophyIcon style={{ width: 24, color: 'var(--brand-gold)' }} />
            Daily Goal
          </div>
          <div className="goal-sub">
            {remainingTrips > 0 
              ? `Complete ${remainingTrips} more trips today to unlock a ` 
              : "Goal reached! You've unlocked the "}
            <span className="highlight-gold">₹50 Bonus!</span>
          </div>
        </div>

        <div className="goal-progress">
          <div className="progress-header">
            <span>Progress ({currentTrips}/{DAILY_TRIP_GOAL})</span>
            <span>{goalProgress.toFixed(0)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${goalProgress}%`, background: goalProgress === 100 ? '#10B981' : '' }}></div>
          </div>
        </div>
      </div>

      {/* 4. VISUAL WEEKLY CHART (DUAL BAR) */}
      <div className="chart-section">
        <div className="chart-header" style={{ marginBottom: '24px' }}>
          <h2 className="chart-title">Weekly Performance</h2>
          
          <div className="chart-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setWeeksAgo(prev => prev + 1)} 
              style={{ background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-main)' }}
            >
              <ChevronLeftIcon style={{width: 16}} />
            </button>
            <span style={{ width: '110px', textAlign: 'center', fontWeight: 800 }}>
              {weeksAgo === 0 ? 'THIS WEEK' : weeksAgo === 1 ? 'LAST WEEK' : `${weeksAgo} WEEKS AGO`}
            </span>
            <button 
              onClick={() => setWeeksAgo(prev => Math.max(0, prev - 1))} 
              disabled={weeksAgo === 0}
              style={{ background: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '4px 8px', cursor: weeksAgo === 0 ? 'not-allowed' : 'pointer', opacity: weeksAgo === 0 ? 0.3 : 1, color: 'var(--text-main)' }}
            >
              <ChevronRightIcon style={{width: 16}} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--brand-gold)' }}></div> Earnings</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3B82F6' }}></div> Hours</div>
        </div>

        <div className="bar-chart-container">
          {stats?.weeklyData?.map((data, idx) => {
            const earnHeight = data.earnings > 0 ? Math.max((data.earnings / maxEarning) * 100, 4) : 0;
            const hourHeight = data.hours > 0 ? Math.max((data.hours / maxHours) * 100, 4) : 0;
            
            return (
              <div key={idx} className="chart-column group">
                <div className="dual-bar-bg">
                  <div className={`bar-fill earning ${data.active ? 'active' : ''}`} style={{ height: `${earnHeight}%` }}></div>
                  <div className={`bar-fill hour ${data.active ? 'active' : ''}`} style={{ height: `${hourHeight}%` }}></div>
                  
                  {(data.earnings > 0 || data.hours > 0) && (
                    <div className="bar-tooltip">
                      <div style={{ color: 'var(--brand-gold)' }}>₹{data.earnings.toFixed(0)}</div>
                      <div style={{ color: '#93C5FD' }}>{formatHours(data.hours)}</div>
                    </div>
                  )}
                </div>
                <span className={`x-label ${data.active ? 'active' : ''}`}>{data.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TRANSACTION HISTORY */}
      <div className="history-section">
        <div className="history-header">
          <h2 className="chart-title">Recent Transactions</h2>
          <Link href="/courier/earnings/transactions" className="view-all-btn">View All</Link>
        </div>

        <div className="table-wrapper">
          <table className="txn-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Date & Time</th>
                <th className="col-details">Details</th>
                <th style={{textAlign: 'right'}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px', color: 'var(--text-muted)'}}>No earnings history yet.</td></tr>
              ) : (
                transactions.map((txn, idx) => (
                  <tr key={idx}>
                    <td className="txn-id">{txn.referenceId || txn.id.split('-')[0].substring(0,8)}...</td>
                    <td className="txn-time">{new Date(txn.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="col-details">{txn.description}</td>
                    <td className="txn-amt" style={{textAlign: 'right', color: txn.type === 'DEBIT' ? '#EF4444' : '#10B981', fontWeight: 800}}>
                      {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} balance={stats?.balance || 0} onSuccess={handleWithdrawSuccess} />
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}