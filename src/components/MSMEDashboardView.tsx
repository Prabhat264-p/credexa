import React, { useState } from "react";
import {
  Plus,
  FileText,
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Eye,
  Wallet,
} from "lucide-react";
import { InvoiceRecord, OracleAuditResult } from "../types";
import { SolanaWalletButton } from "./SolanaWalletButton";
import { InvoiceDetailModal } from "./InvoiceDetailModal";
import { executeSolanaDevnetAnchorTx, WalletConnectionState } from "../utils/solana";

interface MSMEDashboardViewProps {
  invoices: InvoiceRecord[];
  onRefreshData: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const MSMEDashboardView: React.FC<MSMEDashboardViewProps> = ({
  invoices,
  onRefreshData,
  onNavigateTab,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [walletState, setWalletState] = useState<WalletConnectionState>({
    connected: false,
    publicKey: null,
    balanceSol: 0,
    network: "Solana Devnet",
    error: null,
  });

  const [isActionLoading, setIsActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  // New Invoice Form State
  const [formData, setFormData] = useState({
    invoiceNumber: "PGA/25-26/1199",
    sellerName: "Precision Geartech Auto Ancillaries Pvt Ltd",
    sellerGstin: "27AAACP1842Q1Z9",
    buyerName: "Tata Motors Commercial Vehicle Fleet Division",
    buyerGstin: "27AAACT2727Q1ZW",
    faceValueInr: 4500000,
    tenureDays: 90,
    hsnCode: "87084000",
    ewayBillNumber: "281982740192",
    poNumber: "TM/PUN/CV/PO-98214",
    factoringMode: "Recourse" as "Recourse" | "NonRecourse",
  });

  // Create & Submit New Invoice
  const handleSubmitNewInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create invoice");

      setShowSubmitModal(false);
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to submit invoice");
    }
  };

  // Trigger Gemini AI Audit
  const handleRunAudit = async (inv: InvoiceRecord) => {
    setIsActionLoading((prev) => ({ ...prev, [inv.id]: true }));
    setActionError(null);

    try {
      const res = await fetch(`/api/invoices/${inv.id}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: inv.id,
          sellerName: inv.sellerName,
          sellerGstin: inv.sellerGstin,
          buyerName: inv.buyerName,
          buyerGstin: inv.buyerGstin,
          invoiceNumber: inv.invoiceNumber,
          faceValueInr: inv.faceValueInr,
          tenureDays: inv.tenureDays,
          hsnCode: inv.hsnCode,
          ewayBillNumber: inv.ewayBillNumber,
          poNumber: inv.poNumber,
        }),
      });

      if (!res.ok) throw new Error("Audit service error");
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to execute AI audit");
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [inv.id]: false }));
    }
  };

  // Generate Oracle Attestation & Ed25519 Signature
  const handleGenerateAttestation = async (inv: InvoiceRecord) => {
    setIsActionLoading((prev) => ({ ...prev, [inv.id]: true }));
    setActionError(null);

    try {
      const res = await fetch(`/api/invoices/${inv.id}/oracle-attestation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Oracle attestation failed");
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to generate oracle attestation");
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [inv.id]: false }));
    }
  };

  // Anchor on Solana Devnet via Real Devnet Memo Transaction
  const handleAnchorSolanaDevnet = async (inv: InvoiceRecord) => {
    if (!walletState.connected) {
      setActionError("Please connect Phantom wallet first to execute a REAL Solana Devnet transaction.");
      return;
    }

    setIsActionLoading((prev) => ({ ...prev, [inv.id]: true }));
    setActionError(null);

    try {
      const payloadHash = inv.oracleSignature?.slice(0, 32) || "4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e";

      // Execute REAL Devnet transaction
      const txResult = await executeSolanaDevnetAnchorTx(
        inv.id,
        payloadHash,
        inv.faceValueInr,
        "ANCHOR"
      );

      // Record transaction in store
      await fetch(`/api/invoices/${inv.id}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ANCHOR",
          solanaTxSignature: txResult.signature,
          explorerUrl: txResult.explorerUrl,
          status: "LISTED",
        }),
      });

      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || "Solana Devnet transaction failed");
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [inv.id]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FUNDED":
        return "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]";
      case "REPAID":
      case "Settled":
        return "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]";
      case "APPROVED":
      case "LISTED":
      case "Verified":
        return "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]";
      case "DRAFT":
      case "SUBMITTED":
      default:
        return "bg-[#FAFAFA] text-[#71717A] border-[#E4E4E7]";
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner & Wallet Row */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-[11px] uppercase text-[#71717A] font-bold tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
              MSME BORROWER PORTAL // INVOICE DISCOUNTING PIPELINE
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] mt-1">
              MSME Invoice Discounting Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#27272A] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#059669]" /> SUBMIT NEW INVOICE
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 text-xs text-[#52525B] font-sans leading-relaxed">
            Submit Indian B2B supply invoices for automated Gemini Vision AI auditing, Ed25519 Oracle attestation, and on-chain Solana Devnet anchoring.
          </div>
          <div className="md:col-span-4">
            <SolanaWalletButton onWalletStateChange={setWalletState} />
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Invoice Pipeline Table */}
      <div className="border border-[#0A0A0A] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
          <span className="font-bold text-[#0A0A0A] text-sm">
            SUBMITTED MSME INVOICE BUNDLES ({invoices.length})
          </span>
          <span className="text-[10px] text-[#71717A]">DEVNET SETTLEMENT ASSET: SPL eINR</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#0A0A0A] bg-[#F4F4F5] text-[10px] uppercase text-[#71717A]">
                <th className="p-3">Invoice Details</th>
                <th className="p-3">Buyer &amp; PO</th>
                <th className="p-3">Face Value</th>
                <th className="p-3">AI &amp; Oracle</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {invoices.map((inv) => {
                const isLoading = isActionLoading[inv.id];
                return (
                  <tr key={inv.id} className="hover:bg-[#FAFAFA] transition-all">
                    <td className="p-3">
                      <div className="font-bold text-[#0A0A0A]">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-[#71717A] truncate max-w-[180px]">{inv.sellerName}</div>
                      <div className="text-[9px] text-[#2563EB]">{inv.id}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-[#0A0A0A] truncate max-w-[180px]">{inv.buyerName}</div>
                      <div className="text-[10px] text-[#71717A]">PO: {inv.poNumber}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-[#059669]">₹{inv.faceValueInr.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-[#71717A]">Advance (85%): ₹{inv.fundedAmountInr.toLocaleString("en-IN")}</div>
                    </td>

                    <td className="p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Score: <strong>{inv.authenticityScore}/100</strong> ({inv.riskTier})</span>
                      </div>
                      <div className="text-[9px] text-[#059669]">
                        {inv.oracleSignature ? "✓ Ed25519 Signed" : "○ Pending Attestation"}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase border ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>

                    <td className="p-3 text-right space-y-1">
                      {["DRAFT", "SUBMITTED", "Draft"].includes(inv.status) && (
                        <button
                          onClick={() => handleRunAudit(inv)}
                          disabled={isLoading}
                          className="px-2.5 py-1 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold text-[10px] uppercase tracking-wider block w-full"
                        >
                          {isLoading ? "Auditing..." : "1. Run AI Audit"}
                        </button>
                      )}

                      {["AI_AUDITING", "AUDITED", "Verified"].includes(inv.status) && !inv.oracleSignature && (
                        <button
                          onClick={() => handleGenerateAttestation(inv)}
                          disabled={isLoading}
                          className="px-2.5 py-1 bg-[#059669] text-white hover:bg-[#047857] font-bold text-[10px] uppercase tracking-wider block w-full"
                        >
                          {isLoading ? "Signing..." : "2. Oracle Attestation"}
                        </button>
                      )}

                      {["APPROVED", "Verified", "AUDITED"].includes(inv.status) && inv.oracleSignature && (
                        <button
                          onClick={() => handleAnchorSolanaDevnet(inv)}
                          disabled={isLoading}
                          className="px-2.5 py-1 bg-[#0A0A0A] text-white hover:bg-[#27272A] font-bold text-[10px] uppercase tracking-wider block w-full"
                        >
                          {isLoading ? "Anchoring..." : "3. Anchor Solana Devnet"}
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 border border-[#E4E4E7] text-[#0A0A0A] hover:bg-[#F4F4F5] font-bold text-[10px] uppercase tracking-wider block w-full mt-1"
                      >
                        <Eye className="w-3 h-3 inline mr-1" /> View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit New Invoice Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0A0A0A] max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
              <span className="font-extrabold text-sm text-[#0A0A0A]">
                SUBMIT B2B INVOICE FOR DISCOUNTING
              </span>
              <button onClick={() => setShowSubmitModal(false)} className="text-[#71717A]">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewInvoice} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#71717A] uppercase mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#71717A] uppercase mb-1">Face Value (eINR)</label>
                  <input
                    type="number"
                    value={formData.faceValueInr}
                    onChange={(e) => setFormData({ ...formData, faceValueInr: Number(e.target.value) })}
                    className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#71717A] uppercase mb-1">Enterprise Buyer Name</label>
                <input
                  type="text"
                  value={formData.buyerName}
                  onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                  className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#71717A] uppercase mb-1">Buyer GSTIN</label>
                  <input
                    type="text"
                    value={formData.buyerGstin}
                    onChange={(e) => setFormData({ ...formData, buyerGstin: e.target.value })}
                    className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#71717A] uppercase mb-1">Purchase Order (PO)</label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#71717A] uppercase mb-1">e-Way Bill Number</label>
                  <input
                    type="text"
                    value={formData.ewayBillNumber}
                    onChange={(e) => setFormData({ ...formData, ewayBillNumber: e.target.value })}
                    className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#71717A] uppercase mb-1">Factoring Mode</label>
                  <select
                    value={formData.factoringMode}
                    onChange={(e) => setFormData({ ...formData, factoringMode: e.target.value as any })}
                    className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
                  >
                    <option value="Recourse">Recourse (10% Collateral Lock)</option>
                    <option value="NonRecourse">NonRecourse (First-Loss Protection)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E4E4E7] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-[#E4E4E7] text-[#71717A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A0A0A] text-white font-bold text-xs uppercase tracking-wider"
                >
                  Submit Invoice Bundle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRunAudit={handleRunAudit}
        />
      )}
    </div>
  );
};
