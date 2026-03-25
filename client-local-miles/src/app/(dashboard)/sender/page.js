'use client';
import { 
  ArchiveBoxIcon, CurrencyDollarIcon, TruckIcon, 
  PlusIcon, PhoneIcon, BellIcon, QuestionMarkCircleIcon 
} from '@heroicons/react/24/solid'; 

import '@/styles/SenderDashboard.css';

export default function SenderPage() {
  return (
    <div className="page-container sender-dashboard-scope">
      {/* HEADER */}
      <header className="page-header">
        <div>
          <h1>Good Morning, Alex</h1>
          <p>Manage your shipments and track your active deliveries in real-time.</p>
        </div>
        <div className="header-icons">
          <button className="icon-btn" title="Notifications">
            <BellIcon className="icon-20"/>
          </button>
          <button className="icon-btn" title="Help">
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
              <div className="stat-val">24</div>
              <span className="trend positive">↗ +12% this month</span>
            </div>

            <div className="card stat-card">
              <div className="stat-top">
                <span className="label">Total Spent</span>
                <div className="icon-bg green">
                  <CurrencyDollarIcon className="icon-20"/>
                </div>
              </div>
              <div className="stat-val">$1,240</div>
              <span className="trend neutral">Last 30 days</span>
            </div>

            <div className="card stat-card">
              <div className="stat-top">
                <span className="label">Active Shipments</span>
                <div className="icon-bg blue">
                  <TruckIcon className="icon-20"/>
                </div>
              </div>
              <div className="stat-val">1</div>
              <span className="trend highlight">In transit</span>
            </div>
          </div>

          {/* 2. Promo Banner (New Feature Element) */}
          <div className="card promo-banner">
            <div className="promo-content-wrapper">
              <div className="promo-text">
                <span className="badge">New Feature</span>
                <h2>Ready to ship something new?</h2>
                <p>Our couriers are nearby and ready to pick up your package. Use our new bulk upload tool for faster processing.</p>
                <div className="promo-actions">
                  <button className="btn-primary">
                    <PlusIcon className="icon-16"/> Send a Package Now
                  </button>
                  <button className="btn-secondary">Get Quote</button>
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
              <button className="view-all">View All</button>
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
                  <tr>
                    <td className="fw-bold">#LM-8832</td>
                    <td>Sarah Jenkins</td>
                    <td>Downtown, Apt 4B</td>
                    <td><span className="pill pending">Pending</span></td>
                    <td className="fw-bold">$12.50</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">#LM-8831</td>
                    <td>Tech Corp Inc.</td>
                    <td>Business District</td>
                    <td><span className="pill delivered">Delivered</span></td>
                    <td className="fw-bold">$34.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TRACKING */}
        <div className="right-sidebar">
          <div className="tracking-card">
            <div className="track-header">
              <div>
                <h3>Active Delivery</h3>
                <span className="sub-text">Tracking #LM-8832</span>
              </div>
              <span className="live-badge">Live</span>
            </div>

            <div className="map-view">
              <div className="route-path"></div>
              <div className="courier-dot">
                 <div className="pulse-ring"></div>
                 <div className="face">MK</div>
              </div>
              <div className="eta-tag">2 mins away</div>
            </div>

            <div className="courier-details">
              <div className="courier-profile">
                <div className="c-avatar">MK</div>
                <div>
                  <h4>Mahesh Kumar</h4>
                  <p>★ 4.9 • 240 Trips</p>
                </div>
                <button className="phone-btn" title="Call Courier">
                  <PhoneIcon className="icon-20"/>
                </button>
              </div>
              <div className="timeline">
                <div className="timeline-item done">
                  <div className="dot"></div>
                  <div>
                    <strong>Accepting Order</strong>
                    <p>10:24 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}