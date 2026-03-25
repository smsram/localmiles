'use client';
import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  CheckBadgeIcon, 
  DocumentArrowDownIcon,
  ArrowDownTrayIcon 
} from '@heroicons/react/24/solid';

export default function CourierAgreementPage() {
  const [activeSection, setActiveSection] = useState('');

  // Scroll Tracking
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['contractor-status', 'zero-tolerance', 'license-insurance', 'termination'];
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
      const offset = 90; // Adjusted slightly for mobile header
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
        
        {/* Header with Download Button (Responsive: Stacks on mobile) */}
        <div className="header-actions">
          <div style={{ flex: 1 }}>
            <div className="meta-date">Last Updated: Jan 15, 2026</div>
            <h1 className="doc-title" style={{marginBottom: 0}}>Courier Partner Agreement</h1>
          </div>
          <a href="#" className="btn-black-download">
            <DocumentArrowDownIcon width={18} />
            Download PDF
          </a>
        </div>

        <div className="legal-text-block">
          <p>
            This Courier Partner Agreement ("Agreement") constitutes a legally binding contract 
            between you ("Courier" or "Partner") and Local Miles regarding your provision of 
            delivery services through the Local Miles platform.
          </p>
        </div>

        {/* KEY PARTNER RULES BOX */}
        <div className="key-rules-box">
          <div className="rules-title">
            <ShieldCheckIcon width={20} />
            Key Partner Rules
          </div>
          
          <div className="rules-grid">
            
            {/* Rule 1 */}
            <div className="rule-item">
              <div className="check-icon-bg">
                <CheckBadgeIcon width={20} />
              </div>
              <div className="rule-content">
                <h4>Independent Contractor</h4>
                <p>You operate as a self-employed partner, not an employee.</p>
              </div>
            </div>

            {/* Rule 2 */}
            <div className="rule-item">
              <div className="check-icon-bg">
                <CheckBadgeIcon width={20} />
              </div>
              <div className="rule-content">
                <h4>Zero Tolerance</h4>
                <p>Immediate termination for theft or tampering.</p>
              </div>
            </div>

            {/* Rule 3 */}
            <div className="rule-item">
              <div className="check-icon-bg">
                <CheckBadgeIcon width={20} />
              </div>
              <div className="rule-content">
                <h4>Valid License</h4>
                <p>Must maintain active insurance and valid documentation.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Legal Text Sections */}
        <div className="legal-text-block">
          
          <h2 id="contractor-status" className="legal-section-title">1. Independent Contractor Status</h2>
          <p>
            You acknowledge and agree that your relationship with Local Miles is that of an 
            independent contractor. You are not an employee, agent, joint venturer, or partner 
            of Local Miles for any purpose.
          </p>
          <p>
            You have the sole right to determine when, where, and for how long you will utilize 
            the Local Miles Platform. You retain the option to accept or reject any delivery 
            opportunity presented through the Platform.
          </p>

          <h2 id="zero-tolerance" className="legal-section-title">2. Zero Tolerance Policy</h2>
          <p>
            Local Miles maintains a strict zero-tolerance policy regarding the theft, 
            misappropriation, or tampering of parcels. Trust is the foundation of our community.
          </p>
          <ul className="legal-list">
            <li>Any confirmed report of theft will result in immediate and permanent deactivation of your Courier account.</li>
            <li>We reserve the right to report any criminal activity to local law enforcement authorities.</li>
            <li>You are responsible for the safety and security of all items in your possession from pickup to delivery.</li>
          </ul>

          <h2 id="license-insurance" className="legal-section-title">3. License & Insurance</h2>
          <p>
            At all times while accessing the Platform and performing Delivery Services, you must 
            possess and maintain a valid driver’s license appropriate for your vehicle type, 
            as well as valid vehicle registration and auto insurance that meets or exceeds the 
            minimum requirements of local laws.
          </p>

          <h2 id="termination" className="legal-section-title">4. Term and Termination</h2>
          <p>
            This Agreement shall commence on the date you accept it and continue until 
            terminated by either party. You may terminate this Agreement at any time by 
            deleting your account. Local Miles may terminate this Agreement immediately if 
            you violate the "Zero Tolerance" policy or fail to maintain valid documentation.
          </p>

        </div>
      </div>

      {/* --- COLUMN 2: TABLE OF CONTENTS (Hidden on Mobile) --- */}
      <aside className="toc-sidebar">
        <div className="toc-box">
          <span className="toc-title">On This Page</span>
          <div className="toc-list">
            <a 
              href="#contractor-status" 
              className={`toc-link ${activeSection === 'contractor-status' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'contractor-status')}
            >
              1. Contractor Status
            </a>
            <a 
              href="#zero-tolerance" 
              className={`toc-link ${activeSection === 'zero-tolerance' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'zero-tolerance')}
            >
              2. Zero Tolerance
            </a>
            <a 
              href="#license-insurance" 
              className={`toc-link ${activeSection === 'license-insurance' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'license-insurance')}
            >
              3. License & Insurance
            </a>
            <a 
              href="#termination" 
              className={`toc-link ${activeSection === 'termination' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'termination')}
            >
              4. Termination
            </a>
          </div>
          
          <a href="#" className="btn-download-pdf">
            <ArrowDownTrayIcon width={16} />
            Print Version
          </a>
        </div>
      </aside>

    </div>
  );
}