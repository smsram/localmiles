'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  EyeIcon, 
  HandThumbUpIcon, 
  BoltIcon 
} from '@heroicons/react/24/solid';
import '@/styles/AboutPage.css';

// --- Animations ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" }
  })
};

export default function AboutPage() {
  return (
    <div className="about-page-container">
      
      {/* 1. HERO SECTION */}
      <section className="about-hero">
        <div className="hero-text">
          <motion.h1 
            className="hero-headline"
            initial="hidden" animate="visible" custom={0} variants={fadeInUp}
          >
            Moving The <br />
            City, <br />
            <span className="text-gold">One Connection</span> <br />
            At A Time.
          </motion.h1>
        </div>

        <motion.div 
          className="hero-image-wrapper"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Placeholder for the office image */}
          <div className="hero-img" style={{background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
             {/* If you have the image, use <Image src="..." /> here */}
             <span style={{color:'#555'}}>Office/Team Image</span>
          </div>
          <span className="image-caption">Founded 2024 • Zürich Headquarters</span>
        </motion.div>
      </section>

      {/* 2. THE BLUEPRINT */}
      <section className="blueprint-section">
        <motion.span 
          className="section-eyebrow"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
        >
          The Blueprint
        </motion.span>
        
        <motion.p 
          className="blueprint-text"
          initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeInUp}
        >
          Local Miles was founded on the belief that logistics should be invisible, 
          sustainable, and fundamentally human. Inspired by <span className="underline-gold">Swiss precision</span>, 
          we've built a SaaS infrastructure that treats every delivery not just as a data point, 
          but as a vital pulse in the urban organism.
        </motion.p>
      </section>

      {/* 3. STATS */}
      <section className="stats-section">
        {[
          { num: '50,000+', label: 'Deliveries Completed', desc: 'Optimized routes across dense urban centers.' },
          { num: '12', label: 'Major Cities', desc: 'Strategic operations in tech-forward metropolises.' },
          { num: '100%', label: 'Carbon Neutral Goal', desc: 'Targeting zero-emission last-mile delivery by 2026.' }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            className="stat-item"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeInUp}
          >
            <span className="stat-number">{stat.num}</span>
            <span className="stat-label">{stat.label}</span>
            <p className="stat-desc">{stat.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* 4. CORE VALUES */}
      <section className="values-section">
        <div className="values-bg-text">VALUES</div>
        
        <div className="values-header">
          <span className="section-eyebrow">Our Core</span>
          <h2 className="values-title">Architecture</h2>
        </div>

        <div className="values-grid">
          {/* Card 1 */}
          <motion.div 
            className="value-card"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeInUp}
          >
            <EyeIcon width={32} className="value-icon" />
            <h3 className="value-h3">Transparency First</h3>
            <p className="value-p">
              Radical data sharing and honest communication in every mile. 
              We believe trust is built through visibility, not promises.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            className="value-card"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeInUp}
          >
            <HandThumbUpIcon width={32} className="value-icon" />
            <h3 className="value-h3">Driver Respect</h3>
            <p className="value-p">
              Putting the backbone of logistics at the center of our mission. 
              Fair wages, ergonomic tools, and respectful schedules.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            className="value-card"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} variants={fadeInUp}
          >
            <BoltIcon width={32} className="value-icon" />
            <h3 className="value-h3">Speed With Safety</h3>
            <p className="value-p">
              Optimization without compromise. Our algorithms prioritize a safer 
              urban environment over marginal gains in timing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 5. BOTTOM CTA */}
      <section className="about-cta-section">
        <motion.span 
          className="section-eyebrow"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        >
          Join The Movement
        </motion.span>
        
        <motion.h2 
          className="cta-headline"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
        >
          Building The Future Of <br /> Urban Logistics.
        </motion.h2>

        <motion.div 
          className="cta-buttons"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/careers" className="btn-gold-solid">
            View Open Careers
          </Link>
          <Link href="/contact" className="btn-outline-white">
            Partner With Us
          </Link>
        </motion.div>
      </section>

    </div>
  );
}