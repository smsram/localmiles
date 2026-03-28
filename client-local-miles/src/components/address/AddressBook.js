'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  MagnifyingGlassIcon, PlusIcon, HomeIcon, BuildingOfficeIcon, 
  HeartIcon, UserIcon, PhoneIcon, TrashIcon, CheckBadgeIcon, PencilSquareIcon 
} from '@heroicons/react/24/outline';
import { PlusIcon as PlusSolid } from '@heroicons/react/24/solid';

import '@/styles/AddressBook.css';
import ResponsiveActionMenu from '@/components/ui/ResponsiveActionMenu';
import Skeleton from '@/components/ui/Skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function AddressCard({ data, onSetDefault, onDelete, onEdit }) {
  const getIcon = () => {
    switch (data.type?.toLowerCase()) {
      case 'home': return { icon: HomeIcon, style: 'gold' };
      case 'office': return { icon: BuildingOfficeIcon, style: 'grey' };
      default: return { icon: HeartIcon, style: 'red' };
    }
  };

  const { icon: Icon, style } = getIcon();

  const menuItems = [
    { label: 'Edit Address', icon: PencilSquareIcon, onClick: () => onEdit(data.id) },
    { label: 'Set as Default', icon: CheckBadgeIcon, onClick: () => onSetDefault(data.id) },
    { label: 'Delete Address', icon: TrashIcon, color: '#EF4444', onClick: () => onDelete(data.id) },
  ];

  return (
    <div className={`address-card ${data.isDefault ? 'default' : ''}`}>
      <div className="card-header">
        <div className={`icon-wrapper ${style}`}><Icon className="card-icon" /></div>
        <div className="card-menu"><ResponsiveActionMenu menuItems={menuItems} title={`Options for ${data.title}`} /></div>
      </div>
      <div className="card-body">
        <div className="title-row">
          <h3 className="card-title">{data.title}</h3>
          {data.isDefault && <span className="default-badge">Default</span>}
        </div>
        <p className="address-text">{data.line1}</p>
        <p className="address-text">{data.line2 || `${data.city}, ${data.pincode}`}</p>
      </div>
      <div className="card-footer">
        <div className="contact-item"><UserIcon className="contact-icon" /><div className="contact-column"><span className="contact-text">{data.contactName || '-'}</span></div></div>
        <div className="contact-item"><PhoneIcon className="contact-icon" /><span className="contact-text">{data.contactPhone || '-'}</span></div>
      </div>
    </div>
  );
}

export default function AddressBook() {
  const router = useRouter(); 
  const pathname = usePathname();
  
  // DYNAMIC BASE PATH: Automatically adapts to Sender or Courier dashboard
  const basePath = pathname.startsWith('/courier') ? '/courier' : '/sender';

  const [addresses, setAddresses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_URL}/addresses`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAddresses(data.data);
    } catch (err) { console.error("Fetch Error:", err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/addresses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchAddresses();
    } catch (err) { console.error(err); }
  };

  const handleSetDefault = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/addresses/${id}/default`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      fetchAddresses();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (id) => router.push(`${basePath}/address/edit/${id}`);

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="address-card" style={{ pointerEvents: 'none' }}>
          <div className="card-header" style={{ marginBottom: '15px' }}>
            <Skeleton width="40px" height="40px" circle={true} />
            <Skeleton width="24px" height="24px" borderRadius="4px" />
          </div>
          <div style={{ padding: '0 16px', marginBottom: '20px' }}>
             <Skeleton width="60%" height="20px" style={{ marginBottom: '10px' }} />
             <Skeleton width="90%" height="14px" style={{ marginBottom: '6px' }} />
             <Skeleton width="70%" height="14px" />
          </div>
          <div className="card-footer" style={{ borderTop: '1px solid var(--border-light)' }}>
             <Skeleton width="40%" height="12px" />
             <Skeleton width="40%" height="12px" />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="page-container address-book fade-in">
      <div className="page-header">
        <h1>Saved Addresses</h1>
        <p className="subtitle">Manage your pickup and delivery locations.</p>
      </div>

      <div className="controls-bar">
        <div className="search-wrapper">
          <MagnifyingGlassIcon className="search-icon" />
          <input type="text" placeholder="Search addresses..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="btn-add-address" onClick={() => router.push(`${basePath}/address/create`)}>
          <PlusIcon style={{ width: 20, height: 20 }} /> Add New Address
        </button>
      </div>

      <div className="address-grid">
        {loading ? renderSkeletons() : (
          <>
            {addresses.filter(addr => addr.title.toLowerCase().includes(searchTerm.toLowerCase())).map(addr => (
              <AddressCard key={addr.id} data={addr} onDelete={handleDelete} onSetDefault={handleSetDefault} onEdit={handleEdit} />
            ))}
            <div className="add-new-card" onClick={() => router.push(`${basePath}/address/create`)}>
              <div className="plus-circle"><PlusSolid style={{ width: 28, height: 28 }} /></div>
              <span className="add-new-text">Add New Address</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}