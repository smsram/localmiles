'use client';
import Link from 'next/link';
import Image from 'next/image'; // Import Image
import { 
  HeartIcon, ShareIcon, GlobeAltIcon, CameraIcon, 
  DevicePhoneMobileIcon, PlayIcon 
} from '@heroicons/react/24/solid';
import '@/styles/Footer.css';

export default function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-wrapper">
      <div className="footer-content">
        
        <div className="footer-grid">
          
          {/* Col 1: Brand with Image Logo */}
          <div className="footer-brand">
            <div className="footer-logo">
              {/* Updated to use local-miles.jpg */}
              <Image 
                src="/local-miles.jpg" 
                alt="Local Miles Logo" 
                width={32} 
                height={32} 
                style={{ borderRadius: '6px' }} 
              />
              <span>LOCAL MILES</span>
            </div>
            
            <p className="footer-desc">
              The heartbeat of city logistics. Connecting senders and couriers 
              through intelligent tech.
            </p>

            <div className="social-row">
              <button className="social-btn"><ShareIcon width={18}/></button>
              <button className="social-btn"><GlobeAltIcon width={18}/></button>
              <button className="social-btn"><CameraIcon width={18}/></button>
            </div>
          </div>

          {/* Col 2: Company */}
          <div>
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links">
              <li><Link href="/about" className="footer-link">About Us</Link></li>
              <li>
                <Link href="/careers" className="footer-link">
                  Careers <span className="hiring-badge">HIRING</span>
                </Link>
              </li>
              <li><Link href="/blog" className="footer-link">Blog</Link></li>
              <li><Link href="/trust-safety" className="footer-link">Trust & Safety</Link></li>
              <li><Link href="/help" className="footer-link">Help Center</Link></li>
              <li><Link href="/community" className="footer-link">Community</Link></li>
              <li><Link href="/contact" className="footer-link">Contact Support</Link></li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div>
            <h4 className="footer-col-title">Legal & Trust</h4>
            <ul className="footer-links">
              <li><Link href="/legal/terms" className="footer-link">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="footer-link">Privacy Policy</Link></li>
              <li><Link href="/legal/courier-agreement" className="footer-link">Courier Agreement</Link></li>
              <li><Link href="/legal/prohibited-items" className="footer-link">Prohibited Items</Link></li>
              <li><Link href="/legal/refund-policy" className="footer-link">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Col 4: App Store */}
          <div className="app-store-col">
            <h4 className="footer-col-title">Get The App</h4>
            <a href="#" className="app-btn">
              <DevicePhoneMobileIcon className="btn-icon" />
              <div className="btn-text-col">
                <span className="btn-label">Download on the</span>
                <span className="btn-store">App Store</span>
              </div>
            </a>
            <a href="#" className="app-btn">
              <PlayIcon className="btn-icon" />
              <div className="btn-text-col">
                <span className="btn-label">Get it on</span>
                <span className="btn-store">Google Play</span>
              </div>
            </a>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="footer-bottom">
          <span>© {currentYear} Local Miles. All rights reserved.</span>
          <span className="made-with">
            Made with <HeartIcon className="heart-icon" /> in India
          </span>
        </div>

      </div>
    </footer>
  );
}