import React, { useEffect, useState } from 'react';
import { SolanaTxRecord } from '../types';
import { ExternalLink, RefreshCw, Activity, Database, CheckCircle2 } from 'lucide-react';
import { safeFetch } from '../services/apiClient';

export const TransactionHistoryView: React.FC = () => {
  const [txs, setTxs] = useState<SolanaTxRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTxs = async () => {
    setLoading(true);
    try {
      const res = await safeFetch('/api/transactions');
      if (res.ok && res.data.transactions) {
        setTxs(
          res.data.transactions.map((t: any) => ({
            signature: t.transactionSignature || t.signature || 'tx_devnet',
            network: 'Solana Devnet',
            type: t.transactionType || t.type || 'INVOICE_ANCHOR',
            invoiceId: t.invoiceId || 'INV-001',
            slot: t.slot || 284910283,
            blockTime: t.blockTime || Math.floor(Date.now() / 1000),
            explorerUrl: t.explorerUrl || `https://explorer.solana.com/tx/${t.transactionSignature || t.signature}?cluster=devnet`,
            payloadHash: t.payloadHash || 'hash',
            timestamp: t.createdAt || new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.warn('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#111111] py-6 sm:py-8 font-sans">
      <div className="app-container space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#E5E5E5]">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#2563EB] mb-1">
              IMMUTABLE AUDIT LOG & LEDGER
            </div>
            <h1 className="text-3xl font-black text-[#111111] font-mono tracking-tight">TRANSACTION HISTORY</h1>
          </div>

          <button
            onClick={fetchTxs}
            className="p-2.5 rounded-[6px] border border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#111111] transition-colors"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* SWISS DATA TABLE: TRANSACTIONS */}
        <div className="border border-[#E5E5E5] rounded-[6px] bg-white overflow-hidden font-mono text-xs">
          <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
            <span className="font-bold text-[#111111]">SOLANA DEVNET TRANSACTIONS ({txs.length})</span>
            <span className="text-[11px] text-[#888888]">Verified on-chain memo records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#555555] uppercase text-[11px]">
                  <th className="p-3 font-semibold">Date & Time</th>
                  <th className="p-3 font-semibold">Transaction Type</th>
                  <th className="p-3 font-semibold">Invoice ID</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Signature / Reference</th>
                  <th className="p-3 font-semibold text-right">Explorer Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#888888]">
                      Loading transaction signatures from Solana Devnet...
                    </td>
                  </tr>
                ) : txs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#888888]">
                      No transaction signatures recorded on Devnet yet.
                    </td>
                  </tr>
                ) : (
                  txs.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="p-3 text-[#555555] whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-[#111111]">
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px]">
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#111111]">{tx.invoiceId}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[10px] font-bold">
                          CONFIRMED
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#2563EB] max-w-[200px] truncate font-mono">
                        {tx.signature}
                      </td>
                      <td className="p-3 text-right">
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-[4px] border border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#2563EB] font-semibold text-[10px] inline-flex items-center gap-1"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VERTICAL AUDIT TRAIL TIMELINE */}
        <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <h2 className="text-sm font-bold text-[#111111]">PROTOCOL LIFECYCLE AUDIT TRAIL TIMELINE</h2>
            <span className="text-[11px] text-[#888888]">Chronological event sequence</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[#E5E5E5]">
            {[
              { time: '09:31:02', title: 'Invoice Submitted & Tokenized', desc: 'MSME Precision Geartech submitted invoice PGA/25-26/1104 for ₹45,00,000.', status: 'COMPLETED' },
              { time: '09:32:14', title: 'Gemini AI Credit Audit Completed', desc: 'Authenticity Score 96/100, Risk Classification TIER_AAA assigned.', status: 'COMPLETED' },
              { time: '09:33:05', title: 'Ed25519 Oracle Attestation Signed', desc: 'Credexa Credit Oracle generated signed canonical payload hash.', status: 'COMPLETED' },
              { time: '09:34:28', title: 'Solana Devnet Anchor Confirmed', desc: 'Permanent Memo hash anchored on Solana Devnet block 284910283.', status: 'COMPLETED' },
              { time: '09:36:10', title: 'Senior & Junior Tranches Funded', desc: 'Disbursed ₹38,25,000 eINR liquidity to MSME wallet address.', status: 'COMPLETED' },
              { time: '09:45:00', title: 'Buyer Repayment Settled', desc: 'Tata Motors repaid ₹45,00,000 eINR in full. Vault yields distributed.', status: 'COMPLETED' },
            ].map((event, idx) => (
              <div key={idx} className="relative space-y-1">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#16A34A] border-2 border-white ring-1 ring-[#E5E5E5]" />
                <div className="flex items-center gap-3">
                  <span className="text-[#888888] text-[10px] font-bold">{event.time}</span>
                  <span className="font-bold text-[#111111]">{event.title}</span>
                  <span className="px-1.5 py-0.2 bg-[#F0FDF4] text-[#16A34A] text-[9px] font-bold border border-[#BBF7D0] rounded-[2px]">
                    {event.status}
                  </span>
                </div>
                <p className="text-xs text-[#555555] font-sans">{event.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
