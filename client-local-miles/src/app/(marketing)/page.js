'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon, 
  ClockIcon, 
  ShieldCheckIcon, 
  ArrowsUpDownIcon,
  DevicePhoneMobileIcon,
  PlayIcon
} from '@heroicons/react/24/solid';
import HomeCTA from '@/components/marketing/HomeCTA';
import '@/styles/HomePage.css';

// Animation Variants
const fadeInData = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom) => ({
    opacity: 1, 
    y: 0,
    transition: { 
      delay: custom * 0.1, 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] // Custom smooth easing
    }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function HomePage() {
  const [isCourierMode, setIsCourierMode] = useState(false);

  return (
    <div className="home-container">
      
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <motion.h1 
          className="hero-headline"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeInData}
        >
          Move things.<br />
          Fast<span className="hero-dot">.</span>
        </motion.h1>
        
        <motion.p 
          className="hero-sub"
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeInData}
        >
          The simplest way to send packages or earn money driving <br/>
          in your city.
        </motion.p>

        {/* Search Bar Animation */}
        <motion.div 
          className="pincode-wrapper"
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeInData}
        >
          <input 
            type="text" 
            placeholder="Enter pickup pincode..." 
            className="pincode-input"
          />
          <button className="btn-arrow-go">
            <ArrowRightIcon width={24} />
          </button>
        </motion.div>
      </section>

      {/* 2. FEATURES GRID */}
      <motion.section 
        className="features-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        {/* Feature 1 */}
        <motion.div className="feature-item" variants={fadeInData}>
          <ClockIcon width={32} className="feat-icon" />
          <h3 className="feat-title">Instant.</h3>
          <p className="feat-desc">Matches in seconds. Delivery in minutes.</p>
        </motion.div>

        {/* Feature 2 */}
        <motion.div className="feature-item" variants={fadeInData}>
          <ShieldCheckIcon width={32} className="feat-icon" />
          <h3 className="feat-title">Secure.</h3>
          <p className="feat-desc">Live tracking and 4-digit PIN handover.</p>
        </motion.div>

        {/* Feature 3 */}
        <motion.div className="feature-item" variants={fadeInData}>
          <ArrowsUpDownIcon width={32} className="feat-icon" />
          <h3 className="feat-title">Flexible.</h3>
          <p className="feat-desc">Send anything legal. Drive anytime you want.</p>
        </motion.div>
      </motion.section>

      {/* 3. TWO MODES SECTION */}
      <section className="modes-section">
        <motion.div 
          className="modes-content"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="modes-headline">
            One app.<br />
            Two modes.
          </h2>
          
          <div className="toggle-wrapper">
            <span className={`toggle-label ${!isCourierMode ? 'active' : ''}`}>SENDER</span>
            <div 
              className={`toggle-track ${isCourierMode ? 'courier-mode' : ''}`}
              onClick={() => setIsCourierMode(!isCourierMode)}
            >
              <div className="toggle-circle" />
            </div>
            <span className={`toggle-label ${isCourierMode ? 'active' : ''}`}>COURIER</span>
          </div>
        </motion.div>

        <motion.div 
          className="phone-mockup-wrapper"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="phone-frame">
            {/* Map Background Simulation */}
            <div className="map-bg" />
            
            {/* Animated SVG Route */}
            <svg className="map-route-svg" viewBox="0 0 300 600">
               <motion.path 
                 d="M50,150 L250,250 L100,400 L250,550" 
                 fill="none" 
                 stroke={isCourierMode ? "#D4AF37" : "#E5E7EB"} 
                 strokeWidth="3" 
                 initial={{ pathLength: 0 }}
                 whileInView={{ pathLength: 1 }}
                 transition={{ duration: 2, ease: "easeInOut" }}
               />
            </svg>

            {/* Center Pin */}
            <div className="map-pin" />
            
            {/* Phone UI Bottom Bar */}
            <div className="phone-ui-bottom">
               <div className="ui-bar"></div>
               <div className="ui-bar"></div>
               <div className="ui-bar"></div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. READY TO START */}
      <section className="ready-section">
        <motion.h2 
          className="ready-title"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Ready to start?
        </motion.h2>
        
        <motion.div 
          className="store-buttons"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <a href="#" className="btn-store-black">
            <DevicePhoneMobileIcon width={32} />
            <div className="btn-text-stack">
              <span className="small-lbl">Download on the</span>
              <span className="big-lbl">App Store</span>
            </div>
          </a>
          <a href="#" className="btn-store-black">
            <PlayIcon width={32} />
            <div className="btn-text-stack">
              <span className="small-lbl">GET IT ON</span>
              <span className="big-lbl">Google Play</span>
            </div>
          </a>
        </motion.div>
      </section>

      {/* 5. EXISTING RELIABILITY CTA */}
      <HomeCTA />

    </div>
  );
}