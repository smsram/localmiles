'use client';

export default function Skeleton({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px', 
  circle = false, 
  className = '',
  style = {}
}) {
  // Styles applied directly to the skeleton container
  const mergedStyle = {
    width,
    height,
    borderRadius: circle ? '50%' : borderRadius,
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'var(--border-light, #e5e7eb)',
    zIndex: 1,
    ...style
  };

  return (
    <>
      <style>{`
        /* The Shimmer Animation */
        @keyframes skeleton-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .skeleton-loader-item::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          /* Gradient that adapts to dark/light theme via opacity */
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.12) 50%,
            transparent 100%
          );
          animation: skeleton-shimmer 1.5s infinite linear;
        }

        /* Utility classes for Shipments Page layout */
        .shipment-skeleton-card {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-light, #e5e7eb);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
          width: 100%;
        }

        .skeleton-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          gap: 10px;
        }

        /* Handle responsive stacking for smaller screens */
        @media (max-width: 600px) {
          .skeleton-row.stack-mobile {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div 
        className={`skeleton-loader-item ${className}`} 
        style={mergedStyle} 
      />
    </>
  );
}