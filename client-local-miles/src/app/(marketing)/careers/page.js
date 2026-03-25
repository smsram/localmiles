'use client';
import { motion } from 'framer-motion'; // Import Framer Motion
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChartBarIcon, 
  GlobeAltIcon, 
  HeartIcon,
  CodeBracketIcon,
  PencilSquareIcon,
  TruckIcon,
  CommandLineIcon
} from '@heroicons/react/24/solid';
import '@/styles/CareersPage.css';

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.15, // Delay between each child item
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
};

// Mock Data
const jobs = [
  { id: 1, title: 'Senior Backend Engineer', department: 'Engineering', type: 'Full-time', location: 'Remote', icon: CodeBracketIcon },
  { id: 2, title: 'Product Designer', department: 'Design', type: 'Full-time', location: 'New York, NY', icon: PencilSquareIcon },
  { id: 3, title: 'Logistics Operations Manager', department: 'Operations', type: 'Full-time', location: 'Chicago, IL', icon: TruckIcon },
  { id: 4, title: 'Frontend Developer (React)', department: 'Engineering', type: 'Full-time', location: 'Remote', icon: CommandLineIcon },
];

export default function CareersPage() {
  return (
    <div className="careers-page">
      
      {/* 1. HERO SECTION */}
      <section className="careers-hero">
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 className="hero-title" variants={fadeInUp}>
            Build the future of logistics
          </motion.h1>
          <motion.p className="hero-sub" variants={fadeInUp}>
            Join Local Miles in revolutionizing the global supply chain with 
            intelligent, autonomous software.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href="#open-roles" className="btn-gold-outline">
              View Open Roles
            </Link>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="hero-image-wrapper" 
          style={{ position: 'relative' }}
          initial="hidden"
          animate="visible"
          variants={scaleIn}
        >
          <Image 
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Modern automated warehouse interior"
            fill
            className="hero-img"
            style={{ objectFit: 'cover' }}
            priority
          />
        </motion.div>
      </section>

      {/* 2. WHY LOCAL MILES? SECTION */}
      <section className="why-section">
        <div className="section-container">
          <motion.div 
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="section-title">Why Local Miles?</h2>
            <p className="section-sub">
              We prioritize growth, flexibility, and the long-term well-being of our collective team.
            </p>
          </motion.div>

          <motion.div 
            className="features-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Feature 1 */}
            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-icon-box">
                <ChartBarIcon width={24} />
              </div>
              <h3 className="feature-title">Competitive Equity</h3>
              <p className="feature-desc">
                Own a significant piece of the company you help build. We believe in 
                high upside for high impact.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-icon-box">
                <GlobeAltIcon width={24} />
              </div>
              <h3 className="feature-title">Remote-Friendly</h3>
              <p className="feature-desc">
                Work from anywhere in the world. We focus on results, not desk hours 
                or office attendance.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div className="feature-card" variants={fadeInUp}>
              <div className="feature-icon-box">
                <HeartIcon width={24} />
              </div>
              <h3 className="feature-title">Health & Wellness</h3>
              <p className="feature-desc">
                Comprehensive health coverage and annual wellness stipends for 
                you and your family.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. OPEN OPPORTUNITIES SECTION */}
      <section id="open-roles" className="jobs-section">
        <motion.div 
          className="jobs-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="section-title" style={{marginBottom: 0}}>Open Opportunities</h2>
          <span className="jobs-count">Showing {jobs.length} open roles</span>
        </motion.div>

        <motion.div 
          className="jobs-list"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
        >
          {jobs.map((job) => (
            <motion.div key={job.id} variants={fadeInUp}>
              <div className="job-item">
                <div className="job-info">
                  <div className="job-icon-box">
                    <job.icon width={24} />
                  </div>
                  <div className="job-details">
                    <h3>{job.title}</h3>
                    <p>{job.department} • {job.type}</p>
                  </div>
                </div>
                <div className="job-actions">
                  <span className="job-location">{job.location}</span>
                  <Link href={`/careers/${job.id}`} className="btn-apply">
                    Apply Now
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 4. GENERAL APPLICATION BANNER */}
      <motion.section 
        className="general-app-banner"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="banner-content">
          <div className="banner-text">
            <h2>Don't see a role for you?</h2>
            <p>
              We're always looking for talented individuals. Send us your 
              resume and we'll reach out if there's a fit.
            </p>
          </div>
          <Link href="/careers/general" className="btn-black-solid">
            General Application
          </Link>
        </div>
      </motion.section>

    </div>
  );
}