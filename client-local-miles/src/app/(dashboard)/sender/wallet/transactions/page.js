'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowDownLeftIcon, ArrowUpRightIcon, StarIcon } from '@heroicons/react/24/solid';
import Skeleton from '@/components/ui/Skeleton';
import '@/styles/WalletPage.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function TransactionIcon({ type }) {
  if (type === 'DEBIT') return <div className="txn-icon txn-debit"><ArrowUpRightIcon width={24} /></div>;
  if (type === 'CREDIT') return <div className="txn-icon txn-credit"><ArrowDownLeftIcon width={24} /></div>;
  return <div className="txn-icon txn-reward"><StarIcon width={24} /></div>;
}

export default function AllTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/auth/login');
        const res = await fetch(`${API_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setTransactions(data.data.transactions);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchWalletData();
  }, [router]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderSkeletons = () => (
    <div className="page-container wallet-page fade-in">
      <div className="page-header" style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px'}}>
        <Skeleton width="40px" height="40px" circle={true} />
        <div style={{ flex: 1 }}>
          <Skeleton width="220px" height="32px" style={{ marginBottom: '8px' }} />
          <Skeleton width="350px" height="16px" />
        </div>
      </div>
      <div className="transactions-list">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="transaction-item">
            <Skeleton width="48px" height="48px" circle={true} />
            <div style={{ flex: 1, marginLeft: '16px' }}>
              <Skeleton width="50%" height="18px" style={{ marginBottom: '8px' }} />
              <Skeleton width="30%" height="12px" />
            </div>
            <div style={{ textAlign: 'right' }}>
              <Skeleton width="90px" height="20px" style={{ marginBottom: '6px' }} />
              <Skeleton width="40px" height="12px" style={{ marginLeft: 'auto' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return renderSkeletons();

  return (
    <div className="page-container wallet-page fade-in">
      <div className="page-header" style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px'}}>
        <button onClick={() => router.back()} style={{background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)'}}>
          <ArrowLeftIcon width={24} />
        </button>
        <div>
          <h1 className="section-title">All Transactions</h1>
          <p className="section-subtitle">A complete history of your wallet activity.</p>
        </div>
      </div>

      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div style={{padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)'}}>
            <p>No transaction history found.</p>
          </div>
        ) : (
          transactions.map((txn) => (
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
  );
}