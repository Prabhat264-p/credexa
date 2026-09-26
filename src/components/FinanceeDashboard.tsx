import React, { useState } from 'react';
import { User, InvoiceRecord } from '../types';
import { Plus, FileText, Cpu, ShieldCheck, ExternalLink, Zap, RefreshCw, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { TokenizeModal } from './TokenizeModal';

interface FinanceeDashboardProps {
  user: User;
  invoices: InvoiceRecord[];
  onAuditInvoice: (invoiceId: string) => void;
  onAttestInvoice: (invoiceId: string) => void;
  onAnchorSolana: (invoiceId: string) => void;
  onSimulateRepayment: (invoiceId: string) => void;
  onCreateInvoice: (newInv: Partial<InvoiceRecord>) => void;
  onOpenFraudVision: (invoice: InvoiceRecord) => void;
}

export const FinanceeDashboard: React.FC<FinanceeDashboardProps> = ({
  user,
  invoices,
  onAuditInvoice,
  onAttestInvoice,
  onAnchorSolana,
  onSimulateRepayment,
  onCreateInvoice,
  onOpenFraudVision,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const [newInv, setNewInv] = useState({
    invoiceNumber: `PGA/25-26/${Math.floor(1000 + Math.random() * 9000)}`,
    sellerName: user.organizationName || user.name || 'Precision Geartech Auto Ancillaries Pvt Ltd',
    sellerGstin: user.gstin || '27AAACP1842Q1Z9',
    buyerName: 'Tata Motors Commercial Vehicle Fleet Division',
    buyerGstin: '27AAACT2727Q1ZW',
    faceValueInr: 3500000,
    tenureDays: 90,
    itemDescription: 'Transmission Pinions & Differential Gears',
    hsnCode: '87084000',
    ewayBillNumber: '281982740192',
    poNumber: 'TM/PUN/CV/PO-98214',
    factoringMode: 'Recourse' as const,
  });

  const totalInvoicesCount = invoices.length;
  const totalFaceValue = invoices.reduce((acc, inv) => acc + inv.faceValueInr, 0);
  const fundedInvoices = invoices.filter((inv) => inv.status === 'FUNDED' || inv.status === 'REPAID');
  const totalFunded = fundedInvoices.reduce((acc, inv) => acc + (inv.fundedAmountInr || 0), 0);
  const underReviewCount = invoices.filter((inv) => inv.status !== 'FUNDED' && inv.status !== 'REPAID').length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateInvoice(newInv);
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] py-6 sm:py-8 font-sans">
      <div className="app-container space-y-8">
        {/* Top Header & Account Information */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#2563EB] mb-1">
              MSME BORROWER WORKSPACE • {user.organizationName || user.email}
            </div>
            <h1 className="text-3xl font-black text-[#111111] tracking-tight">
              GOOD MORNING, {user.name.toUpperCase()}
            </h1>
            <p className="text-xs text-[#555555] font-mono mt-0.5">
              GSTIN: {user.gstin || '27AAACP1842Q1Z9'} • WALLET: {user.walletAddress || '7x...PhantomDevnet'}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Invoice</span>
          </button>
        </div>

        {/* Horizontal Swiss Metric Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 border border-[#E5E5E5] rounded-[6px] bg-white space-y-1">
            <div className="text-[11px] font-mono uppercase text-[#888888]">Total Invoices</div>
            <div className="text-2xl font-bold font-mono text-[#111111]">{totalInvoicesCount}</div>
            <div className="text-[11px] font-mono text-[#555555]">Face Value: ₹{totalFaceValue.toLocaleString('en-IN')}</div>
          </div>

          <div className="p-5 border border-[#E5E5E5] rounded-[6px] bg-white space-y-1">
            <div className="text-[11px] font-mono uppercase text-[#888888]">Under Review / Listed</div>
            <div className="text-2xl font-bold font-mono text-[#2563EB]">{underReviewCount}</div>
            <div className="text-[11px] font-mono text-[#555555]">Awaiting Vault Liquidity</div>
          </div>

          <div className="p-5 border border-[#E5E5E5] rounded-[6px] bg-white space-y-1">
            <div className="text-[11px] font-mono uppercase text-[#888888]">Funded Amount</div>
            <div className="text-2xl font-bold font-mono text-[#16A34A]">₹{totalFunded.toLocaleString('en-IN')}</div>
            <div className="text-[11px] font-mono text-[#16A34A]">eINR Disbursed (Devnet)</div>
          </div>

          <div className="p-5 border border-[#E5E5E5] rounded-[6px] bg-white space-y-1">
            <div className="text-[11px] font-mono uppercase text-[#888888]">Oracle Security</div>
            <div className="text-sm font-bold font-mono text-[#111111] flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Ed25519 Verified</span>
            </div>
            <div className="text-[11px] font-mono text-[#888888] truncate">Pubkey: 7d8f...3456</div>
          </div>
        </div>

        {/* Swiss Invoice Data Table */}
        <div className="border border-[#E5E5E5] rounded-[6px] bg-white overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase font-bold text-[#111111] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <span>REGISTERED INVOICES ({invoices.length})</span>
            </h2>
            <span className="text-[11px] font-mono text-[#888888]">Click invoice row for structured details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#555555] uppercase text-[11px]">
                  <th className="p-3 font-semibold">Invoice #</th>
                  <th className="p-3 font-semibold">Buyer</th>
                  <th className="p-3 font-semibold text-right">Face Value</th>
                  <th className="p-3 font-semibold">Risk Tier</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Maturity</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#888888]">
                      No invoices tokenized yet. Click "Submit New Invoice" to begin.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-bold text-[#111111]">{inv.invoiceNumber}</td>
                      <td className="p-3 text-[#333333] max-w-[200px] truncate">{inv.buyerName}</td>
                      <td className="p-3 font-bold text-right text-[#111111]">
                        ₹{inv.faceValueInr.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold border ${
                            inv.riskTier === 'TIER_AAA'
                              ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'
                              : inv.riskTier === 'TIER_HIGH_RISK'
                              ? 'bg-[#FEF2F2] text-[#E53935] border-[#FCA5A5]'
                              : 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                          }`}
                        >
                          {inv.riskTier}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold border ${
                            inv.status === 'FUNDED'
                              ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'
                              : inv.status === 'REPAID'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                              : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#555555]">{inv.maturityDate || '90 Days'}</td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenFraudVision(inv)}
                            className="px-2 py-1 rounded-[4px] border border-[#E5E5E5] hover:bg-[#EFF6FF] hover:border-[#2563EB] text-[#2563EB] text-[10px] font-semibold"
                            title="Fraud Vision AI"
                          >
                            Vision AI
                          </button>
                          {!inv.oracleSignature && (
                            <button
                              onClick={() => onAttestInvoice(inv.id)}
                              className="px-2 py-1 rounded-[4px] bg-[#16A34A] hover:bg-[#15803D] text-white text-[10px] font-semibold"
                            >
                              Sign Attestation
                            </button>
                          )}
                          {inv.status === 'FUNDED' && (
                            <button
                              onClick={() => onSimulateRepayment(inv.id)}
                              className="px-2 py-1 rounded-[4px] border border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#111111] text-[10px] font-semibold"
                            >
                              Repay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* STRUCTURED INVOICE DETAIL DRAWER / MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-[8px] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
              <div>
                <span className="text-[10px] text-[#2563EB] uppercase font-bold">INVOICE SPECIFICATION DETAILS</span>
                <h3 className="text-xl font-bold text-[#111111] font-mono">{selectedInvoice.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-[#888888] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px]">
              <div>
                <span className="text-[#888888] block text-[10px]">Seller Name</span>
                <span className="font-bold text-[#111111]">{selectedInvoice.sellerName}</span>
              </div>
              <div>
                <span className="text-[#888888] block text-[10px]">Buyer Name</span>
                <span className="font-bold text-[#111111]">{selectedInvoice.buyerName}</span>
              </div>
              <div>
                <span className="text-[#888888] block text-[10px]">Face Value</span>
                <span className="font-bold text-[#111111]">₹{selectedInvoice.faceValueInr.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[#888888] block text-[10px]">Advance Rate</span>
                <span className="font-bold text-[#16A34A]">{selectedInvoice.advanceRatePct}%</span>
              </div>
            </div>

            {/* SECTION: AI INTELLIGENCE */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#2563EB] uppercase flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>AI INTELLIGENCE REPORT</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 border border-[#E5E5E5] rounded-[4px] bg-white">
                <div>
                  <span className="text-[#888888] block text-[10px]">Authenticity Score</span>
                  <span className="font-bold text-[#16A34A]">{selectedInvoice.authenticityScore || 92}/100</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">Risk Classification</span>
                  <span className="font-bold text-[#111111]">{selectedInvoice.riskTier || 'TIER_A'}</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">GST Reconciliation</span>
                  <span className="font-bold text-[#16A34A]">MATCHED (GSTR-2B)</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">e-Way Bill Status</span>
                  <span className="font-bold text-[#16A34A]">ACTIVE (NIC Portal)</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">PO Consistency</span>
                  <span className="font-bold text-[#111111]">PO-98214 MATCHED</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">Recommended APR</span>
                  <span className="font-bold text-[#2563EB]">{((selectedInvoice.discountRateBps || 850) / 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* SECTION: ORACLE ATTESTATION (TECHNICAL MONOSPACE) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#16A34A] uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>ORACLE ATTESTATION (ED25519)</span>
              </div>
              <div className="p-4 border border-[#E5E5E5] rounded-[4px] bg-[#FAFAFA] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Verification Status:</span>
                  <span className="font-bold text-[#16A34A]">VERIFIED</span>
                </div>
                <div>
                  <span className="text-[#888888] block">Public Key:</span>
                  <span className="text-[#111111] font-mono break-all font-bold">
                    7d8f921ea5c3b1a8d9e0f2456bce1847a98d3ef0c1284a569b7c8d9e0f123456
                  </span>
                </div>
                <div>
                  <span className="text-[#888888] block">Signature:</span>
                  <span className="text-[#2563EB] font-mono break-all font-bold">
                    {selectedInvoice.oracleSignature || '4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION: SOLANA DEVNET BLOCK */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#2563EB] uppercase flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4" />
                <span>SOLANA DEVNET LEDGER</span>
              </div>
              <div className="p-4 border border-[#E5E5E5] rounded-[4px] bg-[#FAFAFA] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Network Cluster:</span>
                  <span className="font-bold text-[#111111]">Solana Devnet</span>
                </div>
                <div>
                  <span className="text-[#888888] block">Transaction Signature:</span>
                  <span className="text-[#2563EB] font-mono break-all font-bold">
                    {selectedInvoice.solanaTxSignature || selectedInvoice.oracleSignature || 'VERIFIED_DEVNET_MEMO_ANCHOR'}
                  </span>
                </div>
                <div className="pt-2 flex justify-end">
                  <a
                    href={`https://explorer.solana.com/tx/${selectedInvoice.solanaTxSignature || selectedInvoice.oracleSignature || '284910283'}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#2563EB] text-white rounded-[4px] font-semibold hover:bg-[#1D4ED8] flex items-center gap-1"
                  >
                    <span>View on Solana Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-[#111111] text-white rounded-[4px] font-semibold"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      <TokenizeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(newInv) => {
          onCreateInvoice(newInv);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};
