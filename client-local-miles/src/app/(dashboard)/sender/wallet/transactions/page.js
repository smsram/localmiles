'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowDownLeftIcon, ArrowUpRightIcon, StarIcon } from '@heroicons/react/24/solid';
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

  if (loading) return <div className="page-container wallet-page" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}><div className="spinner" style={{width: 40, height: 40, border: '3px solid var(--border-light)', borderTopColor: 'var(--brand-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div></div>;

  return (
    <div className="page-container wallet-page">
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
        {transactions.map((txn) => (
          <div key={txn.id} className="transaction-item">
            <TransactionIcon type={txn.type} />
            <div className="txn-details">
              <span className="txn-title">{txn.description}</span>
              <span className="txn-date">{formatDate(txn.createdAt)}</span>
            </div>
            <div className="txn-amount-box">
              <span className={`txn-value ${txn.type === 'CREDIT' ? 'val-credit' : 'val-debit'}`}>
                {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount.toFixed(2)}
              </span>
              <span className="txn-type">{txn.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}