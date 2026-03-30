'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DevicePhoneMobileIcon, CubeIcon, DocumentTextIcon,
  PencilSquareIcon, TrashIcon, PlayCircleIcon, MapPinIcon
} from '@heroicons/react/24/solid';
import ResponsiveActionMenu from '@/components/ui/ResponsiveActionMenu';
import '@/styles/ShipmentCard.css';

// --- HELPER FUNCTIONS ---
const getTypeConfig = (type) => {
  switch (type?.toUpperCase()) {
    case 'ELECTRONICS': return { icon: DevicePhoneMobileIcon, theme: 'cream' };
    case 'DOCUMENTS': return { icon: DocumentTextIcon, theme: 'blue' };
    default: return { icon: CubeIcon, theme: 'cream' };
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'DELIVERED': return 'status-delivered';
    case 'DRAFT': return 'status-draft';
    case 'PENDING': return 'status-pending';
    default: return 'status-pending'; 
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
};

const truncateLoc = (loc) => loc?.split(',')[0] || 'Location';

// --- MAIN COMPONENT ---
export default function ShipmentCard({ data, onViewDetails, onTrackLive, onDelete }) { 
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);

  const { 
    publicId, title, updatedAt, category, 
    pickupAddress, dropAddress, 
    status, price 
  } = data;

  const typeConfig = getTypeConfig(category);
  const Icon = typeConfig.icon;
  const statusClass = getStatusClass(status);

  // --- ACTIONS LOGIC ---
  
  // Default primary action for active shipments
  let primaryAction = { 
    label: 'Track', 
    icon: MapPinIcon,
    // Use the onTrackLive prop passed from the parent if available, otherwise fallback to router push
    onClick: onTrackLive ? onTrackLive : () => router.push(`/track/${publicId}`)
  };
  
  // If the package is a DRAFT, the primary goal is to complete the payment
  if (status === 'DRAFT') {
    primaryAction = { 
      label: 'Pay Now', 
      icon: PlayCircleIcon,
      style: 'gold', 
      onClick: () => router.push(`/sender/send/checkout/${publicId}`) 
    };
  }

  // Base Menu Items available for all packages
  const menuItems = [
    { 
      label: "View Details", 
      icon: DocumentTextIcon, 
      onClick: onViewDetails 
    },
  ];

  // Specific Menu Items for Drafts
  if (status === 'DRAFT') {
    menuItems.unshift({ 
      label: "Edit Draft", 
      icon: PencilSquareIcon, 
      onClick: () => router.push(`/sender/send?edit=${publicId}`) 
    });
    menuItems.push({ 
      label: "Delete Draft", 
      icon: TrashIcon, 
      color: 'var(--error-red, #EF4444)', 
      onClick: onDelete 
    });
  }

  return (
    <div className={`shipment-card ${isActive ? 'z-active' : ''}`}>
      
      {/* 1. INFO */}
      <div className="section-info">
        <div className={`icon-box theme-${typeConfig.theme}`}>
          <Icon className="icon-24" />
        </div>
        <div className="text-details">
          <span className="id-tag">{publicId}</span>
          <h4 className="title-tag">{title}</h4>
          <span className="date-tag">{formatDate(updatedAt)}</span>
        </div>
      </div>

      {/* 2. ROUTE */}
      <div className="section-route">
        <div className="route-inner">
            <div className="route-header">
                <span className="loc-text" title={pickupAddress}>{truncateLoc(pickupAddress)}</span>
                <span className="transit-text">{status === 'DRAFT' ? 'Draft' : 'In Transit'}</span>
                <span className="loc-text align-right" title={dropAddress}>{truncateLoc(dropAddress)}</span>
            </div>
            <div className="progress-track">
                <div className="progress-fill" style={{ width: status === 'DELIVERED' ? '100%' : (status === 'DRAFT' ? '0%' : '50%') }}></div>
            </div>
            <div className="route-footer">
                <div className="indicator-group"><div className="dot filled"></div><span>PICKUP</span></div>
                <div className="indicator-group align-right"><div className={`dot ${status === 'DELIVERED' ? 'filled' : 'hollow'}`}></div><span>DROP</span></div>
            </div>
        </div>
      </div>

      <div className="vertical-divider"></div>

      {/* 3. ACTIONS */}
      <div className="section-actions">
          <div className="price-column">
             <div className={`status-badge ${statusClass}`}>
                <div className="badge-dot"></div>{status}
             </div>
             <div className="price-tag">₹{price}</div>
          </div>

          <div className="buttons-row">
            <ResponsiveActionMenu 
                primary={primaryAction}
                secondary={{ 
                  label: "Menu", 
                }}
                menuItems={menuItems}
                title="Options"
                // This ensures the dropdown doesn't get clipped by other cards below it
                onOpenChange={setIsActive} 
            />
          </div>
      </div>
    </div>
  );
}