'use client';

export default function LoadingSpinner({ text, fullPage = false, size = 40 }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      ...(fullPage ? {
        position: 'fixed',
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        backgroundColor: 'var(--bg-page, #f9f9f9)',
        zIndex: 9999
      } : {
        width: '100%',
        padding: '24px 0'
      })
    }}>
      {/* Standard Style Tag for Keyframes (No JSX attribute) */}
      <style>{`
        .inline-spinner-circle {
          border: 3px solid var(--border-light, #e5e7eb);
          border-top-color: var(--brand-gold, #D4AF37);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div 
        className="inline-spinner-circle" 
        style={{ width: size, height: size }}
      />
      
      {text && (
        <p style={{ 
          color: 'var(--text-muted, #6b7280)', 
          fontWeight: 600, 
          fontSize: '0.95rem', 
          margin: 0 
        }}>
          {text}
        </p>
      )}
    </div>
  );
}