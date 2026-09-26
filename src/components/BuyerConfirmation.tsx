import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, MessageSquare, Clock } from "lucide-react";

interface BuyerConfirmationProps {
  buyerName: string;
  sellerName: string;
  invoiceNumber: string;
  faceValueInr: number;
  poNumber: string;
  dueDate: string;
  status: "CONFIRMED" | "PENDING" | "DISPUTED" | string;
  confirmedAt?: string;
  confirmedBy?: string;
  disputeReason?: string;
  disputeComment?: string;
  onConfirm: () => void;
  onDispute: (reason: string, comment: string) => void;
  onResetDispute?: () => void;
  isReadOnly?: boolean;
}

const DISPUTE_REASONS = [
  "Amount mismatch with PO / Delivery Challan",
  "PO number mismatch or missing authorization",
  "Goods / services not received or damaged in transit",
  "Duplicate invoice submission",
  "Payment already processed / settled directly",
  "Other administrative discrepancy",
];

export const BuyerConfirmation: React.FC<BuyerConfirmationProps> = ({
  buyerName,
  sellerName,
  invoiceNumber,
  faceValueInr,
  poNumber,
  dueDate,
  status,
  confirmedAt,
  confirmedBy,
  disputeReason,
  disputeComment,
  onConfirm,
  onDispute,
  onResetDispute,
  isReadOnly = false,
}) => {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(DISPUTE_REASONS[0]);
  const [commentText, setCommentText] = useState("");

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDispute(selectedReason, commentText);
    setShowDisputeModal(false);
  };

  const normStatus = (status || "PENDING").toUpperCase();

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#111111]">
            Debtor / Buyer Confirmation
          </h3>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FAFAFA] border border-[#E5E5E5] text-[#555555]">
          DEMO BUYER ATTESTATION
        </span>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-[#FAFAFA] p-3 rounded-md border border-[#E5E5E5]">
        <div>
          <span className="text-[10px] uppercase text-[#888888]">Buyer</span>
          <div className="font-bold text-[#111111] truncate">{buyerName}</div>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[#888888]">Invoice Face Value</span>
          <div className="font-bold text-[#111111]">₹{faceValueInr.toLocaleString("en-IN")}</div>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[#888888]">PO Number</span>
          <div className="font-bold text-[#111111]">{poNumber || "N/A"}</div>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[#888888]">Due Date</span>
          <div className="font-bold text-[#111111]">{dueDate || "N/A"}</div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {normStatus === "CONFIRMED" && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] rounded-md text-xs font-mono font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>BUYER CONFIRMED</span>
            </div>
          )}

          {normStatus === "PENDING" && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] rounded-md text-xs font-mono font-bold">
              <Clock className="w-4 h-4" />
              <span>CONFIRMATION PENDING</span>
            </div>
          )}

          {normStatus === "DISPUTED" && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF2F2] border border-[#FECACA] text-[#E53935] rounded-md text-xs font-mono font-bold">
              <XCircle className="w-4 h-4" />
              <span>INVOICE DISPUTED</span>
            </div>
          )}

          {confirmedAt && normStatus === "CONFIRMED" && (
            <span className="text-[11px] text-[#666666] font-mono">
              Attested by {confirmedBy || "Procurement Officer"}
            </span>
          )}
        </div>

        {/* Buttons */}
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {normStatus !== "CONFIRMED" && (
              <button
                type="button"
                onClick={onConfirm}
                className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-mono font-semibold rounded-md transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Receivable</span>
              </button>
            )}

            {normStatus !== "DISPUTED" && (
              <button
                type="button"
                onClick={() => setShowDisputeModal(true)}
                className="px-3 py-1.5 bg-white border border-[#E53935] text-[#E53935] hover:bg-[#FEF2F2] text-xs font-mono font-semibold rounded-md transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Dispute Invoice</span>
              </button>
            )}

            {normStatus === "DISPUTED" && onResetDispute && (
              <button
                type="button"
                onClick={onResetDispute}
                className="px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] text-xs font-mono font-medium rounded-md"
              >
                Reset Demo Dispute
              </button>
            )}
          </div>
        )}
      </div>

      {/* Disputed Information Banner */}
      {normStatus === "DISPUTED" && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs space-y-1">
          <div className="font-bold text-[#E53935] flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Dispute Active: Funding &amp; Financing Blocked</span>
          </div>
          {disputeReason && (
            <div className="text-[#333333] font-mono">
              <strong>Reason:</strong> {disputeReason}
            </div>
          )}
          {disputeComment && (
            <div className="text-[#555555] italic">"{disputeComment}"</div>
          )}
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="app-modal-overlay">
          <div className="app-modal-content max-w-md p-5 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <h4 className="text-sm font-mono font-bold text-[#E53935] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Dispute Invoice {invoiceNumber}
              </h4>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-[#888888] hover:text-[#111111]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono font-semibold text-[#111111] mb-1">
                  Select Dispute Reason *
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full p-2 border border-[#E5E5E5] rounded-md font-sans bg-white focus:outline-none focus:border-[#E53935]"
                >
                  {DISPUTE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono font-semibold text-[#111111] mb-1">
                  Comments / Observations (Optional)
                </label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Provide additional details regarding the dispute..."
                  className="w-full p-2 border border-[#E5E5E5] rounded-md font-sans bg-white focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] rounded-md text-[11px] font-mono">
                ⚠ Submitting a dispute will block financing eligibility for this invoice until resolved by the buyer.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-3 py-1.5 border border-[#E5E5E5] text-[#555555] rounded-md hover:bg-[#FAFAFA] font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E53935] hover:bg-[#C62828] text-white font-mono font-bold rounded-md"
                >
                  Confirm Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
