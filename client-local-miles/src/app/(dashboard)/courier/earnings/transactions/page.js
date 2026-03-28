'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowDownLeftIcon, ArrowUpRightIcon } from '@heroicons/react/24/solid';
import Skeleton from '@/components/ui/Skeleton';
import '@/styles/CourierEarningsPage.css'; // Reusing the same base styles

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function TransactionIcon({ type }) {
  if (type === 'DEBIT') return <div style={{width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><ArrowUpRightIcon width={20} /></div>;
  if (type === 'CREDIT') return <div style={{width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><ArrowDownLeftIcon width={20} /></div>;
  return null;
}

export default function CourierTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');
        
        // Pass the mode query parameter here to filter out Sender transactions
        const res = await fetch(`${API_URL}/wallet?mode=COURIER`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        const data = await res.json();
        if (data.success) setTransactions(data.data.transactions);
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchTransactions();
  }, [router]);

  const renderSkeletons = () => (
    <div className="page-container earnings-page fade-in">
      <div className="page-header" style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px'}}>
        <Skeleton width="40px" height="40px" circle={true} />
        <div style={{ flex: 1 }}>
          <Skeleton width="220px" height="32px" style={{ marginBottom: '8px' }} />
          <Skeleton width="350px" height="16px" />
        </div>
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
              <Skeleton width="48px" height="48px" circle={true} />
              <div>
                <Skeleton width="200px" height="18px" style={{ marginBottom: '8px' }} />
                <Skeleton width="120px" height="12px" />
              </div>
            </div>
            <Skeleton width="80px" height="24px" />
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return renderSkeletons();

  return (
    <div className="page-container earnings-page fade-in">
      <div className="page-header" style={{display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px'}}>
        <button onClick={() => router.back()} style={{background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius: '50%', cursor:'pointer', color:'var(--text-main)', padding: '8px'}}>
          <ArrowLeftIcon width={20} />
        </button>
        <div>
          <h1 className="page-title">Transaction History</h1>
          <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px'}}>All your earnings and withdrawals.</p>
        </div>
      </div>

      <div className="history-section" style={{ padding: 0, overflow: 'hidden' }}>
        {transactions.length === 0 ? (
          <div style={{padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)'}}>
            <p>No transaction history found.</p>
          </div>
        ) : (
          <table className="txn-table" style={{ margin: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ paddingLeft: '24px' }}>Type</th>
                <th>Date & Time</th>
                <th className="col-details">Details</th>
                <th style={{textAlign: 'right', paddingRight: '24px'}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td style={{ paddingLeft: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <TransactionIcon type={txn.type} />
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{txn.type === 'CREDIT' ? 'Earned' : 'Withdrawn'}</span>
                    </div>
                  </td>
                  <td className="txn-time">{new Date(txn.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="col-details">{txn.description}</td>
                  <td style={{textAlign: 'right', paddingRight: '24px', fontWeight: 'bold', color: txn.type === 'DEBIT' ? '#EF4444' : '#10B981'}}>
                    {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}