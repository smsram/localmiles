'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  ChartBarIcon, 
  CreditCardIcon, 
  UserCircleIcon, 
  ArrowUpTrayIcon, 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon 
} from '@heroicons/react/24/solid';
import '@/styles/HelpPage.css';

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
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function HelpPage() {
  const [userType, setUserType] = useState('sender'); // 'sender' or 'courier'

  return (
    <div className="help-page">
      
      {/* 1. HERO SECTION */}
      <section className="help-hero">
        <motion.div 
          initial="hidden" animate="visible" variants={fadeInUp}
        >
          <h1 className="help-title">How can we help?</h1>
          
          <div className="search-wrapper">
            <MagnifyingGlassIcon className="search-icon" />
            <input 
              type="text" 
              placeholder="Type your issue (e.g. 'tracking a package', 'invoice')..." 
              className="help-search-input"
            />
          </div>
        </motion.div>
      </section>

      {/* 2. ROLE TOGGLE */}
      <div className="role-toggle-container">
        <motion.div 
          className="role-toggle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button 
            className={`toggle-btn ${userType === 'sender' ? 'active' : ''}`}
            onClick={() => setUserType('sender')}
          >
            I am a Sender
          </button>
          <button 
            className={`toggle-btn ${userType === 'courier' ? 'active' : ''}`}
            onClick={() => setUserType('courier')}
          >
            I am a Courier
          </button>
        </motion.div>
      </div>

      {/* 3. CATEGORY GRID */}
      <section className="categories-section">
        <motion.div 
          className="categories-grid"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Card 1: Tracking */}
          <motion.div className="cat-card" variants={fadeInUp}>
            <div className="cat-icon-box">
              <ChartBarIcon width={24} />
            </div>
            <h3 className="cat-title">Tracking</h3>
            <ul className="cat-links">
              <li><Link href="#" className="cat-link">Real-time updates</Link></li>
              <li><Link href="#" className="cat-link">Status meanings</Link></li>
              <li><Link href="#" className="cat-link">Proof of delivery</Link></li>
            </ul>
          </motion.div>

          {/* Card 2: Payments */}
          <motion.div className="cat-card" variants={fadeInUp}>
            <div className="cat-icon-box">
              <CreditCardIcon width={24} />
            </div>
            <h3 className="cat-title">Payments</h3>
            <ul className="cat-links">
              <li><Link href="#" className="cat-link">Invoicing & Billing</Link></li>
              <li><Link href="#" className="cat-link">Refund Policy</Link></li>
              <li><Link href="#" className="cat-link">Adding Credit</Link></li>
            </ul>
          </motion.div>

          {/* Card 3: Account */}
          <motion.div className="cat-card" variants={fadeInUp}>
            <div className="cat-icon-box">
              <UserCircleIcon width={24} />
            </div>
            <h3 className="cat-title">Account</h3>
            <ul className="cat-links">
              <li><Link href="#" className="cat-link">Security Settings</Link></li>
              <li><Link href="#" className="cat-link">Team Management</Link></li>
              <li><Link href="#" className="cat-link">Notifications</Link></li>
            </ul>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. SUBMIT A REQUEST FORM */}
      <section className="form-section">
        <motion.div 
          className="form-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="section-headline">Submit a Request</h2>
          <p className="section-sub">
            Can't find what you're looking for? Submit a ticket and our team will get back to you within 24 hours.
          </p>

          <form className="ticket-form" onSubmit={(e) => e.preventDefault()}>
            
            <div className="form-row">
              <div className="form-group">
                <label className="f-label">Issue Type</label>
                <select className="f-select" defaultValue="">
                  <option value="" disabled>Select an issue type</option>
                  <option value="delivery">Delivery Delay</option>
                  <option value="damaged">Damaged Item</option>
                  <option value="billing">Billing Question</option>
                  <option value="account">Account Access</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="f-label">Order ID</label>
                <input type="text" placeholder="e.g. LM-12345678" className="f-input" />
                <span className="helper-text">Required for delivery issues</span>
              </div>
            </div>

            <div className="form-group">
              <label className="f-label">Description</label>
              <textarea 
                placeholder="Please provide as much detail as possible about your request..." 
                className="f-textarea"
              ></textarea>
            </div>

            <div className="form-group">
              <label className="f-label">Attachments</label>
              <div className="upload-area">
                <ArrowUpTrayIcon width={24} className="upload-icon" />
                <div className="upload-text-main">Upload Photo or drag and drop</div>
                <div className="upload-text-sub">Proof for damaged packages (JPG, PNG up to 10MB)</div>
              </div>
            </div>

            <button className="btn-submit">Submit Ticket</button>

          </form>
        </motion.div>
      </section>

      {/* 5. STILL STUCK? */}
      <section className="still-stuck">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
        >
          <h3 className="stuck-title">Still stuck?</h3>
          <p className="stuck-sub">
            Our support team is available 24/7 to help you with any issues or queries you might have.
          </p>
          
          <div className="contact-actions">
            <a href="https://wa.me/1234567890" target="_blank" className="btn-whatsapp">
              <ChatBubbleLeftRightIcon width={20} />
              Chat Support (WhatsApp)
            </a>
            <a href="mailto:support@localmiles.in" className="link-email">
              <EnvelopeIcon width={20} />
              Email us at support@localmiles.in
            </a>
          </div>
        </motion.div>
      </section>

    </div>
  );
}