'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, CalendarDaysIcon, PlusIcon,
  ChevronLeftIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';
import ShipmentCard from '@/components/shipment/ShipmentCard';
import Dropdown from '@/components/ui/Dropdown';
import ConfirmModal from '@/components/ui/ConfirmModal'; // <-- IMPORT MODAL
import '@/styles/ShipmentsPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function ShipmentsPage() {
  const router = useRouter();
  
  // State
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  // --- FETCH DATA ---
  const fetchShipments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/auth/login'); return; }

      const query = new URLSearchParams({
        page,
        limit: 5,
        status: filterStatus !== 'all' ? filterStatus : ''
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
  }, [page, filterStatus, router]);

  // --- ACTIONS ---
  
  // 1. Open Details Page
  const handleViewDetails = (publicId) => {
    router.push(`/sender/shipments/${publicId}`);
  };

  // 2. Trigger Delete Modal
  const requestDelete = (publicId) => {
    setConfirmModal({ isOpen: true, shipmentId: publicId, isProcessing: false });
  };

  // 3. Execute Deletion
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
        // Remove locally to update UI instantly
        setShipments(prev => prev.filter(s => s.publicId !== shipmentId));
        // Close modal
        setConfirmModal({ isOpen: false, shipmentId: null, isProcessing: false });
        
        // Re-fetch to fix pagination counts
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
            placeholder="Search by ID..." 
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
          <div className="loading-state"><div className="spinner"></div><p>Loading Shipments...</p></div>
        ) : shipments.length > 0 ? (
          shipments.map((shipment) => (
            <ShipmentCard 
              key={shipment.id} 
              data={shipment} 
              onViewDetails={() => handleViewDetails(shipment.publicId)} // <--- View Details Action
              onDelete={() => requestDelete(shipment.publicId)}           // <--- Trigger Modal Action
            />
          ))
        ) : (
          <div className="empty-state">
            <p>No shipments found.</p>
            <button className="btn-clear" onClick={() => setFilterStatus('all')}>Clear Filters</button>
          </div>
        )}
      </div>

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className="pagination-footer">
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