'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRightIcon, 
  InformationCircleIcon, 
  PaperAirplaneIcon 
} from '@heroicons/react/24/solid';
import '@/styles/ContactPage.css';

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

const staggerForm = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const formItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function ContactPage() {
  return (
    <div className="contact-page">
      <div className="contact-split-layout">
        
        {/* --- LEFT COLUMN: INFO --- */}
        <motion.div 
          className="contact-left"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="headline-block">
            <h1 className="page-title">
              Business <br />
              <span className="page-title-accent">Inquiry</span>
            </h1>
          </div>

          <div className="info-block">
            <span className="section-label">Corporate Partnerships</span>
            <p className="desc-text">
              For logistics solutions and strategic collaborations.
            </p>
            <a href="mailto:partners@localmiles.in" className="email-link">
              partners@localmiles.in
            </a>
          </div>

          <div className="support-block">
            <span className="section-label">Customer Support</span>
            <Link href="/help" className="support-link">
              Need help? Visit Help Center <ArrowRightIcon width={16} />
            </Link>
          </div>
        </motion.div>

        {/* --- RIGHT COLUMN: FORM --- */}
        <div className="contact-right">
          
          {/* Notification Box */}
          <motion.div 
            className="info-box"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <InformationCircleIcon width={24} className="info-icon" />
            <p className="info-text">
              Are you a user looking for help with a delivery? Please use our{' '}
              <Link href="/help" className="info-link">Help Center</Link>. 
              This form is for corporate inquiries only.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form 
            className="contact-form"
            initial="hidden"
            animate="visible"
            variants={staggerForm}
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Name */}
            <motion.div className="form-group" variants={formItem}>
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                className="form-input" 
              />
            </motion.div>

            {/* Email */}
            <motion.div className="form-group" variants={formItem}>
              <label className="form-label">Work Email Address</label>
              <input 
                type="email" 
                placeholder="john@company.com" 
                className="form-input" 
              />
            </motion.div>

            {/* Company */}
            <motion.div className="form-group" variants={formItem}>
              <label className="form-label">Company / Organization Name</label>
              <input 
                type="text" 
                placeholder="Organization name" 
                className="form-input" 
              />
            </motion.div>

            {/* Inquiry Type (FIXED HERE) */}
            <motion.div className="form-group" variants={formItem}>
              <label className="form-label">Inquiry Type</label>
              <select className="form-select" defaultValue="">
                <option value="" disabled>Select Inquiry Type</option>
                <option value="partnership">Strategic Partnership</option>
                <option value="enterprise">Enterprise Solutions</option>
                <option value="fleet">Fleet Management</option>
                <option value="other">Other</option>
              </select>
            </motion.div>

            {/* Message */}
            <motion.div className="form-group" variants={formItem}>
              <label className="form-label">How can we work together?</label>
              <textarea 
                placeholder="Tell us about your requirements..." 
                className="form-textarea"
              ></textarea>
            </motion.div>

            {/* Submit */}
            <motion.button 
              type="submit" 
              className="btn-send"
              variants={formItem}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Send Message <PaperAirplaneIcon width={16} />
            </motion.button>

          </motion.form>
        </div>

      </div>
    </div>
  );
}