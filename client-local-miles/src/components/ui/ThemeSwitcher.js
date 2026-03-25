'use client';
import { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme(); // Assuming toggleTheme switches dark/light
  const [hoveredBtn, setHoveredBtn] = useState(null);

  // If your theme provider uses 'courier' / 'sender' strings to determine dark/light mode:
  const isDark = theme === 'dark' || theme === 'courier'; // Adjust this logic based on your specific provider

  const getBtnStyle = (type) => {
    // Determine active state based on your specific theme string
    const isActive = (type === 'sender' && !isDark) || (type === 'courier' && isDark);
    const isHovered = hoveredBtn === type;

    return {
      flex: 1,
      background: isActive ? 'var(--brand-gold)' : 'transparent',
      border: 'none',
      color: isActive ? 'var(--brand-dark)' : (isHovered ? 'white' : '#9CA3AF'),
      padding: '10px',
      fontSize: '0.9rem',
      fontWeight: '600',
      cursor: 'pointer',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
    };
  };

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.08)',
        padding: '4px',
        borderRadius: '12px'
      }}>
        <button 
          style={getBtnStyle('sender')}
          // Assumes your provider has a way to explicitly set the string
          onClick={() => toggleTheme('sender')} 
          onMouseEnter={() => setHoveredBtn('sender')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          Sender
        </button>
        <button 
          style={getBtnStyle('courier')}
          onClick={() => toggleTheme('courier')}
          onMouseEnter={() => setHoveredBtn('courier')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          Courier
        </button>
      </div>
    </div>
  );
}