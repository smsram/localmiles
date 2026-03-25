'use client';
import { useEffect, useState } from 'react';
import { ExclamationCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('');

  // Scroll Tracking for Active TOC Link
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['introduction', 'obligations', 'intellectual-property', 'termination'];
      
      // Find the current section in view
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the section top is near the top of viewport (considering header offset)
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(section);
            break; 
          } else if (rect.top < 0 && rect.bottom > 100) {
             // If we scrolled past the top but are still inside the section
             setActiveSection(section);
             break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper for smooth scrolling manually (optional if CSS scroll-behavior isn't enough)
  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Adjust offset for sticky header (e.g., 100px)
      const offset = 100; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update active state immediately for better UX
      setActiveSection(id);
    }
  };

  return (
    <div className="legal-page-grid">
      
      {/* --- COLUMN 1: TEXT CONTENT --- */}
      <div className="legal-text-content">
        <div className="meta-date">Last Updated: Jan 15, 2026</div>
        <h1 className="doc-title">Terms of Service</h1>

        <div className="important-note">
          <ExclamationCircleIcon width={24} className="note-icon" />
          <div className="note-content">
            <h4>Important Note</h4>
            <p>
              Local Miles acts as a technology platform connecting senders and couriers 
              and is not a transportation provider.
            </p>
          </div>
        </div>

        <div className="legal-text-block">
          <p>
            These Terms of Service constitute a legally binding agreement between you and 
            Local Miles concerning your access to and use of the Local Miles website as well 
            as any other media form, media channel, mobile website or mobile application 
            related, linked, or otherwise connected thereto.
          </p>

          <h2 id="introduction" className="legal-section-title">1. Introduction</h2>
          <p>
            "<strong>Platform</strong>" refers to the Local Miles desktop application, website, and mobile apps.
            "<strong>Services</strong>" includes all logistics coordination, courier matching, and tracking 
            features provided by Local Miles.
          </p>
          <p>
            By accessing the Platform, you acknowledge that you have read, understood, and agree 
            to be bound by all of these Terms of Service. If you do not agree with all of these 
            Terms of Service, then you are expressly prohibited from using the Site and you must 
            discontinue use immediately.
          </p>

          <h2 id="obligations" className="legal-section-title">2. User Obligations</h2>
          <p>
            You may not access or use the Site for any purpose other than that for which we make 
            the Site available. The Site may not be used in connection with any commercial endeavors 
            except those that are specifically endorsed or approved by us.
          </p>
          <ul className="legal-list">
            <li>Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
            <li>Make any unauthorized use of the Site, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email.</li>
            <li>Use a buying agent or purchasing agent to make purchases on the Site.</li>
            <li>Circumvent, disable, or otherwise interfere with security-related features of the Site.</li>
          </ul>

          <h2 id="intellectual-property" className="legal-section-title">3. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and all source code, 
            databases, functionality, software, website designs, audio, video, text, photographs, 
            and graphics on the Site (collectively, the "Content") and the trademarks, service marks, 
            and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, 
            and are protected by copyright and trademark laws.
          </p>

          <h2 id="termination" className="legal-section-title">4. Term and Termination</h2>
          <p>
            These Terms of Service shall remain in full force and effect while you use the Site. 
            WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, 
            IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE.
          </p>
          {/* Added dummy content to ensure scrolling demonstrates the sticky effect */}
          <p>
            We may terminate or suspend your account and bar access to the Service immediately, 
            without prior notice or liability, under our sole discretion, for any reason whatsoever 
            and without limitation, including but not limited to a breach of the Terms.
          </p>
        </div>
      </div>

      {/* --- COLUMN 2: TABLE OF CONTENTS (Sticky) --- */}
      <aside className="toc-sidebar">
        <div className="toc-box">
          <span className="toc-title">On This Page</span>
          <div className="toc-list">
            <a 
              href="#introduction" 
              className={`toc-link ${activeSection === 'introduction' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'introduction')}
            >
              1. Introduction
            </a>
            <a 
              href="#obligations" 
              className={`toc-link ${activeSection === 'obligations' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'obligations')}
            >
              2. User Obligations
            </a>
            <a 
              href="#intellectual-property" 
              className={`toc-link ${activeSection === 'intellectual-property' ? 'active' : ''}`}
              onClick={(e) => scrollToSection(e, 'intellectual-property')}
            >
              3. Intellectual Property
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
            Download PDF
          </a>
        </div>
      </aside>

    </div>
  );
}