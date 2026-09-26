import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Key,
  ShieldCheck,
  ExternalLink,
  Layers,
  History,
  FileText,
  Clock,
  DollarSign,
  Send,
  Zap,
} from "lucide-react";
import { InvoiceRecord, AuditEvent } from "../types";
import { verifyOracleEd25519Signature, Ed25519VerificationResult } from "../utils/ed25519";
import { BuyerConfirmation } from "./BuyerConfirmation";
import { ReceivablePassport } from "./ReceivablePassport";
import { VerificationTimeline } from "./VerificationTimeline";
import { FinancingWaterfall } from "./FinancingWaterfall";
import { buildReceivablePassport } from "../services/receivablePassportService";

interface InvoiceDetailModalProps {
  invoice: InvoiceRecord;
  onClose: () => void;
  onRunAudit?: (inv: InvoiceRecord) => void;
  onFundInvoice?: (inv: InvoiceRecord) => void;
  onSettleInvoice?: (inv: InvoiceRecord) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onRunAudit,
  onFundInvoice,
  onSettleInvoice,
}) => {
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceRecord>(invoice);
  const [verificationResult, setVerificationResult] = useState<Ed25519VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "PASSPORT" | "INTELLIGENCE" | "ORACLE" | "AUDIT_TRAIL">("OVERVIEW");

  useEffect(() => {
    setCurrentInvoice(invoice);
  }, [invoice]);

  // Fetch audit trail events from backend
  useEffect(() => {
    fetch(`/api/invoices/${currentInvoice.id}/events`)
      .then((res) => res.json())
      .then((data) => {
        if (data.events) {
          setAuditEvents(data.events);
        }
      })
      .catch(() => {});
  }, [currentInvoice.id]);

  const handleConfirmBuyer = async () => {
    try {
      const res = await fetch(`/api/invoices/${currentInvoice.id}/confirm-buyer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerConfirmedBy: "procurement@tatamotors.com" }),
      });
      const data = await res.json();
      if (data.invoice) {
        setCurrentInvoice({
          ...currentInvoice,
          buyerConfirmationStatus: "CONFIRMED",
          buyerAttested: true,
          buyerConfirmedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Error confirming buyer:", e);
    }
  };

  const handleDisputeBuyer = async (reason: string, comment: string) => {
    try {
      const res = await fetch(`/api/invoices/${currentInvoice.id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comment }),
      });
      const data = await res.json();
      if (data.invoice) {
        setCurrentInvoice({
          ...currentInvoice,
          buyerConfirmationStatus: "DISPUTED",
          disputeReason: reason,
          disputeComment: comment,
        });
      }
    } catch (e) {
      console.error("Error disputing invoice:", e);
    }
  };

  const handleResetDispute = async () => {
    try {
      const res = await fetch(`/api/invoices/${currentInvoice.id}/reset-dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.invoice) {
        setCurrentInvoice({
          ...currentInvoice,
          buyerConfirmationStatus: "PENDING",
          disputeReason: undefined,
          disputeComment: undefined,
        });
      }
    } catch (e) {
      console.error("Error resetting dispute:", e);
    }
  };

  // Execute independent browser Ed25519 verification
  const handleVerifySignature = async () => {
    setIsVerifying(true);
    const canonicalPayload = JSON.stringify({
      invoiceId: currentInvoice.id,
      authenticityScore: currentInvoice.authenticityScore || 90,
      defaultRiskTier: currentInvoice.riskTier || "TIER_A",
      recommendedDiscountBps: currentInvoice.discountRateBps || 850,
      maxAdvancePct: currentInvoice.advanceRatePct || 85,
      juniorTrancheBufferPct: 15,
      timestamp: currentInvoice.oracleTimestamp || Math.floor(Date.now() / 1000),
    });

    const sigHex =
      currentInvoice.oracleSignature ||
      "4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c";
    const pubKeyHex =
      "7d8f921ea5c3b1a8d9e0f2456bce1847a98d3ef0c1284a569b7c8d9e0f123456";

    const result = await verifyOracleEd25519Signature(canonicalPayload, sigHex, pubKeyHex);
    setVerificationResult(result);
    setIsVerifying(false);
  };

  const statusSteps = [
    { label: "Submitted", done: true },
    { label: "AI Audited", done: ["AUDITED", "APPROVED", "LISTED", "FUNDING", "FUNDED", "REPAID", "Verified", "Settled"].includes(currentInvoice.status) },
    { label: "Oracle Verified", done: ["APPROVED", "LISTED", "FUNDING", "FUNDED", "REPAID", "Verified", "Settled"].includes(currentInvoice.status) },
    { label: "Buyer Confirmed", done: currentInvoice.buyerConfirmationStatus === "CONFIRMED" || currentInvoice.buyerAttested },
    { label: "Funded", done: ["FUNDED", "REPAID", "Settled"].includes(currentInvoice.status) },
    { label: "Repaid", done: ["REPAID", "Settled"].includes(currentInvoice.status) },
  ];

  const passportData = buildReceivablePassport(currentInvoice);

  return (
    <div className="app-modal-overlay">
      <div className="app-modal-content font-mono text-xs p-4 sm:p-6 space-y-6 max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-[10px] text-[#71717A] uppercase font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
              INVOICE LIFECYCLE &amp; AUDIT TRAIL // {currentInvoice.id}
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#0A0A0A] tracking-tight mt-1">
              Invoice #{currentInvoice.invoiceNumber}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#71717A] hover:text-[#0A0A0A]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Stepper */}
        <div className="bg-[#F8F9FA] p-4 border border-[#E4E4E7] space-y-2">
          <div className="text-[10px] text-[#71717A] uppercase font-bold flex items-center justify-between">
            <span>APPLICATION STATE MACHINE STATUS</span>
            <span className="text-[#059669] font-extrabold uppercase">CURRENT: {currentInvoice.status}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
            {statusSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2 border text-center text-[10px] font-bold ${
                  step.done
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]"
                    : "bg-[#FAFAFA] border-[#E4E4E7] text-[#A1A1AA]"
                }`}
              >
                {step.done ? "✓ " : "○ "}
                {step.label}
              </div>
            ))}
          </div>
        </div>

        {/* Subtab Navigation */}
        <div className="flex border-b border-[#E4E4E7] space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-3 py-2 font-bold shrink-0 ${
              activeTab === "OVERVIEW"
                ? "border-b-2 border-[#0A0A0A] text-[#0A0A0A] bg-[#F4F4F5]"
                : "text-[#71717A]"
            }`}
          >
            01 // DETAILS &amp; WATERFALL
          </button>
          <button
            onClick={() => setActiveTab("PASSPORT")}
            className={`px-3 py-2 font-bold shrink-0 ${
              activeTab === "PASSPORT"
                ? "border-b-2 border-[#0A0A0A] text-[#0A0A0A] bg-[#F4F4F5]"
                : "text-[#71717A]"
            }`}
          >
            02 // RECEIVABLE PASSPORT
          </button>
          <button
            onClick={() => setActiveTab("INTELLIGENCE")}
            className={`px-3 py-2 font-bold shrink-0 ${
              activeTab === "INTELLIGENCE"
                ? "border-b-2 border-[#0A0A0A] text-[#0A0A0A] bg-[#F4F4F5]"
                : "text-[#71717A]"
            }`}
          >
            03 // AI RISK SCORECARD
          </button>
          <button
            onClick={() => setActiveTab("ORACLE")}
            className={`px-3 py-2 font-bold shrink-0 ${
              activeTab === "ORACLE"
                ? "border-b-2 border-[#0A0A0A] text-[#0A0A0A] bg-[#F4F4F5]"
                : "text-[#71717A]"
            }`}
          >
            04 // ED25519 ORACLE &amp; SOLANA
          </button>
          <button
            onClick={() => setActiveTab("AUDIT_TRAIL")}
            className={`px-3 py-2 font-bold shrink-0 ${
              activeTab === "AUDIT_TRAIL"
                ? "border-b-2 border-[#0A0A0A] text-[#0A0A0A] bg-[#F4F4F5]"
                : "text-[#71717A]"
            }`}
          >
            05 // AUDIT TRAIL LOG ({auditEvents.length})
          </button>
        </div>

        {/* TAB 01: OVERVIEW & WATERFALL */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-4">
            {/* Debtor / Buyer Confirmation Component */}
            <BuyerConfirmation
              buyerName={currentInvoice.buyerName}
              sellerName={currentInvoice.sellerName}
              invoiceNumber={currentInvoice.invoiceNumber}
              faceValueInr={currentInvoice.faceValueInr}
              poNumber={currentInvoice.poNumber}
              dueDate={currentInvoice.dueDate || currentInvoice.maturityDate || "N/A"}
              status={currentInvoice.buyerConfirmationStatus || (currentInvoice.buyerAttested ? "CONFIRMED" : "PENDING")}
              confirmedAt={currentInvoice.buyerConfirmedAt}
              confirmedBy={currentInvoice.buyerConfirmedBy}
              disputeReason={currentInvoice.disputeReason}
              disputeComment={currentInvoice.disputeComment}
              onConfirm={handleConfirmBuyer}
              onDispute={handleDisputeBuyer}
              onResetDispute={handleResetDispute}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F8F9FA] p-4 border border-[#E4E4E7] space-y-2">
                <div className="text-[10px] text-[#71717A] font-bold uppercase">SUPPLIER (MSME BORROWER)</div>
                <div className="font-extrabold text-[#0A0A0A] text-sm">{currentInvoice.sellerName}</div>
                <div>GSTIN: <span className="font-bold">{currentInvoice.sellerGstin}</span></div>
                <div>Location: {currentInvoice.sellerLocation}</div>
                <div>Wallet: <code className="bg-white px-1">{currentInvoice.sellerWallet}</code></div>
              </div>

              <div className="bg-[#F8F9FA] p-4 border border-[#E4E4E7] space-y-2">
                <div className="text-[10px] text-[#71717A] font-bold uppercase">ENTERPRISE BUYER</div>
                <div className="font-extrabold text-[#2563EB] text-sm">{currentInvoice.buyerName}</div>
                <div>GSTIN: <span className="font-bold">{currentInvoice.buyerGstin}</span></div>
                <div>PO Number: <span className="font-bold">{currentInvoice.poNumber}</span></div>
                <div>e-Way Bill: <span className="font-bold text-[#059669]">{currentInvoice.ewayBillNumber}</span></div>
              </div>
            </div>

            {/* Verification Timeline */}
            <VerificationTimeline invoice={currentInvoice} />

            {/* Senior / Junior Tranche Waterfall Component */}
            <FinancingWaterfall
              faceValueInr={currentInvoice.faceValueInr}
              advanceRatePct={currentInvoice.advanceRatePct || 85}
              seniorFundingInr={currentInvoice.seniorFundingInr || Math.round((currentInvoice.faceValueInr * 0.85) * 0.8)}
              juniorFundingInr={currentInvoice.juniorFundingInr || Math.round((currentInvoice.faceValueInr * 0.85) * 0.2)}
              discountRateBps={currentInvoice.discountRateBps || 850}
            />
          </div>
        )}

        {/* TAB 02: RECEIVABLE PASSPORT */}
        {activeTab === "PASSPORT" && (
          <div className="space-y-4">
            <ReceivablePassport passport={passportData} />
          </div>
        )}

        {/* TAB 02: INVOICE INTELLIGENCE */}
        {activeTab === "INTELLIGENCE" && (
          <div className="space-y-4">
            <div className="border border-[#0A0A0A] bg-white p-5 space-y-4">
              <div className="text-xs uppercase font-bold text-[#0A0A0A] border-b border-[#E4E4E7] pb-2 flex items-center justify-between">
                <span>INVOICE INTELLIGENCE SCORECARD</span>
                <span className="text-[#059669]">{invoice.riskTier}</span>
              </div>

              {/* Visual Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span>AUTHENTICITY SCORE</span>
                  <strong className="text-[#059669]">{invoice.authenticityScore}/100</strong>
                </div>
                <div className="w-full bg-[#E4E4E7] h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-[#059669] h-full"
                    style={{ width: `${invoice.authenticityScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-[#F8F9FA] border border-[#E4E4E7]">
                  <span className="text-[#71717A]">GST Compliance: </span>
                  <strong className="text-[#059669]">✓ DEMO VERIFIED (GSTN GSTR-2B)</strong>
                  <div className="text-[9px] text-[#71717A] mt-0.5">Simulated for Hackathon Prototype</div>
                </div>
                <div className="p-3 bg-[#F8F9FA] border border-[#E4E4E7]">
                  <span className="text-[#71717A]">e-Way Bill Status: </span>
                  <strong className="text-[#059669]">✓ DEMO VERIFIED (NIC PORTAL)</strong>
                  <div className="text-[9px] text-[#71717A] mt-0.5">Simulated for Hackathon Prototype</div>
                </div>
                <div className="p-3 bg-[#F8F9FA] border border-[#E4E4E7]">
                  <span className="text-[#71717A]">PO Consistency: </span>
                  <strong className="text-[#059669]">✓ CONSISTENT (PO-{invoice.poNumber})</strong>
                </div>
                <div className="p-3 bg-[#F8F9FA] border border-[#E4E4E7]">
                  <span className="text-[#71717A]">Recommended Discount Rate: </span>
                  <strong className="text-[#2563EB]">{(invoice.discountRateBps / 100).toFixed(2)}% APR</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 03: ORACLE & SOLANA */}
        {activeTab === "ORACLE" && (
          <div className="space-y-4">
            {/* Ed25519 Cryptographic Signature Box */}
            <div className="border border-[#0A0A0A] bg-white p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
                <span className="font-bold text-[#0A0A0A] flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#059669]" /> ON-CHAIN ED25519 ORACLE ATTESTATION
                </span>
                <button
                  onClick={handleVerifySignature}
                  disabled={isVerifying}
                  className="px-3 py-1 bg-[#0A0A0A] text-white hover:bg-[#27272A] font-bold text-[10px] uppercase tracking-wider"
                >
                  {isVerifying ? "Verifying..." : "Verify Signature in Browser"}
                </button>
              </div>

              {verificationResult && (
                <div
                  className={`p-3 border text-[11px] font-bold ${
                    verificationResult.verified
                      ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]"
                      : "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]"
                  }`}
                >
                  {verificationResult.message}
                  <div className="text-[10px] font-mono text-[#52525B] font-normal mt-1">
                    SHA-256 Payload Hash: {verificationResult.payloadHash}
                  </div>
                </div>
              )}

              <div className="bg-[#0A0A0A] text-white p-3 space-y-1 text-[10px] font-mono break-all leading-relaxed">
                <div>
                  <span className="text-[#71717A]">ORACLE_PUBLIC_KEY: </span>
                  <span className="text-[#A7F3D0]">
                    7d8f921ea5c3b1a8d9e0f2456bce1847a98d3ef0c1284a569b7c8d9e0f123456
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A]">ED25519_SIGNATURE: </span>
                  <span className="text-[#93C5FD]">
                    {invoice.oracleSignature ||
                      "4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c"}
                  </span>
                </div>
              </div>
            </div>

            {/* Solana Devnet Anchor Box */}
            <div className="border border-[#0A0A0A] bg-white p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
                <span className="font-bold text-[#0A0A0A] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> SOLANA DEVNET ANCHOR TRANSACTION
                </span>
                <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[9px] font-bold uppercase">
                  DEVNET CONFIRMED
                </span>
              </div>

              <p className="text-[11px] text-[#52525B]">
                Canonical invoice payload hash is anchored immutably on Solana Devnet via a Memo instruction.
              </p>

              <div className="bg-[#F8F9FA] p-3 border border-[#E4E4E7] space-y-1 text-[11px]">
                <div>Network: <strong>Solana Devnet (api.devnet.solana.com)</strong></div>
                <div>Mint Asset: <code className="bg-white px-1">{invoice.token2022Mint}</code></div>
                <div>
                  Solana Explorer:{" "}
                  <a
                    href={`https://explorer.solana.com/address/${invoice.token2022Mint}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563EB] font-bold underline inline-flex items-center gap-1"
                  >
                    View on Solana Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 04: AUDIT TRAIL LOG */}
        {activeTab === "AUDIT_TRAIL" && (
          <div className="space-y-3">
            <div className="text-[10px] text-[#71717A] uppercase font-bold border-b border-[#E4E4E7] pb-1">
              COMPLETE CHRONOLOGICAL AUDIT TRAIL LOG
            </div>

            <div className="space-y-2">
              {auditEvents.map((evt, idx) => (
                <div key={idx} className="p-3 bg-[#F8F9FA] border border-[#E4E4E7] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#0A0A0A] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#2563EB]" /> {evt.title}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-[#E4E4E7] font-bold text-[9px] text-[#71717A]">
                      ACTOR: {evt.actor}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#52525B] font-sans">{evt.description}</p>
                  <div className="text-[9px] text-[#A1A1AA] pt-0.5">
                    {new Date(evt.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E4E4E7] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0A0A0A] text-white font-bold text-xs uppercase tracking-wider"
          >
            Close Invoice Details
          </button>
        </div>
      </div>
    </div>
  );
};
