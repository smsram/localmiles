'use client';
import { useState, useEffect, useRef } from 'react';
import { CheckIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/solid';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);

  // Fetch notifications on mount to get the unread count
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (err) { console.error("Failed to fetch notifications"); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      
      {/* BELL ICON TRIGGER */}
      <button 
        className="icon-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
      >
        <BellIcon style={{ width: '24px', height: '24px' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '0px', right: '2px', background: '#EF4444', color: 'white',
            fontSize: '0.65rem', fontWeight: 800, width: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', border: '2px solid var(--bg-page)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN CONTAINER */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: '0', width: '350px', maxHeight: '450px',
          background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 100,
          overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Notifications</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--brand-gold)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XMarkIcon width={20}/></button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Loading...</p>
            ) : notifications.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>All caught up!</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px', borderRadius: '10px', marginBottom: '8px',
                  background: n.isRead ? 'transparent' : 'var(--bg-page)', border: '1px solid',
                  borderColor: n.isRead ? 'transparent' : 'var(--border-light)', position: 'relative'
                }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>{n.title}</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!n.isRead && <button onClick={() => markAsRead(n.id)} style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer' }} title="Mark Read"><CheckIcon width={16}/></button>}
                      <button onClick={() => deleteNotification(n.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }} title="Delete"><TrashIcon width={16}/></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}