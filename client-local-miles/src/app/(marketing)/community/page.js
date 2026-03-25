'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  NewspaperIcon, 
  ArrowRightIcon 
} from '@heroicons/react/24/solid';
import '@/styles/CommunityPage.css';

// --- Animations ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } }
};

export default function CommunityPage() {
  return (
    <div className="community-page">
      
      {/* 1. HERO SECTION */}
      <motion.section 
        className="comm-hero"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Image 
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2069&auto=format&fit=crop"
          alt="Community of couriers"
          fill
          className="hero-bg-img"
          priority
        />
        <div className="hero-overlay" />
        
        <div className="hero-content">
          <motion.h1 
            className="hero-title"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          >
            The people behind <br/> 
            <span className="font-serif">the miles.</span>
          </motion.h1>
          <p className="hero-sub">
            Meet the heartbeat of Local Miles: our dedicated courier community.
          </p>
          <Link href="/onboarding" className="btn-hero">
            Join Community
          </Link>
        </div>
      </motion.section>

      {/* 2. FEATURED COURIER */}
      <motion.section 
        className="featured-courier-section"
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
      >
        <div className="courier-avatar-wrapper">
          <Image 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop"
            alt="Elena R."
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="courier-quote-box">
          <span className="section-label">Featured Courier</span>
          <blockquote className="courier-quote">
            "Driving with Local Miles helps me fund my education 
            and pursue my dream of becoming an architect."
          </blockquote>
          <div className="courier-meta">
            <strong>– Elena R.</strong>
            <span>Courier in Chicago, IL • Since 2022</span>
          </div>
          <Link href="#" className="link-arrow">
            Read Elena's full story <ArrowRightIcon width={16} />
          </Link>
        </div>
      </motion.section>

      {/* 3. MAIN GRID (Events & Stories) */}
      <div className="content-grid">
        
        {/* Left Column: Events */}
        <aside>
          <div className="col-header">
            <CalendarDaysIcon width={24} color="#D4AF37" />
            Upcoming Events
          </div>
          <motion.div 
            className="events-list"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            {/* Event 1 */}
            <motion.div className="event-card" variants={fadeInUp}>
              <span className="event-date">June 12</span>
              <h4 className="event-title">Coffee & Logistics Mixer</h4>
              <div className="event-location">
                <MapPinIcon width={14} /> Downtown Hub
              </div>
              <button className="btn-event">Register</button>
            </motion.div>

            {/* Event 2 */}
            <motion.div className="event-card" variants={fadeInUp}>
              <span className="event-date">June 20</span>
              <h4 className="event-title">Safety Excellence Workshop</h4>
              <div className="event-location">
                <MapPinIcon width={14} /> Virtual Session
              </div>
              <button className="btn-event">Save Seat</button>
            </motion.div>

            {/* Event 3 */}
            <motion.div className="event-card" variants={fadeInUp}>
              <span className="event-date">July 05</span>
              <h4 className="event-title">Summer Courier Picnic</h4>
              <div className="event-location">
                <MapPinIcon width={14} /> West Side Park
              </div>
              <button className="btn-event">Register</button>
            </motion.div>
          </motion.div>
        </aside>

        {/* Right Column: Stories */}
        <section>
          <div className="col-header">
            <NewspaperIcon width={24} color="#D4AF37" />
            Community Stories
          </div>
          
          <div className="stories-list">
            {/* Story 1 */}
            <motion.div 
              className="story-item"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            >
              <div className="story-img-box">
                <Image 
                  src="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=2070&auto=format&fit=crop"
                  alt="David in van"
                  fill style={{objectFit: 'cover'}}
                />
              </div>
              <div className="story-content">
                <span className="story-tag">Human Feature</span>
                <h3 className="story-title">How David found a second family on the road</h3>
                <p className="story-excerpt">
                  After transitioning from a desk job, David discovered more than just flexible 
                  hours—he found a network of fellow drivers who support one another.
                </p>
                <Link href="#" className="link-arrow">Read story <ArrowRightIcon width={16} /></Link>
              </div>
            </motion.div>

            {/* Story 2 (Reverse Layout) */}
            <motion.div 
              className="story-item reverse"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            >
              <div className="story-img-box">
                <Image 
                  src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2000&auto=format&fit=crop"
                  alt="Entrepreneur"
                  fill style={{objectFit: 'cover'}}
                />
              </div>
              <div className="story-content">
                <span className="story-tag">Entrepreneurship</span>
                <h3 className="story-title">From First Delivery to Fleet Owner</h3>
                <p className="story-excerpt">
                  Sarah's journey from an independent contractor to managing her own small 
                  fleet using the Local Miles dashboard.
                </p>
                <Link href="#" className="link-arrow">Read story <ArrowRightIcon width={16} /></Link>
              </div>
            </motion.div>
          </div>

          <Link href="/community/stories" className="btn-outline-pill">
            View all stories
          </Link>
        </section>

      </div>

      {/* 4. BOTTOM CTA */}
      <section className="community-cta">
        <motion.div 
          className="cta-box"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="cta-headline">Ready to join our community?</h2>
          <p className="cta-sub">
            Whether you're looking for extra income or a full-time career, 
            there's a place for you here. Start your journey today.
          </p>
          <div className="cta-buttons-row">
            <Link href="/onboarding" className="btn-white">Sign Up to Drive</Link>
            <Link href="/contact" className="btn-outline-light">Contact Us</Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}