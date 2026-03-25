'use client';
import PublicHeader from '@/components/marketing/PublicHeader';
import GlobalFooter from '@/components/marketing/GlobalFooter';

export default function MarketingLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      
      {/* 1. Header (Sticky/Floating) */}
      <PublicHeader />
      
      {/* 2. Main Content */}
      <main style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      {/* 3. Footer */}
      <GlobalFooter />
    </div>
  );
}