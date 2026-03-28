'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrophyIcon, ArrowRightIcon, TruckIcon, ClockIcon,
  ChevronLeftIcon, ChevronRightIcon, XMarkIcon
} from '@heroicons/react/24/solid'; 
import { BuildingLibraryIcon } from '@heroicons/react/24/outline';

import Skeleton from '@/components/ui/Skeleton';
import ToastNotification from '@/components/ui/ToastNotification';
import '@/styles/CourierEarningsPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- WITHDRAW MODAL ---
function WithdrawModal({ isOpen, onClose, balance, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

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
        body: JSON.stringify({ 
          amount: val, 
          appMode: 'COURIER'
        })
      });
      const data = await res.json();
      
      if (data.success) {
        onSuccess(data.message);
        setAmount('');
      } else {
        alert(data.message || "Withdrawal failed");
      }
    } catch (err) { alert("Network error"); }
    finally { setProcessing(false); }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content fade-in" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>Withdraw to Bank</h3>
          <button onClick={onClose} className="close-modal-btn"><XMarkIcon className="icon-24" /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
            Available Balance: <strong>₹{balance.toFixed(2)}</strong>
          </p>
          <form onSubmit={handleWithdraw}>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input 
                type="number" min="1" max={balance} step="0.01" 
                value={amount} onChange={e => setAmount(e.target.value)} 
                className="input-field" required placeholder="Enter amount..."
                style={{ background: 'var(--bg-page)', border: '1px solid var(--border-light)' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function CourierEarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const res = await fetch(`${API_URL}/wallet/earnings`, {
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

  useEffect(() => { fetchEarnings(); }, [router]);

  const handleWithdrawSuccess = (msg) => {
    setShowWithdraw(false);
    setToast({ show: true, message: msg, type: 'success' });
    fetchEarnings(); // Refresh balance
  };

  // Find max value in weekly chart to scale bars appropriately
  const maxVal = stats?.weeklyData ? Math.max(500, ...stats.weeklyData.map(d => d.val)) : 500;

  if (loading) {
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
        
        {/* Card 1: Balance */}
        <div className="stat-card">
          <div>
            <div className="card-label">
              TOTAL BALANCE
              <BuildingLibraryIcon style={{width: 20, color: 'var(--brand-gold)'}} />
            </div>
            <div className="balance-amount">₹ {stats.balance.toFixed(2)}</div>
          </div>
          <button className="btn-withdraw" onClick={() => setShowWithdraw(true)} disabled={stats.balance <= 0}>
            Withdraw <ArrowRightIcon style={{ width: 16 }} />
          </button>
        </div>

        {/* Card 2: Performance */}
        <div className="stat-card">
          <div>
            <div className="card-label">
              TODAY'S PERFORMANCE
              <span className="badge-green">Active</span>
            </div>
            <div className="perf-row">
              <span className="perf-val">₹ {stats.todayEarnings.toFixed(2)}</span>
              <span className="perf-unit">Earned</span>
            </div>
          </div>
          <div className="trips-info">
            <TruckIcon style={{ width: 20, color: 'var(--brand-gold)' }} />
            {stats.todayTrips} Trips
          </div>
        </div>

        {/* Card 3: Hours */}
        <div className="stat-card">
          <div className="card-label">ONLINE HOURS</div>
          <div className="hours-val">
            {stats.onlineHours} <span className="hours-unit">Hrs</span>
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
            Complete 5 trips today to unlock a <span className="highlight-gold">₹50 Bonus!</span>
          </div>
        </div>

        <div className="goal-progress">
          <div className="progress-header">
            <span>Progress ({stats.todayTrips}/5)</span>
            <span>{Math.min((stats.todayTrips / 5) * 100, 100)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min((stats.todayTrips / 5) * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* 4. WEEKLY CHART */}
      <div className="chart-section">
        <div className="chart-header">
          <h2 className="chart-title">Weekly Earnings</h2>
          <div className="chart-nav">
            <ChevronLeftIcon style={{width: 16}} />
            THIS WEEK
            <ChevronRightIcon style={{width: 16}} />
          </div>
        </div>

        <div className="bar-chart-container">
          {stats.weeklyData.map((data, idx) => {
            const heightPercent = (data.val / maxVal) * 100;
            return (
              <div key={idx} className="chart-column">
                <div className="bar-bg">
                  <div 
                    className={`bar-fill ${data.active ? 'active' : ''}`}
                    style={{ height: `${Math.max(heightPercent, 2)}%` }} // Give a tiny min-height so 0 isn't invisible
                  >
                    {data.val > 0 && (
                      <div className="bar-tooltip">₹{data.val.toFixed(0)}</div>
                    )}
                  </div>
                </div>
                <span className={`x-label ${data.active ? 'active' : ''}`}>
                  {data.day}
                </span>
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
              {stats.recentTransactions.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>No transactions found.</td></tr>
              ) : (
                stats.recentTransactions.map((txn, idx) => (
                  <tr key={idx}>
                    <td className="txn-id">{txn.id.split('-')[0].substring(0,8)}...</td>
                    <td className="txn-time">{new Date(txn.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="col-details">{txn.description}</td>
                    <td className={`txn-amt ${txn.type === 'CREDIT' ? 'green-text' : 'red-text'}`} style={{textAlign: 'right', color: txn.type === 'DEBIT' ? '#EF4444' : '#10B981', fontWeight: 'bold'}}>
                      {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} balance={stats.balance} onSuccess={handleWithdrawSuccess} />
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}