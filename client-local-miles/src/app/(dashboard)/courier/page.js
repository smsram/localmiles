'use client';
import { 
  MapIcon, ClockIcon, BellIcon, 
  ArrowRightIcon, CubeIcon, DocumentCheckIcon, WrenchScrewdriverIcon,
  MapPinIcon
} from '@heroicons/react/24/solid';

import '@/styles/CourierDashboard.css';

export default function CourierPage() {
  return (
    <div className="page-container">
      {/* HEADER */}
      <header className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Welcome back, ready to drive?</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn">
            <BellIcon className="icon-24" />
          </button>
          <div className="status-badge">
            <div className="dot-online"></div>
            Online
          </div>
        </div>
      </header>

      {/* TOP STATS ROW */}
      <div className="stats-row">
        {/* Card 1: Earnings */}
        <div className="card">
          <div className="stat-header">
            <span className="label">TODAY'S EARNINGS</span>
            <span className="growth-tag">+12%</span>
          </div>
          <div className="currency-val">₹ 1,450<span className="currency-decimal">.00</span></div>
          <div className="sub-text">
            <ClockIcon className="icon-16"/> Last updated: Just now
          </div>
        </div>

        {/* Card 2: Trips */}
        <div className="card">
          <div className="stat-header">
            <div className="icon-bg-circle">
              <DocumentCheckIcon className="icon-20"/>
            </div>
            <span className="label">Daily Goal: 8</span>
          </div>
          <div>
            <div className="stat-val">4 <span className="stat-unit">trips</span></div>
            <div className="sub-text">Completed today</div>
            <div className="progress-container">
              <div className="progress-fill" style={{width: '50%'}}></div>
            </div>
          </div>
        </div>

        {/* Card 3: Online Hours */}
        <div className="card">
          <div className="stat-header">
            <div className="icon-bg-circle">
              <ClockIcon className="icon-20"/>
            </div>
          </div>
          <div>
            <div className="stat-val">5.2 <span className="stat-unit">hours</span></div>
            <div className="sub-text">Online Duration</div>
            <div className="shift-tag">
              Shift ends in 3h
            </div>
          </div>
        </div>
      </div>

      <div style={{height: '24px'}}></div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        
        {/* LEFT: ROUTE MATCHER (Always High Contrast) */}
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
                <input type="text" placeholder="Current Location" />
              </div>
            </div>

            <div className="input-field">
              <label className="input-label">DESTINATION</label>
              <div className="input-wrapper">
                <MapPinIcon className="icon-20 opacity-50"/>
                <input type="text" placeholder="Where are you heading?" />
              </div>
            </div>
          </div>

          <button className="btn-match">
            Match Route <ArrowRightIcon className="icon-20" />
          </button>
        </div>

        {/* RIGHT: RECENT ACTIVITY */}
        <div className="right-sidebar">
          <div className="card no-padding overflow-hidden">
            <div className="list-padding">
              <div className="list-header">
                <h3>Recent Activity</h3>
                <button className="view-all">View All</button>
              </div>
            </div>
            
            <div className="list-padding-bottom">
              <div className="activity-item">
                <div className="item-icon">
                  <CubeIcon className="icon-24"/>
                </div>
                <div className="item-info">
                  <div className="item-top-row">
                    <h4>Electronics Box</h4>
                    <span className="status-pill transit">In Transit</span>
                  </div>
                  <p>To: 124 MG Road, Bangalore</p>
                  <span className="item-price">₹ 350.00</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="item-icon">
                  <DocumentCheckIcon className="icon-24"/>
                </div>
                <div className="item-info">
                  <div className="item-top-row">
                    <h4>Document Batch</h4>
                    <span className="status-pill done">Done</span>
                  </div>
                  <p>To: Tech Park, Indiranagar</p>
                  <span className="item-price">₹ 120.00</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="item-icon">
                  <WrenchScrewdriverIcon className="icon-24"/>
                </div>
                <div className="item-info">
                  <div className="item-top-row">
                    <h4>Spare Parts</h4>
                    <span className="status-pill done">Done</span>
                  </div>
                  <p>To: Auto Hub, Whitefield</p>
                  <span className="item-price">₹ 480.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM PRO TIP */}
      <div className="pro-tip">
        <div className="tip-icon">💡</div>
        <div className="tip-content">
          <strong>Pro Tip: Complete 2 more trips to unlock the Gold Bonus!</strong>
          <p>Earn an extra ₹ 500 for every 10 trips this week.</p>
        </div>
      </div>
    </div>
  );
}