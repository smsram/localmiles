'use client';
import { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon, 
  BanknotesIcon, 
  FireIcon, 
  BeakerIcon, 
  NoSymbolIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

export default function ProhibitedItemsPage() {
  const [activeSection, setActiveSection] = useState('');

  // Scroll Tracking Logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['general', 'dangerous-goods', 'high-value', 'violations'];
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
        <h1 className="doc-title">Prohibited Items Policy</h1>

        <div className="legal-text-block">
          <p>
            To ensure the safety of our couriers, customers, and the general public, 
            strict adherence to our Prohibited Items list is mandatory. Local Miles 
            reserves the right to refuse service for any shipment containing these items.
          </p>
        </div>

        {/* VISUAL GUIDE GRID */}
        <div className="prohibited-grid">
          {/* Item 1 */}
          <div className="prohibited-card">
            <div className="prohibited-icon-box">
              <BanknotesIcon width={24} />
            </div>
            <span className="prohibited-label">Cash & Currency</span>
          </div>

          {/* Item 2 */}
          <div className="prohibited-card">
            <div className="prohibited-icon-box">
              <BeakerIcon width={24} />
            </div>
            <span className="prohibited-label">Illegal Drugs</span>
          </div>

          {/* Item 3 */}
          <div className="prohibited-card">
            <div className="prohibited-icon-box">
              <FireIcon width={24} />
            </div>
            <span className="prohibited-label">Flammables</span>
          </div>

          {/* Item 4 */}
          <div className="prohibited-card">
            <div className="prohibited-icon-box">
              <NoSymbolIcon width={24} />
            </div>
            <span className="prohibited-label">Live Animals</span>
          </div>

          {/* Item 5 */}
          <div className="prohibited-card">
            <div className="prohibited-icon-box">
              <CurrencyRupeeIcon width={24} />
            </div>
            <span className="prohibited-label">Gold/Jewelry &gt; ₹10k</span>
          </div>

          {/* Item 6 */}
          <div className="prohibited-card">
            <div className="prohibited-icon-box">
              <ExclamationTriangleIcon width={24} />
            </div>
            <span className="prohibited-label">Weapons</span>
          </div>
        </div>

        <div className="legal-text-block">
          
          {/* Section 1 */}
          <h2 id="general" className="legal-section-title">1. General Restrictions</h2>
          <p>
            Local Miles is committed to maintaining a safe and legal logistics network. Users 
            are strictly prohibited from using the Platform to send, transport, or request 
            delivery of any item listed in the visual guide above or any item prohibited by local, 
            state, or federal law.
          </p>
          <p>
            This policy applies to all users, including senders and couriers. Senders are 
            responsible for ensuring their packages do not contain prohibited items. Couriers 
            have the right and obligation to refuse any package they suspect contains 
            prohibited goods.
          </p>

          {/* Section 2 */}
          <h2 id="dangerous-goods" className="legal-section-title">2. Dangerous Goods & Hazardous Materials</h2>
          <p>
            Items classified as hazardous materials or dangerous goods are strictly forbidden. 
            This includes but is not limited to:
          </p>
          <ul className="legal-list">
            <li><strong>Explosives:</strong> Fireworks, flares, ammunition.</li>
            <li><strong>Gases:</strong> Compressed gas cylinders, aerosol cans.</li>
            <li><strong>Flammable Liquids:</strong> Gasoline, lighter fluid, paint thinners.</li>
            <li><strong>Flammable Solids:</strong> Matches, certain batteries (e.g., damaged lithium batteries).</li>
            <li><strong>Corrosives:</strong> Acids, wet cell batteries.</li>
          </ul>

          {/* Section 3 */}
          <h2 id="high-value" className="legal-section-title">3. High Value & Sensitive Items</h2>
          <p>
            To mitigate risk of theft and liability, Local Miles places a cap on the value of items 
            transported via our standard service.
          </p>
          <p>
            Gold, silver, precious stones, and jewelry with a value exceeding <strong>₹10,000 INR</strong> are 
            prohibited. Additionally, cash, bearer bonds, and negotiable instruments are not 
            permitted in the network under any circumstances.
          </p>

          {/* Section 4 */}
          <h2 id="violations" className="legal-section-title">4. Violations & Legal Consequences</h2>
          <p>
            Attempting to ship prohibited items constitutes a material breach of the Terms of 
            Service. Local Miles will cooperate fully with law enforcement agencies in the 
            event of illegal shipments. Accounts found in violation may be permanently 
            suspended, and the user may be liable for any damages or legal costs incurred.
          </p>
        </div>
      </div>

      {/* --- COLUMN 2: TABLE OF CONTENTS --- */}
      <aside className="toc-sidebar">
        <div className="toc-box">
          <span className="toc-title">On This Page</span>
          <div className="toc-list">
            <a 
              href="#general" 
              className={`toc-link ${activeSection === 'general' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'general')}
            >
              1. General Restrictions
            </a>
            <a 
              href="#dangerous-goods" 
              className={`toc-link ${activeSection === 'dangerous-goods' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'dangerous-goods')}
            >
              2. Dangerous Goods
            </a>
            <a 
              href="#high-value" 
              className={`toc-link ${activeSection === 'high-value' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'high-value')}
            >
              3. High Value Items
            </a>
            <a 
              href="#violations" 
              className={`toc-link ${activeSection === 'violations' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'violations')}
            >
              4. Violations
            </a>
          </div>
          
          <a href="#" className="btn-download-pdf">
            <ArrowDownTrayIcon width={16} />
            Download PDF Policy
          </a>
        </div>
      </aside>

    </div>
  );
}