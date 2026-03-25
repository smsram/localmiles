'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// Internal helper to handle hover state via inline styles
function DropdownItem({ label, isSelected, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '10px 12px',
        fontSize: '0.95rem',
        cursor: 'pointer',
        transition: 'background 0.1s',
        // Dynamic Inline Styles for State
        color: isSelected || isHovered ? 'var(--brand-gold)' : 'var(--text-main)',
        backgroundColor: isSelected 
          ? 'var(--accent-bg)' 
          : (isHovered ? 'var(--bg-page)' : 'transparent'),
        fontWeight: isSelected ? 600 : 400,
      }}
    >
      {label}
    </div>
  );
}

export default function Dropdown({ label, options, value, onChange, name }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const currentLabel = options.find(opt => opt.value === value)?.label || 'Select...';

  return (
    <div 
      ref={dropdownRef} 
      style={{ 
        position: 'relative', 
        width: '100%', 
        marginBottom: '24px' // Spacing for form flow
      }}
    >
      {label && (
        <label style={{ 
          display: 'block', 
          fontSize: '0.85rem', 
          fontWeight: 600, 
          color: 'var(--text-muted)', 
          marginBottom: '8px' 
        }}>
          {label}
        </label>
      )}
      
      {/* Trigger Area */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '0.95rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: 'var(--bg-page)', // Theme aware
          color: 'var(--text-main)',
          // Conditional Borders & Shadows
          border: isOpen || isTriggerHovered 
            ? '1px solid var(--brand-gold)' 
            : '1px solid var(--border-light)',
          boxShadow: isOpen 
            ? '0 0 0 3px var(--accent-bg)' 
            : 'none'
        }}
      >
        <span>{currentLabel}</span>
        <ChevronDownIcon 
          style={{ 
            width: '18px', 
            height: '18px', 
            color: 'var(--text-muted)',
            flexShrink: 0,
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </div>

      {/* Dropdown Menu */}
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        zIndex: 50,
        overflow: 'hidden',
        maxHeight: '250px',
        overflowY: 'auto',
        // Animation States
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {options.map((option) => (
          <DropdownItem 
            key={option.value}
            label={option.label}
            isSelected={value === option.value}
            onClick={() => handleSelect(option.value)}
          />
        ))}
      </div>
    </div>
  );
}