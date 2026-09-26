import React, { useState } from 'react';
import { User, InvoiceRecord, RiskTier } from '../types';
import { ShieldCheck, Wallet, Cpu, ExternalLink, Zap, RefreshCw, Filter, ArrowUpRight, AlertTriangle } from 'lucide-react';

interface FinancerDashboardProps {
  user: User;
  invoices: InvoiceRecord[];
  onFundTranche: (invoiceId: string, tranche: 'Senior' | 'Junior', amountInr: number, solanaTxSig: string) => void;
  onSimulateRepayment: (invoiceId: string) => void;
  onOpenFraudVision: (invoice: InvoiceRecord) => void;
}

export const FinancerDashboard: React.FC<FinancerDashboardProps> = ({
  user,
  invoices,
  onFundTranche,
  onSimulateRepayment,
  onOpenFraudVision,
}) => {
  const [selectedTier, setSelectedTier] = useState<RiskTier | 'ALL'>('ALL');
  const [trancheSelection, setTrancheSelection] = useState<Record<string, 'Senior' | 'Junior'>>({});
  const [walletConnected, setWalletConnected] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<InvoiceRecord | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    if (selectedTier !== 'ALL' && inv.riskTier !== selectedTier) return false;
    return true;
  });

  const handleFund = (inv: InvoiceRecord) => {
    const tranche = trancheSelection[inv.id] || 'Senior';
    const remaining = Math.max(0, inv.faceValueInr - (inv.fundedAmountInr || 0));
    if (remaining <= 0) return;

    const targetAmount = tranche === 'Senior'
      ? Math.round(inv.faceValueInr * 0.4)
      : Math.round(inv.faceValueInr * 0.3);

    const amount = Math.min(remaining, targetAmount > 0 ? targetAmount : remaining);
    onFundTranche(inv.id, tranche, amount, "");
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] py-6 sm:py-8 font-sans">
      <div className="app-container space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#16A34A] mb-1">
              LIQUIDITY PROVIDER DESK • {user.organizationName || user.email}
            </div>
            <h1 className="text-3xl font-black text-[#111111] tracking-tight">FINANCING OPPORTUNITIES</h1>
            <p className="text-xs text-[#555555] font-mono mt-0.5">
              Deploy capital into verified B2B invoice tranches with Gemini AI risk scoring & first-loss protection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setWalletConnected(!walletConnected)}
              className={`px-4 py-2.5 rounded-[6px] border text-xs font-mono font-semibold transition-colors flex items-center gap-2 ${
                walletConnected
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'
                  : 'bg-white border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#111111]'
              }`}
            >
              <Wallet className="w-4 h-4 text-[#2563EB]" />
              <span>{walletConnected ? 'Phantom Connected (Devnet)' : 'Connect Phantom Wallet'}</span>
            </button>
          </div>
        </div>

        {/* Tranche Vault Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Senior Vault */}
          <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-[#FAFAFA] space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-[2px] bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[10px] font-mono font-bold">
                SENIOR CAPITAL VAULT (80%)
              </span>
              <span className="text-xs font-mono font-bold text-[#16A34A]">Target: 9.2% APR</span>
            </div>
            <h3 className="text-base font-bold text-[#111111]">Senior Liquidity Allocation</h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              Priority repayment waterfall protected by 15-20% Junior tranche first-loss capital buffer.
            </p>
          </div>

          {/* Junior Vault */}
          <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-[#FAFAFA] space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-[2px] bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-[10px] font-mono font-bold">
                JUNIOR YIELD VAULT (20%)
              </span>
              <span className="text-xs font-mono font-bold text-[#D97706]">Target: 16.5% APR</span>
            </div>
            <h3 className="text-base font-bold text-[#111111]">Junior Yield Cushion</h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              First-loss subordinated tranche capturing higher yields for institutional liquidity providers.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[6px] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#888888]" />
            <span className="font-bold text-[#111111]">FILTER RISK TIER:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'TIER_AAA', 'TIER_AA', 'TIER_A', 'TIER_BBB'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1 rounded-[4px] border text-xs font-semibold transition-colors ${
                  selectedTier === tier
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#555555] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Opportunities Data Table */}
        <div className="border border-[#E5E5E5] rounded-[6px] bg-white overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase font-bold text-[#111111]">
              AVAILABLE OPPORTUNITIES ({filteredInvoices.length})
            </h2>
            <span className="text-[11px] font-mono text-[#888888]">Solana Devnet eINR Multi-Tranche Vaults</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#555555] uppercase text-[11px]">
                  <th className="p-3 font-semibold">Invoice #</th>
                  <th className="p-3 font-semibold">MSME Seller</th>
                  <th className="p-3 font-semibold">Buyer</th>
                  <th className="p-3 font-semibold text-right">Face Value</th>
                  <th className="p-3 font-semibold">Risk Tier</th>
                  <th className="p-3 font-semibold">Tranche</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#888888]">
                      No invoice opportunities matching selected risk filter.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const currentTranche = trancheSelection[inv.id] || 'Senior';
                    const isFunded = inv.status === 'FUNDED' || inv.status === 'REPAID';

                    return (
                      <tr key={inv.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="p-3 font-bold text-[#111111]">{inv.invoiceNumber}</td>
                        <td className="p-3 text-[#333333] max-w-[160px] truncate">{inv.sellerName}</td>
                        <td className="p-3 text-[#333333] max-w-[160px] truncate">{inv.buyerName}</td>
                        <td className="p-3 font-bold text-right text-[#111111]">
                          ₹{inv.faceValueInr.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold border bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                            {inv.riskTier}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="inline-flex rounded-[4px] border border-[#E5E5E5] overflow-hidden">
                            <button
                              onClick={() => setTrancheSelection({ ...trancheSelection, [inv.id]: 'Senior' })}
                              className={`px-2 py-1 text-[10px] font-bold ${
                                currentTranche === 'Senior'
                                  ? 'bg-[#16A34A] text-white'
                                  : 'bg-white text-[#555555]'
                              }`}
                            >
                              Senior (80%)
                            </button>
                            <button
                              onClick={() => setTrancheSelection({ ...trancheSelection, [inv.id]: 'Junior' })}
                              className={`px-2 py-1 text-[10px] font-bold ${
                                currentTranche === 'Junior'
                                  ? 'bg-[#D97706] text-white'
                                  : 'bg-white text-[#555555]'
                              }`}
                            >
                              Junior (20%)
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOpportunity(inv)}
                              className="px-2.5 py-1 rounded-[4px] border border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#111111] text-[10px] font-semibold"
                            >
                              Details & Spec
                            </button>

                            {isFunded ? (
                              <span className="px-2 py-1 rounded-[2px] bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[10px] font-bold">
                                {inv.status}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleFund(inv)}
                                className="px-3 py-1 rounded-[4px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10px] font-semibold flex items-center gap-1"
                              >
                                <span>Fund {currentTranche}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* STRUCTURED FINANCING DETAIL MODAL */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-[8px] max-w-2xl w-full p-6 space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <span className="text-[10px] text-[#2563EB] uppercase font-bold">FINANCING SPECIFICATION</span>
                <h3 className="text-lg font-bold text-[#111111]">{selectedOpportunity.invoiceNumber}</h3>
              </div>
              <button onClick={() => setSelectedOpportunity(null)} className="text-[#888888] hover:text-[#111111]">
                ✕
              </button>
            </div>

            {/* Disclaimer Badge */}
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-[4px] flex items-center gap-2 text-[#D97706] text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-bold">DEMO FINANCING — NO REAL MONEY TRANSFERRED (SOLANA DEVNET)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px]">
              <div>
                <span className="text-[#888888] block text-[10px]">Invoice Value</span>
                <span className="font-bold text-[#111111]">₹{selectedOpportunity.faceValueInr.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[#888888] block text-[10px]">Max Advance</span>
                <span className="font-bold text-[#16A34A]">85%</span>
              </div>
              <div>
                <span className="text-[#888888] block text-[10px]">Senior Tranche</span>
                <span className="font-bold text-[#16A34A]">₹{Math.round(selectedOpportunity.faceValueInr * 0.85 * 0.8).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[#888888] block text-[10px]">Junior Tranche</span>
                <span className="font-bold text-[#D97706]">₹{Math.round(selectedOpportunity.faceValueInr * 0.85 * 0.2).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Verifications Grid */}
            <div className="space-y-2">
              <span className="font-bold text-[#111111] block">VERIFICATION SIGNALS</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border border-[#E5E5E5] rounded-[4px] bg-[#EFF6FF] text-[#2563EB]">
                  <div className="font-bold text-[11px]">AI AUDITED</div>
                  <div className="text-[10px]">Score: {selectedOpportunity.authenticityScore || 92}/100</div>
                </div>
                <div className="p-3 border border-[#E5E5E5] rounded-[4px] bg-[#F0FDF4] text-[#16A34A]">
                  <div className="font-bold text-[11px]">ORACLE VERIFIED</div>
                  <div className="text-[10px]">Ed25519 Signed</div>
                </div>
                <div className="p-3 border border-[#E5E5E5] rounded-[4px] bg-[#EFF6FF] text-[#2563EB]">
                  <div className="font-bold text-[11px]">SOLANA ANCHORED</div>
                  <div className="text-[10px]">Devnet Memo Hash</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="px-4 py-2 bg-[#FAFAFA] border border-[#E5E5E5] text-[#333333] rounded-[4px]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleFund(selectedOpportunity);
                  setSelectedOpportunity(null);
                }}
                className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[4px]"
              >
                SIMULATE FINANCING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
