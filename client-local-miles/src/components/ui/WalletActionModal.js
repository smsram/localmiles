'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, BanknotesIcon, ArrowDownTrayIcon, CreditCardIcon } from '@heroicons/react/24/outline';

export default function WalletActionModal({ isOpen, onClose, onSuccess, balance = 0, defaultTab = 'add' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    setMounted(true);
    // THEME SYNC FIX
    const htmlElement = document.documentElement;
    const syncTheme = () => {
      const themeAttr = htmlElement.getAttribute('data-theme');
      setCurrentTheme(themeAttr || (htmlElement.classList.contains('dark') ? 'dark' : 'light'));
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    if (isOpen) {
      setAmount(''); setActiveTab(defaultTab); document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { observer.disconnect(); document.body.style.overflow = 'unset'; };
  }, [isOpen, defaultTab]);

  if (!mounted || !isOpen) return null;

  const handleTransaction = async (e) => {
    e.preventDefault();
    const numAmt = Number(amount);
    
    if (!amount || isNaN(amount) || numAmt <= 0) return onSuccess({ error: "Enter a valid amount" });
    
    // --- ADD THIS CHECK ---
    if (activeTab === 'add' && numAmt > 5000) return onSuccess({ error: "Maximum add limit is ₹5,000 at a time." });
    
    if (activeTab === 'withdraw' && numAmt > balance) return onSuccess({ error: "Insufficient wallet balance" });
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = activeTab === 'add' ? '/wallet/topup' : '/wallet/withdraw';
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: numAmt })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess({ success: data.message });
        onClose();
      } else {
        onSuccess({ error: data.message });
      }
    } catch (err) {
      onSuccess({ error: "Network error processing request." });
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000];

  return createPortal(
    <div data-theme={currentTheme} className={currentTheme === 'dark' ? 'dark' : ''}>
      <div className="wam-overlay" onClick={!isProcessing ? onClose : undefined}>
        <div className="wam-card" onClick={e => e.stopPropagation()}>
          
          <div className="wam-header">
            <h2 className="wam-title">Wallet Actions</h2>
            <button onClick={onClose} disabled={isProcessing} className="wam-close-btn"><XMarkIcon width={24} /></button>
          </div>

          <div className="wam-tabs">
            <button className={`wam-tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}><BanknotesIcon width={18}/> Add</button>
            <button className={`wam-tab ${activeTab === 'withdraw' ? 'active' : ''}`} onClick={() => setActiveTab('withdraw')}><ArrowDownTrayIcon width={18}/> Withdraw</button>
            <button className={`wam-tab ${activeTab === 'cards' ? 'active' : ''}`} onClick={() => setActiveTab('cards')}><CreditCardIcon width={18}/> Cards</button>
          </div>

          {activeTab !== 'cards' ? (
            <form onSubmit={handleTransaction}>
              <div className="wam-balance-check">Available Balance: ₹{balance.toFixed(2)}</div>
              <div className="wam-input-wrapper">
                <span className="wam-currency">₹</span>
                <input 
                  type="number" min="1" placeholder="0.00" value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  className="wam-input" autoFocus disabled={isProcessing}
                />
              </div>

              <div className="wam-quick-grid">
                {quickAmounts.map(amt => (
                  <button key={amt} type="button" className="wam-quick-btn" onClick={() => setAmount(amt.toString())} disabled={isProcessing}>
                    ₹{amt}
                  </button>
                ))}
              </div>

              <button type="submit" className="wam-submit-btn" disabled={isProcessing || !amount}>
                {isProcessing ? 'Processing...' : (activeTab === 'add' ? 'Proceed to Pay' : 'Confirm Withdrawal')}
              </button>
            </form>
          ) : (
            <div className="wam-cards-view">
              <div className="wam-saved-card">
                <CreditCardIcon width={24} color="var(--brand-gold)" />
                <div style={{flex: 1, textAlign: 'left'}}><strong>Visa ending in 4242</strong><p style={{margin:0, fontSize:'0.8rem', color:'var(--text-muted)'}}>Expires 12/28</p></div>
                <button className="wam-remove-card">Remove</button>
              </div>
              <button className="wam-submit-btn" style={{background: 'var(--bg-page)', color: 'var(--text-main)', border: '1px dashed var(--border-light)'}}>
                + Add New Card
              </button>
            </div>
          )}

        </div>
      </div>
      <style>{`
        .wam-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 99999; animation: fadeIn 0.2s; padding: 20px; }
        .wam-card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 20px; width: 100%; max-width: 400px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .wam-header { display: flex; justify-content: space-between; alignItems: center; margin-bottom: 20px; }
        .wam-title { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--text-main); }
        .wam-close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; transition: 0.2s; }
        .wam-close-btn:hover { color: var(--text-main); }
        
        .wam-tabs { display: flex; background: var(--bg-page); border-radius: 12px; padding: 4px; margin-bottom: 24px; }
        .wam-tab { flex: 1; padding: 10px; border: none; background: transparent; color: var(--text-muted); font-weight: 600; border-radius: 8px; cursor: pointer; display: flex; alignItems: center; justify-content: center; gap: 6px; transition: 0.2s; }
        .wam-tab.active { background: var(--bg-card); color: var(--text-main); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        
        .wam-balance-check { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; text-align: right; }
        .wam-input-wrapper { position: relative; margin-bottom: 20px; }
        .wam-currency { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.5rem; font-weight: 700; color: var(--text-muted); }
        .wam-input { width: 100%; padding: 16px 16px 16px 45px; font-size: 1.5rem; font-weight: 700; border-radius: 12px; border: 2px solid var(--border-light); outline: none; color: var(--text-main); background: var(--bg-page); transition: 0.2s; }
        .wam-input:focus { border-color: var(--brand-gold); }
        
        .wam-quick-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 24px; }
        .wam-quick-btn { padding: 8px; border-radius: 8px; border: 1px solid var(--border-light); background: var(--bg-page); color: var(--text-main); font-weight: 600; cursor: pointer; transition: 0.2s; }
        .wam-quick-btn:hover { border-color: var(--brand-gold); color: var(--brand-gold); }
        
        .wam-submit-btn { width: 100%; padding: 16px; border-radius: 12px; border: none; background: var(--brand-gold); color: #171717; font-size: 1.05rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .wam-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .wam-submit-btn:hover:not(:disabled) { transform: translateY(-2px); opacity: 0.9; }

        .wam-saved-card { display: flex; alignItems: center; gap: 12px; padding: 16px; border: 1px solid var(--border-light); border-radius: 12px; margin-bottom: 16px; }
        .wam-remove-card { background: transparent; border: none; color: #EF4444; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
      `}</style>
    </div>,
    document.body
  );
}