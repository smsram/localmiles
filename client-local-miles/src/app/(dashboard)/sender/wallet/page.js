'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BanknotesIcon, CreditCardIcon, ArrowRightIcon,
  ArrowDownLeftIcon, ArrowUpRightIcon, StarIcon 
} from '@heroicons/react/24/solid';
import { WalletIcon } from '@heroicons/react/24/outline';
import WalletActionModal from '@/components/ui/WalletActionModal';
import ToastNotification from '@/components/ui/ToastNotification';
import Skeleton from '@/components/ui/Skeleton';
import '@/styles/WalletPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function TransactionIcon({ type }) {
  if (type === 'DEBIT') return <div className="txn-icon txn-debit"><ArrowUpRightIcon width={24} /></div>;
  if (type === 'CREDIT') return <div className="txn-icon txn-credit"><ArrowDownLeftIcon width={24} /></div>;
  return <div className="txn-icon txn-reward"><StarIcon width={24} /></div>;
}

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalState, setModalState] = useState({ isOpen: false, defaultTab: 'add' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchWalletData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/auth/login'); return; }
      const res = await fetch(`${API_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setBalance(data.data.balance);
        setTransactions(data.data.transactions);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchWalletData(); }, [fetchWalletData]);

  const handleModalSuccess = (result) => {
    if (result.error) {
      setToast({ show: true, message: result.error, type: 'error' });
    } else if (result.success) {
      setToast({ show: true, message: result.success, type: 'success' });
      fetchWalletData(); 
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Limit to 10 for dashboard
  const displayTxns = transactions.slice(0, 10);

  return (
    <div className="page-container wallet-page fade-in">
      <div className="wallet-grid">
        {/* MAIN WALLET CARD */}
        <div className="wallet-card-main">
          <div className="wallet-info">
            <div className="balance-label"><BanknotesIcon width={20} /> Available Balance</div>
            
            {/* SKELETON ON NUMBER ONLY */}
            {loading ? (
              <Skeleton 
                width="160px" 
                height="48px" 
                borderRadius="8px" 
                style={{ marginTop: '8px', marginBottom: '8px' }} 
              />
            ) : (
              <h1 className="balance-amount">₹ {balance.toFixed(2)}</h1>
            )}
            
            <span className="last-updated">Real-time</span>
          </div>
          <WalletIcon width={180} height={180} className="wallet-card-bg-icon" />
        </div>

        {/* ACTIONS */}
        <div className="wallet-actions">
          <button className="btn-action-large btn-add-money" onClick={() => setModalState({ isOpen: true, defaultTab: 'add' })}>
            <BanknotesIcon width={24} /> Add / Withdraw
          </button>
          <button className="btn-action-large btn-manage-cards" onClick={() => setModalState({ isOpen: true, defaultTab: 'cards' })}>
            <CreditCardIcon width={24} /> Manage Cards
          </button>
        </div>
      </div>

      <div className="transactions-section">
        <div className="transactions-header">
          <div>
            <h2 className="section-title">Recent Transactions</h2>
            <p className="section-subtitle">Track your payments and top-ups.</p>
          </div>
          {!loading && transactions.length > 10 && (
            <Link href="/sender/wallet/transactions" className="view-all-link">
              View All <ArrowRightIcon width={16} />
            </Link>
          )}
        </div>

        <div className="transactions-list">
          {loading ? (
            /* LIST SKELETONS */
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="transaction-item" style={{ border: 'none' }}>
                <Skeleton width="48px" height="48px" circle={true} />
                <div style={{ flex: 1, marginLeft: '16px' }}>
                  <Skeleton width="40%" height="18px" style={{ marginBottom: '8px' }} />
                  <Skeleton width="25%" height="12px" />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Skeleton width="80px" height="20px" style={{ marginBottom: '6px' }} />
                </div>
              </div>
            ))
          ) : displayTxns.length === 0 ? (
            <div className="empty-state-card" style={{padding: '40px', textAlign: 'center', color: 'var(--text-muted)'}}>
              <BanknotesIcon width={48} style={{margin: '0 auto 16px', opacity: 0.5}} />
              <p>No transactions found.</p>
            </div>
          ) : (
            displayTxns.map((txn) => (
              <div key={txn.id} className="transaction-item">
                <TransactionIcon type={txn.type} />
                <div className="txn-details">
                  <span className="txn-title">{txn.description || (txn.type === 'CREDIT' ? 'Added Money' : 'Paid for Delivery')}</span>
                  <span className="txn-date">{formatDate(txn.createdAt)}</span>
                </div>
                <div className="txn-amount-box">
                  <span className={`txn-value ${txn.type === 'CREDIT' ? 'val-credit' : 'val-debit'}`}>
                    {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount.toFixed(2)}
                  </span>
                  <span className="txn-type">{txn.type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <WalletActionModal 
        isOpen={modalState.isOpen} defaultTab={modalState.defaultTab}
        onClose={() => setModalState({ isOpen: false, defaultTab: 'add' })}
        onSuccess={handleModalSuccess} balance={balance}
      />

      <ToastNotification 
        show={toast.show} message={toast.message} type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}