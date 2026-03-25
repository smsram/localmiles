'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon
} from '@heroicons/react/24/outline';

export default function ImageGallery({ 
  images = [], 
  onRemove, 
  appendComponent,
  cloudName // Accept dynamically fetched cloud name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // SAFELY FORMAT URLS (Blobs, Full URLs, and Raw Public IDs)
  const getImageUrl = (url, isThumbnail = false) => {
    if (!url) return '';
    
    // 1. Local Upload Preview (Blob)
    if (url.startsWith('blob:')) return url; 
    
    // 2. Already a full URL
    if (url.startsWith('http')) {
      if (url.includes('cloudinary.com') && !url.includes('/upload/c_fill')) {
        if (isThumbnail) return url.replace('/upload/', '/upload/c_fill,h_200,w_200,q_auto,f_auto/');
        return url.replace('/upload/', '/upload/q_auto,f_auto/');
      }
      return url;
    }

    // 3. Raw Public ID from Backend (Uses passed cloudName)
    const cName = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
    if (isThumbnail) {
      return `https://res.cloudinary.com/${cName}/image/upload/c_fill,h_200,w_200,q_auto,f_auto/${url}`;
    }
    return `https://res.cloudinary.com/${cName}/image/upload/q_auto,f_auto/${url}`;
  };

  const openGallery = (index) => {
    setCurrentIndex(index);
    setZoomLevel(1);
    setIsOpen(true);
  };

  const closeGallery = () => {
    setIsOpen(false);
    setZoomLevel(1);
  };

  const goNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
  };

  const goPrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoomLevel(1);
  };

  const toggleZoom = (e) => {
    if (e) e.stopPropagation();
    setZoomLevel(prev => prev === 1 ? 2 : 1);
  };

  const styles = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '12px' },
    thumbBox: { 
        position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
        border: '1px solid var(--border-light)', transition: 'all 0.2s', backgroundColor: 'var(--bg-page)'
    },
    thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
    removeBtn: {
        position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
        borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)'
    },
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 99999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(10px)', animation: 'igFadeIn 0.2s ease-out'
    },
    header: { position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
    counter: { color: 'white', fontSize: '1rem', fontWeight: '600', letterSpacing: '2px' },
    actionRow: { display: 'flex', gap: '12px' },
    iconBtn: {
        background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', 
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
    },
    imageContainer: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '60px 20px' },
    mainImg: { maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transition: 'transform 0.3s', transform: `scale(${zoomLevel})`, cursor: zoomLevel === 1 ? 'zoom-in' : 'zoom-out' },
    navBtn: {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
        width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
    }
  };

  return (
    <>
      <div style={styles.grid}>
        {images.map((img, idx) => (
          <div key={img.id || idx} style={styles.thumbBox} className="ig-thumb-hover">
            <img 
              src={getImageUrl(img.url, true)} 
              alt={`Attachment ${idx + 1}`} 
              style={styles.thumbImg} 
              onClick={() => openGallery(idx)}
              onError={(e) => e.target.style.display = 'none'} // Fallback if image is broken
            />
            {onRemove && (
              <button style={styles.removeBtn} className="ig-remove-btn" onClick={(e) => { e.stopPropagation(); onRemove(img); }}>
                <XMarkIcon width={14} strokeWidth={3} />
              </button>
            )}
          </div>
        ))}
        {appendComponent}
      </div>

      {mounted && isOpen && images.length > 0 && createPortal(
        <div style={styles.overlay} onClick={closeGallery}>
          <div style={styles.header}>
            <div style={styles.counter}>{currentIndex + 1} / {images.length}</div>
            <div style={styles.actionRow}>
              <button style={styles.iconBtn} className="ig-hover-btn" onClick={toggleZoom}>
                {zoomLevel === 1 ? <MagnifyingGlassPlusIcon width={24}/> : <MagnifyingGlassMinusIcon width={24}/>}
              </button>
              <button style={{...styles.iconBtn, background: 'rgba(239, 68, 68, 0.8)'}} className="ig-close-hover" onClick={closeGallery}>
                <XMarkIcon width={24} />
              </button>
            </div>
          </div>

          <div style={styles.imageContainer} onClick={toggleZoom}>
            {images.length > 1 && <button style={{...styles.navBtn, left: '20px'}} className="ig-hover-btn" onClick={goPrev}><ChevronLeftIcon width={28} /></button>}
            <img src={getImageUrl(images[currentIndex].url, false)} alt="Full screen" style={styles.mainImg} onClick={(e) => e.stopPropagation()} />
            {images.length > 1 && <button style={{...styles.navBtn, right: '20px'}} className="ig-hover-btn" onClick={goNext}><ChevronRightIcon width={28} /></button>}
          </div>

          <style>{`
            @keyframes igFadeIn { from { opacity: 0; } to { opacity: 1; } }
            .ig-thumb-hover:hover { border-color: var(--text-muted) !important; transform: translateY(-2px); }
            .ig-remove-btn:hover { background: #EF4444 !important; transform: scale(1.1); }
            .ig-hover-btn:hover { background: rgba(255,255,255,0.25) !important; transform: scale(1.1); }
            .ig-close-hover:hover { background: #DC2626 !important; transform: scale(1.1); }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
}