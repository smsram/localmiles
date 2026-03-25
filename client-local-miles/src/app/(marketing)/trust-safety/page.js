'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  MapPinIcon, 
  IdentificationIcon 
} from '@heroicons/react/24/solid';
import '@/styles/TrustSafetyNew.css';

// --- Animations ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
};

export default function TrustSafetyPage() {
  return (
    <div className="trust-safety-page">
      
      {/* 1. HERO SECTION */}
      <section className="ts-hero">
        
        {/* Hero Content */}
        <motion.div 
          className="hero-content-block"
          initial="hidden" animate="visible" variants={staggerContainer}
        >
          <motion.span className="badge-teal" variants={fadeInUp}>
            Safety Certified
          </motion.span>
          <motion.h1 className="hero-title" variants={fadeInUp}>
            Your Deliveries, <br />
            <span className="title-accent">Protected.</span>
          </motion.h1>
          <motion.p className="hero-desc" variants={fadeInUp}>
            Local Miles builds trust into every mile with industry-leading 
            security protocols and verified partner networks. We don't just 
            ship; we safeguard.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href="#security-details" className="btn-teal">
              Learn About Security
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Image */}
        <motion.div 
          className="hero-img-block"
          initial="hidden" animate="visible" variants={scaleIn}
        >
          {/* Floating Badge */}
          <motion.div 
            className="badge-floating"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <ShieldCheckIcon width={20} /> Verified Shield Active
          </motion.div>
          
          {/* Using a similar stock image for the visual */}
          <Image 
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2000&auto=format&fit=crop"
            alt="Courier handing package to customer safely"
            fill
            className="hero-img"
            priority
          />
        </motion.div>
      </section>

      {/* 2. GRID SECTION */}
      <section id="security-details" className="ts-grid-section">
        <motion.div 
          className="section-header"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
        >
          <h2 className="section-title">Safety First, Always</h2>
          <p className="section-sub">
            Our comprehensive security framework ensures peace of mind for 
            every stakeholder in the logistics chain.
          </p>
        </motion.div>

        <motion.div 
          className="safety-grid"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
        >
          {/* Card 1 */}
          <motion.div className="safety-card" variants={fadeInUp}>
            <div className="icon-box"><LockClosedIcon width={24} /></div>
            <h3 className="card-title">Secure OTP Handover</h3>
            <p className="card-desc">
              Verification codes required for every delivery completion to 
              prevent package theft and fraud.
            </p>
          </motion.div>
          {/* Card 2 */}
          <motion.div className="safety-card" variants={fadeInUp}>
            <div className="icon-box"><MapPinIcon width={24} /></div>
            <h3 className="card-title">Live GPS Tracking</h3>
            <p className="card-desc">
              Real-time visibility from pickup to drop-off with millisecond 
              location precision.
            </p>
          </motion.div>
          {/* Card 3 */}
          <motion.div className="safety-card" variants={fadeInUp}>
            <div className="icon-box"><IdentificationIcon width={24} /></div>
            <h3 className="card-title">Verified Partners</h3>
            <p className="card-desc">
              Every courier undergoes a rigorous 5-step biometric and 
              background check process.
            </p>
          </motion.div>
          {/* Card 4 */}
          <motion.div className="safety-card" variants={fadeInUp}>
            <div className="icon-box"><ShieldCheckIcon width={24} /></div>
            <h3 className="card-title">Package Insurance</h3>
            <p className="card-desc">
              Comprehensive end-to-end coverage for every item in transit, 
              backed by top insurers.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. EMERGENCY BANNER */}
      <section className="emergency-banner">
        <motion.div 
          className="banner-inner"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
        >
          <div className="banner-left">
            {/* Custom Asterisk Icon using CSS/HTML for exact look */}
            <div className="asterisk-icon">✻</div>
            <div className="banner-text">
              <h4>Need immediate help?</h4>
              <p>Use the SOS button in your active delivery screen or call our 24/7 Safety Line.</p>
            </div>
          </div>
          <div className="banner-actions">
            <Link href="tel:18001234567" className="btn-red">Call Safety Line</Link>
            <Link href="/help/sos-guide" className="btn-white-outline">In-App SOS Guide</Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}