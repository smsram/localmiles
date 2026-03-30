'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, PlusIcon,
  ChevronLeftIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';

// Components
import ShipmentCard from '@/components/shipment/ShipmentCard';
import Dropdown from '@/components/ui/Dropdown';
import ConfirmModal from '@/components/ui/ConfirmModal'; 
import Skeleton from '@/components/ui/Skeleton'; 

import '@/styles/ShipmentsPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ShipmentsPage() {
  const router = useRouter();
  
  // State
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Search state & Debounce
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // --- Modal State ---
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    shipmentId: null,
    isProcessing: false
  });

  // Dropdown Options
  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Drafts', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Transit', value: 'in_transit' },
    { label: 'Delivered', value: 'delivered' }
  ];

  // --- HANDLE DEBOUNCE FOR SEARCH ---
  // Wait 500ms after user stops typing before setting the debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // --- FETCH DATA ---
  const fetchShipments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      // Pass the debouncedSearch as 'search' to the backend
      const query = new URLSearchParams({
        page,
        limit: 5,
        status: filterStatus !== 'all' ? filterStatus : '',
        search: debouncedSearch
      });

      const res = await fetch(`${API_URL}/packages/my-shipments?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setShipments(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to load shipments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, debouncedSearch, router]);

  // --- ACTIONS ---
  
  // 1. Open Details Page (Used for general view/edit)
  const handleViewDetails = (publicId) => {
    router.push(`/sender/shipments/${publicId}`);
  };

  // 2. Open Track Page (Specifically for Live Tracking)
  const handleTrackLive = (publicId) => {
    router.push(`/track/${publicId}`);
  }

  // 3. Trigger Delete Modal
  const requestDelete = (publicId) => {
    setConfirmModal({ isOpen: true, shipmentId: publicId, isProcessing: false });
  };

  // 4. Execute Deletion
  const executeDelete = async () => {
    const { shipmentId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isProcessing: true }));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/packages/${shipmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setShipments(prev => prev.filter(s => s.publicId !== shipmentId));
        setConfirmModal({ isOpen: false, shipmentId: null, isProcessing: false });
        
        if (shipments.length === 1 && page > 1) {
            setPage(p => p - 1);
        } else {
            fetchShipments();
        }
      } else {
        alert(data.message || "Failed to delete.");
        setConfirmModal(prev => ({ ...prev, isProcessing: false }));
      }
    } catch (err) {
      alert("Error deleting shipment.");
      setConfirmModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // --- SKELETON RENDERER ---
  const renderSkeletons = () => {
    return Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="shipment-skeleton-card fade-in">
        <div className="skeleton-row">
          <Skeleton width="180px" height="24px" borderRadius="6px" />
          <Skeleton width="90px" height="28px" borderRadius="16px" />
        </div>
        <Skeleton width="60%" height="16px" />
        
        <div className="skeleton-row" style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Skeleton width="40px" height="40px" borderRadius="8px" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton width="120px" height="14px" />
              <Skeleton width="150px" height="14px" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton width="80px" height="36px" borderRadius="8px" />
            <Skeleton width="100px" height="36px" borderRadius="8px" />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="page-container shipments-page">
      
      {/* 1. Header */}
      <header className="shipments-header">
        <div className="header-content">
          <h1>My Shipments</h1>
          <p>Track your active packages and view history.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary-dark" onClick={() => router.push('/sender/send')}>
            <PlusIcon className="icon-sm" /> New Shipment
          </button>
        </div>
      </header>

      {/* 2. Filters */}
      <div className="filters-bar">
        <div className="filter-input-group search-group">
          <MagnifyingGlassIcon className="input-icon" />
          <input 
            type="text" 
            placeholder="Search by ID or Title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="dropdown-wrapper">
          <Dropdown 
            label="" 
            name="status"
            value={filterStatus}
            options={statusOptions}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* 3. List */}
      <div className="shipments-list">
        {loading ? (
          renderSkeletons()
        ) : shipments.length > 0 ? (
          shipments.map((shipment) => (
            <ShipmentCard 
              key={shipment.id} 
              data={shipment} 
              onViewDetails={() => handleViewDetails(shipment.publicId)} 
              onTrackLive={() => handleTrackLive(shipment.publicId)} // Assuming ShipmentCard expects this prop
              onDelete={() => requestDelete(shipment.publicId)}          
            />
          ))
        ) : (
          <div className="empty-state fade-in">
            <p>{searchQuery ? `No shipments found matching "${searchQuery}"` : "No shipments found."}</p>
            <button className="btn-clear" onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}>Clear Filters</button>
          </div>
        )}
      </div>

      {/* 4. Pagination */}
      {!loading && totalPages > 1 && (
        <div className="pagination-footer fade-in">
          <div className="pagination-info">Page <strong>{page}</strong> of <strong>{totalPages}</strong></div>
          <div className="pagination-controls">
            <button 
              className="page-btn" 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button 
              className="page-btn" 
              disabled={page === totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- RENDER MODAL --- */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, shipmentId: null, isProcessing: false })}
        onConfirm={executeDelete}
        title="Delete Draft"
        message="Are you sure you want to delete this shipment draft? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={confirmModal.isProcessing}
      />

    </div>
  );
}