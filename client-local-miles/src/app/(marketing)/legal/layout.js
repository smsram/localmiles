'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/styles/LegalDoc.css';

export default function LegalLayout({ children }) {
  const pathname = usePathname();

  const legalLinks = [
    { name: 'Terms of Service', href: '/legal/terms' },
    { name: 'Privacy Policy', href: '/legal/privacy' },
    { name: 'Courier Agreement', href: '/legal/courier-agreement' },
    { name: 'Prohibited Items', href: '/legal/prohibited-items' },
    { name: 'Refund Policy', href: '/legal/refund-policy' },
  ];

  return (
    <div className="legal-container">
      {/* Left Sidebar */}
      <aside className="legal-sidebar">
        <h5 className="legal-nav-title">Legal Documents</h5>
        <nav className="legal-nav-list">
          {legalLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`legal-nav-link ${pathname === link.href ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content (Wraps the Page) */}
      <main className="legal-content-wrapper">
        {children}
      </main>
    </div>
  );
}