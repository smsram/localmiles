'use client';
import { useState } from 'react';
import { 
  ClockIcon, 
  ArrowLongRightIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import ResponsiveActionMenu from './ResponsiveActionMenu';

export default function ActivityCard({ type = 'scheduled', data }) {
  const [isHovered, setIsHovered] = useState(false);

  // --- 1. SCHEDULED CARD (Mission Style) ---
  if (type === 'scheduled') {
    return (
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: isHovered ? '1px solid var(--brand-gold)' : '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow: isHovered ? '0 12px 24px rgba(0,0,0,0.1)' : 'none',
          position: 'relative',
          overflow: 'hidden' 
        }}
      >
        {/* Left Accent Border (Animated) */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: '4px',
          backgroundColor: 'var(--brand-gold)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }} />

        {/* Header: Time & Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ 
            fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', 
            display: 'flex', alignItems: 'center', gap: '10px' 
          }}>
            <ClockIcon style={{ width: '20px', color: 'var(--brand-gold)' }} />
            {data.timeSlot}
          </div>
          <span style={{
            fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
            backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6',
            padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            {data.badge}
          </span>
        </div>

        {/* Body: Route & Cargo */}
        <div style={{
          display: 'flex', gap: '32px', padding: '16px 0',
          borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1.2, minWidth: '150px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', letterSpacing: '0.5px' }}>
              ROUTE PATH
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {data.pickup} 
              <ArrowLongRightIcon style={{ width: '18px', color: 'var(--text-muted)' }}/> 
              {data.drop}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', letterSpacing: '0.5px' }}>
              CARGO
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '600' }}>
              {data.cargo}
            </div>
          </div>
        </div>

        {/* Footer: Earnings & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '2px' }}>
              EST. EARNINGS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
              ₹ {data.earnings}
            </div>
          </div>
          
          <ResponsiveActionMenu 
            primary={{ 
              label: 'View Details', 
              style: 'gold', 
              onClick: () => console.log('View', data.id) 
            }}
            menuItems={[
              { label: 'Cancel Job', icon: XCircleIcon, color: '#EF4444', onClick: () => alert('Cancelled') },
              { label: 'Contact Support', icon: ExclamationCircleIcon, onClick: () => alert('Support') }
            ]}
            title={`Manage Job ${data.id}`}
          />
        </div>
      </div>
    );
  }

  // --- 2. HISTORY CARD (Compact Row Style) ---
  const isSuccess = data.status === 'success';

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: isHovered ? '1px solid var(--brand-gold)' : '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease-out',
        transform: isHovered ? 'scale(1.005)' : 'scale(1)',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
        flexWrap: 'wrap', 
        gap: '16px'
      }}
    >
      {/* Left Side: Icon & Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '200px' }}>
        
        {/* Status Icon with Scale Animation */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.3s',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: isSuccess ? '#10B981' : '#EF4444'
        }}>
          {isSuccess ? <CheckCircleIcon width={24} /> : <XCircleIcon width={24} />}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div 
            style={{ 
              fontSize: '0.85rem', fontWeight: '700', 
              color: isHovered ? 'var(--brand-gold)' : 'var(--text-main)',
              cursor: 'pointer', textDecoration: isHovered ? 'underline' : 'none',
              transition: 'color 0.2s'
            }}
          >
            {data.id}
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {data.route}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {data.date}
          </span>
        </div>
      </div>

      {/* Right Side: Amount & Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <span style={{ 
          fontSize: '1rem', fontWeight: '700', 
          color: isSuccess ? '#10B981' : 'var(--text-muted)',
          textDecoration: isSuccess ? 'none' : 'line-through'
        }}>
          {data.amount}
        </span>
        
        <ResponsiveActionMenu 
          menuItems={[
            { label: 'Proof of Delivery', icon: PhotoIcon, onClick: () => alert('Photo') },
            { label: 'Report Issue', icon: ExclamationCircleIcon, onClick: () => alert('Report') },
            { label: 'Download Invoice', icon: DocumentArrowDownIcon, onClick: () => alert('Downloading') }
          ]}
          title={`Actions for ${data.id}`}
        />
      </div>
    </div>
  );
}