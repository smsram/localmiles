'use client';
import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';

export default function RefundPolicyPage() {
  const [activeSection, setActiveSection] = useState('');

  // Scroll Tracking Logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['eligibility', 'dispute-process', 'non-refundable', 'payouts'];
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
        <h1 className="doc-title">Refund & Dispute Policy</h1>

        <div className="legal-text-block">
          <p>
            At Local Miles, we are committed to ensuring fairness and transparency for all 
            deliveries. This policy outlines the conditions under which refunds are processed 
            and details the dispute resolution mechanism for senders and couriers.
          </p>
        </div>

        {/* VISUAL TIMELINE */}
        <div className="timeline-box">
          <span className="timeline-header">Dispute Resolution Timeline</span>
          
          <div className="timeline-track">
            {/* Step 1 */}
            <div className="timeline-step">
              <div className="step-circle">1</div>
              <div>
                <div className="step-label">Report Issue</div>
                <div className="time-badge">WITHIN 2 HRS</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="timeline-step">
              <div className="step-circle">2</div>
              <div>
                <div className="step-label">Evidence Review</div>
                <div className="step-sub">24 HRS</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="timeline-step">
              <div className="step-circle">3</div>
              <div>
                <div className="step-label">Resolution/Refund</div>
                <div className="step-sub">5-7 DAYS</div>
              </div>
            </div>
          </div>
        </div>

        <div className="legal-text-block">
          
          {/* Section 1 */}
          <h2 id="eligibility" className="legal-section-title">1. Eligibility for Refunds</h2>
          <p>
            Refunds are not automatic and are subject to review. You may be eligible for a full 
            or partial refund under the following circumstances:
          </p>
          <ul className="legal-list">
            <li><strong>Service Failure:</strong> The courier failed to pick up or deliver the package within the guaranteed timeframe due to their own negligence.</li>
            <li><strong>Damaged Goods:</strong> The item was damaged during transit, and evidence proves the damage occurred while in the courier's possession.</li>
            <li><strong>Lost Package:</strong> The package cannot be located after 48 hours of the expected delivery time.</li>
          </ul>

          {/* Section 2 */}
          <h2 id="dispute-process" className="legal-section-title">2. Dispute Process</h2>
          <p>
            To initiate a dispute, the sender must use the "Report Issue" function in the 
            Local Miles dashboard.
          </p>

          {/* Deadline Box */}
          <div className="deadline-box">
            <div className="deadline-title">Important Deadline</div>
            <p className="deadline-desc">
              Issues must be reported within <strong>2 hours</strong> of the marked delivery time. 
              Reports filed after this window may be rejected.
            </p>
          </div>

          <p>
            Once a dispute is filed, both parties (Sender and Courier) will be asked to submit 
            evidence, including photos of the package, proof of handover, and chat logs. Our 
            Trust & Safety team reviews all evidence within 24 hours.
          </p>

          {/* Section 3 */}
          <h2 id="non-refundable" className="legal-section-title">3. Non-Refundable Situations</h2>
          <p>Refunds will generally not be granted in the following situations:</p>
          <ul className="legal-list">
            <li>The recipient was unavailable to receive the package at the agreed time.</li>
            <li>The sender provided an incorrect address or contact information.</li>
            <li>The item contained prohibited goods as defined in our Prohibited Items policy.</li>
            <li>Delays caused by Force Majeure events (e.g., severe weather, road closures, strikes).</li>
          </ul>

          {/* Section 4 */}
          <h2 id="payouts" className="legal-section-title">4. Refund Payouts</h2>
          <p>
            Approved refunds are processed immediately by our system but may take 5-7 
            business days to appear in your original payment method, depending on your 
            bank's processing times. Refunds are issued in the currency of the original transaction.
          </p>
        </div>
      </div>

      {/* --- COLUMN 2: TABLE OF CONTENTS --- */}
      <aside className="toc-sidebar">
        <div className="toc-box">
          <span className="toc-title">On This Page</span>
          <div className="toc-list">
            <a 
              href="#eligibility" 
              className={`toc-link ${activeSection === 'eligibility' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'eligibility')}
            >
              1. Eligibility
            </a>
            <a 
              href="#dispute-process" 
              className={`toc-link ${activeSection === 'dispute-process' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'dispute-process')}
            >
              2. Dispute Process
            </a>
            <a 
              href="#non-refundable" 
              className={`toc-link ${activeSection === 'non-refundable' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'non-refundable')}
            >
              3. Exceptions
            </a>
            <a 
              href="#payouts" 
              className={`toc-link ${activeSection === 'payouts' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'payouts')}
            >
              4. Payouts
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