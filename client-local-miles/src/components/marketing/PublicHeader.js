'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image
import { usePathname } from 'next/navigation';

export default function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isDarkPage = pathname === '/about';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme Logic
  const theme = {
    bg: isDarkPage 
      ? (isScrolled ? 'rgba(17, 17, 17, 0.95)' : 'transparent') 
      : (isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'transparent'),
    text: isDarkPage ? '#FFFFFF' : '#222222',
    border: isDarkPage 
      ? (isScrolled ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent') 
      : (isScrolled ? '1px solid #E5E7EB' : '1px solid transparent'),
    btnBg: isDarkPage ? '#FFFFFF' : '#000000',
    btnText: isDarkPage ? '#111111' : '#FFFFFF',
  };

  const styles = {
    header: {
      height: '80px',
      width: '100%',
      position: 'fixed',
      top: 0,
      zIndex: 100,
      transition: 'all 0.3s ease',
      backgroundColor: theme.bg,
      borderBottom: theme.border,
      backdropFilter: isScrolled ? 'blur(10px)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inner: {
      width: '100%',
      maxWidth: '1300px',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logoLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      textDecoration: 'none',
    },
    logoText: {
      color: theme.text,
      fontWeight: '800',
      fontSize: '1.2rem',
      letterSpacing: '-0.5px',
      transition: 'color 0.3s',
    },
    navCenter: { display: 'flex', gap: '40px', alignItems: 'center' },
    navLink: {
      color: theme.text,
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: '500',
      transition: 'color 0.2s',
      opacity: 0.9,
    },
    rightActions: { display: 'flex', alignItems: 'center', gap: '24px' },
    loginLink: {
      color: theme.text,
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: '600',
      transition: 'color 0.3s',
    },
    getAppBtn: {
      backgroundColor: theme.btnBg,
      color: theme.btnText,
      padding: '12px 24px',
      borderRadius: '50px',
      textDecoration: 'none',
      fontSize: '0.9rem',
      fontWeight: '600',
      transition: 'transform 0.2s, opacity 0.2s',
      display: 'inline-block',
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        
        {/* 1. LEFT: LOGO IMAGE */}
        <Link href="/" style={styles.logoLink}>
          <Image 
            src="/local-miles.jpg" 
            alt="Local Miles Logo" 
            width={32} 
            height={32} 
            style={{ borderRadius: '6px' }} 
          />
          <span style={styles.logoText}>Local Miles</span>
        </Link>

        {/* 2. CENTER: NAV */}
        <nav style={styles.navCenter} className="hidden-mobile">
          {['Trust & Safety', 'Careers', 'Help'].map((item) => {
             const href = item === 'Trust & Safety' ? '/trust-safety' : `/${item.toLowerCase()}`;
             return (
              <Link 
                key={item} href={href} style={styles.navLink}
                onMouseEnter={(e) => { e.target.style.color = '#D4AF37'; e.target.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.target.style.color = theme.text; e.target.style.opacity = '0.9'; }}
              >
                {item}
              </Link>
             )
          })}
        </nav>

        {/* 3. RIGHT: ACTIONS */}
        <div style={styles.rightActions}>
          <Link 
            href="/login" style={styles.loginLink}
            onMouseEnter={(e) => e.target.style.color = '#D4AF37'}
            onMouseLeave={(e) => e.target.style.color = theme.text}
          >
            Log in
          </Link>
          <Link 
            href="#" style={styles.getAppBtn}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1'; }}
          >
            Get the App
          </Link>
        </div>
      </div>
      <style jsx>{`@media (max-width: 900px) { .hidden-mobile { display: none !important; } }`}</style>
    </header>
  );
}