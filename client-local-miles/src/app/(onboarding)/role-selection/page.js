'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CubeIcon, TruckIcon } from '@heroicons/react/24/solid';
import '@/styles/RoleSelection.css';

export default function RoleSelectionPage() {
  const router = useRouter();
  // State uses UPPERCASE to match Backend Enums directly
  const [selectedRole, setSelectedRole] = useState(null); // 'SENDER', 'BOTH', 'COURIER'
  const [loading, setLoading] = useState(false);

  // Safety Fallback for API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Session expired. Please login again.");
        return router.push('/login');
      }

      // 1. Call Backend to update role
      // We send { role: "SENDER" } etc.
      const res = await fetch(`${API_URL}/user/update-role`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: selectedRole }) 
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role");

      // 2. Update LocalStorage User (Optimistic Update)
      // This ensures if they refresh the page, they are still "logged in" with the new role
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          userObj.primaryGoal = selectedRole;
          
          // If they chose Courier, default their view to Courier mode. 
          // Otherwise (Sender or Both), default to Sender mode.
          userObj.lastActiveMode = selectedRole === 'COURIER' ? 'COURIER' : 'SENDER';
          
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch (e) {
          console.error("Error updating local storage user", e);
        }
      }

      // 3. Redirect Logic
      if (selectedRole === 'SENDER') {
        router.push('/sender');
      } else if (selectedRole === 'COURIER') {
        router.push('/courier');
      } else {
        // If BOTH, we default them to Sender dashboard initially.
        // They can toggle modes inside the app later.
        router.push('/sender');
      }

    } catch (error) {
      console.error(error);
      alert(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      
      {/* Header Logo */}
      <div className="logo-header">
        <Image src="/local-miles.jpg" alt="Local Miles" width={32} height={32} />
        <span className="logo-text">Local Miles</span>
      </div>

      <h1 className="main-title">
        How do you plan to use <br /> Local Miles?
      </h1>
      <p className="sub-title">
        Choose your primary goal. You can adjust this later in settings.
      </p>

      {/* Grid */}
      <div className="role-grid">
        
        {/* Card 1: Sender */}
        <div 
          className={`role-card ${selectedRole === 'SENDER' ? 'active' : ''}`}
          onClick={() => setSelectedRole('SENDER')}
        >
          <div className="icon-box">
            <CubeIcon width={32} />
          </div>
          <h3 className="role-name">Sender</h3>
          <p className="role-desc">I only want to send packages.</p>
        </div>

        {/* Card 2: Both (Recommended) */}
        <div 
          className={`role-card recommended ${selectedRole === 'BOTH' ? 'active' : ''}`}
          onClick={() => setSelectedRole('BOTH')}
        >
          <div className="badge-recommended">Recommended</div>
          <div className="icon-box">
            <div style={{display:'flex', gap: 4}}>
              <CubeIcon width={20} />
              <span style={{fontWeight:800}}>+</span>
              <TruckIcon width={20} />
            </div>
          </div>
          <h3 className="role-name">Both</h3>
          <p className="role-desc">Send packages AND earn money driving.</p>
        </div>

        {/* Card 3: Courier */}
        <div 
          className={`role-card ${selectedRole === 'COURIER' ? 'active' : ''}`}
          onClick={() => setSelectedRole('COURIER')}
        >
          <div className="icon-box">
            <TruckIcon width={32} />
          </div>
          <h3 className="role-name">Courier</h3>
          <p className="role-desc">I only want to accept delivery jobs.</p>
        </div>

      </div>

      {/* Continue Button */}
      <button 
        className={`btn-continue ${selectedRole ? 'enabled' : ''}`}
        onClick={handleContinue}
        disabled={!selectedRole || loading}
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>

      {/* Skip Link (Defaults to Sender) */}
      <Link href="/sender" className="skip-link">
        Skip setup and go to Profile
      </Link>

      <div className="footer-copy">
        © 2026 Local Miles Logistics. Professional SaaS for City Logistics.
      </div>

    </div>
  );
}