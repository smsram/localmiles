'use client';
import { useState } from 'react';
import { 
  AdjustmentsHorizontalIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  MapIcon,
  MoonIcon,
  SpeakerWaveIcon,
  LockClosedIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  MapIcon as MapSolid 
} from '@heroicons/react/24/solid';

// Import Theme-Ready CSS
import '@/styles/CourierSettingsPage.css';

export default function CourierSettingsPage() {
  // State for controls
  const [navProvider, setNavProvider] = useState('google');
  const [language, setLanguage] = useState('en-in');
  const [darkMode, setDarkMode] = useState(false);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [communityUpdates, setCommunityUpdates] = useState(false);
  const [volume, setVolume] = useState(80);

  return (
    <div className="page-container settings-page">
      
      {/* 1. HEADER */}
      <div className="page-header">
        <h1 className="page-title">App Settings</h1>
        <div className="status-badge">
          <div className="status-dot"></div>
          ONLINE
        </div>
      </div>

      <div className="settings-grid">
        
        {/* CARD 1: APP PREFERENCES */}
        <div className="settings-card">
          <div className="card-title">
            <AdjustmentsHorizontalIcon className="title-icon" />
            App Preferences
          </div>

          {/* Nav Provider */}
          <div>
            <div className="pref-section-label">Navigation Provider</div>
            <div className="nav-toggle-group">
              <div 
                className={`nav-option ${navProvider === 'google' ? 'active' : ''}`}
                onClick={() => setNavProvider('google')}
              >
                {navProvider === 'google' && <div className="active-dot"></div>}
                <MapSolid className="nav-icon" />
                <span className="nav-label">Google Maps</span>
              </div>
              
              <div 
                className={`nav-option ${navProvider === 'waze' ? 'active' : ''}`}
                onClick={() => setNavProvider('waze')}
              >
                {navProvider === 'waze' && <div className="active-dot"></div>}
                <MapIcon className="nav-icon" /> 
                <span className="nav-label">Waze</span>
              </div>
            </div>
          </div>

          {/* Language */}
          <div>
            <div className="pref-section-label">App Language</div>
            <select 
              className="lang-select" 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en-in">English (India)</option>
              <option value="en-us">English (US)</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
            </select>
          </div>

          {/* Dark Mode */}
          <div className="toggle-row">
            <div className="row-label">
              <MoonIcon style={{ width: 20, color: 'var(--text-muted)' }} />
              Dark Mode
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* CARD 2: NOTIFICATIONS */}
        <div className="settings-card">
          <div className="card-title">
            <BellAlertIcon className="title-icon" />
            Notifications
          </div>

          {/* Job Alerts */}
          <div className="notif-item">
            <div className="notif-text">
              <h4>Job Alerts</h4>
              <p>High priority push notifications</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={jobAlerts}
                onChange={() => setJobAlerts(!jobAlerts)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Volume Slider */}
          <div className="volume-control">
            <div className="vol-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SpeakerWaveIcon style={{ width: 18 }} /> Alert Volume
              </span>
              <span className="vol-percent">{volume}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={volume} 
              onChange={(e) => setVolume(e.target.value)}
              className="vol-slider"
            />
            <div className="vol-labels">
              <span>SILENT</span>
              <span>MAX</span>
            </div>
          </div>

          {/* Community Updates */}
          <div className="toggle-row" style={{ marginTop: 'auto' }}>
            <div className="notif-text">
              <h4 style={{ fontSize: '0.9rem' }}>Community Updates</h4>
              <p>Newsletters & Events</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={communityUpdates}
                onChange={() => setCommunityUpdates(!communityUpdates)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* CARD 3: ACCOUNT & SUPPORT */}
        <div className="settings-card">
          <div className="card-title">
            <ShieldCheckIcon className="title-icon" />
            Account & Support
          </div>

          <div className="menu-list">
            
            <div className="menu-item">
              <div className="menu-left">
                <div className="menu-icon-bg bg-blue">
                  <LockClosedIcon style={{ width: 18 }} />
                </div>
                <span>Change Password</span>
              </div>
              <ChevronRightIcon style={{ width: 16, color: 'var(--text-muted)' }} />
            </div>

            <div className="menu-item">
              <div className="menu-left">
                <div className="menu-icon-bg bg-purple">
                  <QuestionMarkCircleIcon style={{ width: 18 }} />
                </div>
                <span>Help & Support</span>
              </div>
              <ChevronRightIcon style={{ width: 16, color: 'var(--text-muted)' }} />
            </div>

            <div className="menu-item">
              <div className="menu-left">
                <div className="menu-icon-bg bg-orange">
                  <DocumentTextIcon style={{ width: 18 }} />
                </div>
                <span>Legal</span>
              </div>
              <ChevronRightIcon style={{ width: 16, color: 'var(--text-muted)' }} />
            </div>

          </div>

          <div className="logout-section">
            <button className="btn-logout" onClick={() => alert('Logging out...')}>
              <ArrowRightOnRectangleIcon style={{ width: 20 }} />
              Log Out
            </button>
            <div className="app-version">
              LOCAL MILES APP <br/> v2.4.0 (Build 102)
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}