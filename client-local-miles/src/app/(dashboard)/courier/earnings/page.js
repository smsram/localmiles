'use client';
import { 
  TrophyIcon, 
  ArrowRightIcon, 
  TruckIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid'; 
import { 
  BuildingLibraryIcon 
} from '@heroicons/react/24/outline';

import '@/styles/CourierEarningsPage.css';

// --- MOCK DATA ---
const weeklyData = [
  { day: 'Mon', val: 0 },
  { day: 'Tue', val: 0 },
  { day: 'Wed', val: 0 },
  { day: 'Thu', val: 0 },
  { day: 'Fri', val: 0 },
  { day: 'Sat', val: 0 },
  { day: 'Sun', val: 450, active: true }, 
];

const transactions = [
  { id: '#TR-8821', time: 'Today, 2:30 PM', detail: 'Delivery to Anna Nagar', amt: '+ ₹140.00' },
  { id: '#TR-8820', time: 'Yesterday, 5:15 PM', detail: 'Delivery to T. Nagar', amt: '+ ₹90.00' },
  { id: '#TR-8819', time: 'Yesterday, 1:00 PM', detail: 'Delivery to Velachery', amt: '+ ₹220.00' }
];

export default function CourierEarningsPage() {
  const maxVal = 500; 

  return (
    <div className="page-container earnings-page">
      
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
            <div className="balance-amount">₹ 1,250.00</div>
          </div>
          <button className="btn-withdraw">
            Withdraw <ArrowRightIcon style={{ width: 16 }} />
          </button>
        </div>

        {/* Card 2: Performance */}
        <div className="stat-card">
          <div>
            <div className="card-label">
              TODAY'S PERFORMANCE
              <span className="badge-green">+12%</span>
            </div>
            <div className="perf-row">
              <span className="perf-val">₹ 450</span>
              <span className="perf-unit">Earned</span>
            </div>
          </div>
          <div className="trips-info">
            <TruckIcon style={{ width: 20, color: 'var(--brand-gold)' }} />
            3 Trips
          </div>
        </div>

        {/* Card 3: Hours */}
        <div className="stat-card">
          <div className="card-label">ONLINE HOURS</div>
          <div className="hours-val">
            5.5 <span className="hours-unit">Hrs</span>
          </div>
          <div className="shift-start">Shift started at 9:00 AM</div>
          <ClockIcon className="bg-icon-decor" />
        </div>

      </div>

      {/* 3. DAILY GOAL CARD (Theme Consistent) */}
      <div className="goal-card">
        <div className="goal-info">
          <div className="goal-title">
            <TrophyIcon style={{ width: 24, color: 'var(--brand-gold)' }} />
            Daily Goal
          </div>
          <div className="goal-sub">
            Earn <span className="highlight-gold">₹50</span> more to unlock a <span className="highlight-gold">₹20 Bonus!</span>
          </div>
        </div>

        <div className="goal-progress">
          <div className="progress-header">
            <span>Progress</span>
            <span>80%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '80%' }}></div>
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
          {weeklyData.map((data, idx) => {
            const heightPercent = (data.val / maxVal) * 100;
            return (
              <div key={idx} className="chart-column">
                <div className="bar-bg">
                  <div 
                    className={`bar-fill ${data.active ? 'active' : ''}`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    {data.active && (
                      <div className="bar-tooltip">₹{data.val}</div>
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
          <h2 className="chart-title">Transaction History</h2>
          <button className="view-all-btn">View All</button>
        </div>

        <div className="table-wrapper">
          <table className="txn-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Date & Time</th>
                <th className="col-details">Details</th>
                <th style={{textAlign: 'right'}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, idx) => (
                <tr key={idx}>
                  <td className="txn-id">{txn.id}</td>
                  <td className="txn-time">{txn.time}</td>
                  <td className="col-details">{txn.detail}</td>
                  <td className="txn-amt green-text">{txn.amt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}