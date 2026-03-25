'use client';
import { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  DevicePhoneMobileIcon, 
  LockClosedIcon, 
  ArrowDownTrayIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/solid';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('');

  // Scroll Tracking Logic (Reused from Terms)
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['collection', 'usage', 'retention'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(section);
            break; 
          } else if (rect.top < 0 && rect.bottom > 100) {
             setActiveSection(section);
             break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="legal-page-grid">
      
      {/* --- COLUMN 1: TEXT CONTENT --- */}
      <div className="legal-text-content">
        <div className="meta-date">Last Updated: Jan 15, 2026</div>
        <h1 className="doc-title">Privacy Policy</h1>

        {/* DATA SAFETY HIGHLIGHTS (New Section) */}
        <div className="data-safety-section">
          <span className="section-label">Data Safety Highlights</span>
          <div className="highlights-grid">
            
            {/* Card 1 */}
            <div className="highlight-card">
              <div className="card-icon">
                <MapPinIcon width={20} />
              </div>
              <h3 className="card-title">Location Tracking</h3>
              <p className="card-desc">
                GPS is tracked only during active deliveries to ensure route efficiency.
              </p>
            </div>

            {/* Card 2 */}
            <div className="highlight-card">
              <div className="card-icon">
                <DevicePhoneMobileIcon width={20} />
              </div>
              <h3 className="card-title">Number Masking</h3>
              <p className="card-desc">
                Temporary number sharing protects your personal contact details during transit.
              </p>
            </div>

            {/* Card 3 */}
            <div className="highlight-card">
              <div className="card-icon">
                <LockClosedIcon width={20} />
              </div>
              <h3 className="card-title">Secure Data</h3>
              <p className="card-desc">
                Industry-standard encryption secures all sensitive information on our servers.
              </p>
            </div>

          </div>
        </div>

        <div className="legal-text-block">
          <p>
            At Local Miles, we value your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
          </p>

          {/* Section 1 */}
          <h2 id="collection" className="legal-section-title">1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, such as when you create an account, 
            update your profile, or communicate with other users on the platform.
          </p>

          {/* Blue Info Box */}
          <div className="info-box-blue">
            <InformationCircleIcon width={24} className="info-icon-blue" />
            <div className="info-content">
              <h4>Background Location Access</h4>
              <p>
                <strong>Note for Couriers:</strong> To enable real-time tracking for the sender, 
                the Local Miles app collects location data even when the app is closed or not in use.
              </p>
            </div>
          </div>

          <p>
            This data is essential for maintaining the integrity of our logistics network and 
            providing accurate arrival estimates to senders.
          </p>

          {/* Section 2 */}
          <h2 id="usage" className="legal-section-title">2. How We Use Data</h2>
          <p>
            Your data is used primarily to facilitate the matching of senders with couriers and 
            to ensure the secure completion of deliveries.
          </p>
          <ul className="legal-list">
            <li>To verify identity and maintain a secure community.</li>
            <li>To process payments and facilitate financial transactions.</li>
            <li>To improve our logistics algorithms and user experience.</li>
            <li>To provide customer support and resolve disputes.</li>
          </ul>

          {/* Section 3 */}
          <h2 id="retention" className="legal-section-title">3. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide our services and 
            comply with legal obligations. Users can request data deletion through their 
            account settings at any time, subject to active contract obligations.
          </p>
        </div>
      </div>

      {/* --- COLUMN 2: TABLE OF CONTENTS --- */}
      <aside className="toc-sidebar">
        <div className="toc-box">
          <span className="toc-title">On This Page</span>
          <div className="toc-list">
            <a 
              href="#collection" 
              className={`toc-link ${activeSection === 'collection' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'collection')}
            >
              1. Data Collection
            </a>
            <a 
              href="#usage" 
              className={`toc-link ${activeSection === 'usage' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'usage')}
            >
              2. How We Use Data
            </a>
            <a 
              href="#retention" 
              className={`toc-link ${activeSection === 'retention' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'retention')}
            >
              3. Data Retention
            </a>
          </div>
          
          <a href="#" className="btn-download-pdf">
            <ArrowDownTrayIcon width={16} />
            Download PDF
          </a>
        </div>
      </aside>

    </div>
  );
}