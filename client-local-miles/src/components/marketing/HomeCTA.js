'use client';
import Link from 'next/link';
import '@/styles/HomeHero.css';

export default function HomeCTA() {
  return (
    <section className="home-cta-section">
      <div className="cta-container">
        <h2 className="cta-title">
          Reliability in every <span className="highlight-text">last mile.</span>
        </h2>
        
        <p className="cta-desc">
          The enterprise logistics engine built for high-growth delivery teams. 
          Scale your operations with confidence.
        </p>

        <div className="cta-buttons">
          <Link href="/login" className="btn-primary-gold">
            Get Started
          </Link>
          <button className="btn-outline-gold">
            Watch Demo
          </button>
        </div>
      </div>
    </section>
  );
}