import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coins,
  ExternalLink,
  Wallet,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { InvoiceRecord } from "../types";
import { safeFetch } from "../services/apiClient";

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  onSuccess?: () => void;
}

export const InvestModal: React.FC<InvestModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [amountInr, setAmountInr] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("7xKey...PhantomDevnet");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    investment: any;
    signature: string;
    explorerUrl: string;
    fundedAmount: number;
    remainingAmount: number;
  } | null>(null);

  if (!isOpen || !invoice) return null;

  const maxAdvanceRate = (invoice.advanceRatePct || 85) / 100;
  const financingTarget = Math.round(invoice.faceValueInr * maxAdvanceRate);
  const currentFunded = invoice.fundedAmountInr || 0;
  const remainingCapacity = Math.max(0, financingTarget - currentFunded);
  const currentProgressPct = Math.min(100, Math.round((currentFunded / financingTarget) * 100));

  const inputNum = parseFloat(amountInr) || 0;
  const newFundedTotal = currentFunded + inputNum;
  const remainingAfterInvestment = Math.max(0, remainingCapacity - inputNum);

  // Discount rate / Financing term return calculation
  const discountRatePct = (invoice.discountRateBps || 850) / 100;
  const tenureDays = invoice.tenureDays || 90;
  const expectedReturnPct = Math.round((discountRatePct * (tenureDays / 365)) * 100) / 100;
  const expectedRepayment = inputNum > 0 ? Math.round(inputNum * (1 + expectedReturnPct / 100)) : 0;

  const handleInvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (inputNum <= 0) {
      setErrorMsg("Please enter a valid investment amount greater than ₹0.");
      return;
    }

    if (inputNum > remainingCapacity) {
      setErrorMsg(
        `Investment amount ₹${inputNum.toLocaleString("en-IN")} exceeds remaining capacity of ₹${remainingCapacity.toLocaleString("en-IN")}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await safeFetch(`/api/financing/invoices/${invoice.id}/invest`, {
        method: "POST",
        body: JSON.stringify({
          amountInr: inputNum,
          walletAddress: walletAddress,
          tranche: "Senior",
        }),
      });

      if (res.ok && res.data.success) {
        setSuccessResult({
          investment: res.data.investment,
          signature: res.data.transaction?.signature || "Simulated_Devnet_Tx",
          explorerUrl: res.data.transaction?.explorerUrl || `https://explorer.solana.com/tx/simulated?cluster=devnet`,
          fundedAmount: res.data.fundedAmount,
          remainingAmount: res.data.remainingAmount,
        });
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.data?.error || "Failed to confirm investment transaction.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error during investment processing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-modal-overlay">
      <div className="app-modal-content font-sans text-xs max-w-lg w-full">
        {/* Modal Header */}
        <div className="border-b border-[#E5E5E5] bg-[#0A0A0A] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#2563EB]" />
            <span className="font-bold text-xs sm:text-sm tracking-wide font-mono uppercase">
              DIRECT INVOICE FINANCING // SOLANA DEVNET
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white transition-colors p-1"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {successResult ? (
          <div className="p-6 space-y-5 bg-white">
            <div className="p-4 border border-[#16A34A] bg-[#F0FDF4] rounded-[6px] space-y-1.5">
              <div className="flex items-center gap-2 text-[#16A34A] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>INVESTMENT CONFIRMED ON SOLANA DEVNET</span>
              </div>
              <p className="text-xs text-[#333333] leading-relaxed">
                You have successfully invested <strong>₹{inputNum.toLocaleString("en-IN")}</strong> in Invoice{" "}
                <strong>#{invoice.invoiceNumber}</strong>. Your investment position is anchored directly on-chain.
              </p>
            </div>

            <div className="space-y-2 p-4 border border-[#E5E5E5] bg-[#FAFAFA] rounded-[6px] font-mono text-xs">
              <div className="flex justify-between items-center text-[#666666]">
                <span>Invoice Number:</span>
                <span className="font-bold text-[#111111]">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center text-[#666666]">
                <span>Amount Invested:</span>
                <span className="font-bold text-[#16A34A]">₹{inputNum.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-[#666666]">
                <span>Expected Repayment:</span>
                <span className="font-bold text-[#2563EB]">₹{expectedRepayment.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-[#666666] pt-1 border-t border-[#E5E5E5]">
                <span>Devnet Transaction Signature:</span>
                <span className="font-bold text-[#2563EB] truncate max-w-[200px]">{successResult.signature}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href={successResult.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-1.5 rounded-[4px]"
              >
                <span>View on Solana Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#111111] text-white hover:bg-[#333333] font-semibold text-xs uppercase rounded-[4px]"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleInvestSubmit} className="p-5 space-y-5 bg-white">
            {/* Invoice Overview Card */}
            <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-4 rounded-[6px] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                <div>
                  <div className="font-mono text-[10px] text-[#71717A] uppercase">SELECTED INVOICE</div>
                  <div className="font-bold text-sm text-[#111111] font-mono">#{invoice.invoiceNumber}</div>
                </div>
                <div className="text-right font-mono">
                  <span className="px-2 py-0.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-[10px] font-bold rounded uppercase">
                    {invoice.riskTier || "VERIFIED"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-[#71717A] text-[10px] uppercase">Seller (MSME)</span>
                  <div className="font-semibold text-[#111111] truncate">{invoice.sellerName}</div>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] uppercase">Buyer (Enterprise)</span>
                  <div className="font-semibold text-[#111111] truncate">{invoice.buyerName}</div>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] uppercase">Face Value</span>
                  <div className="font-bold text-[#111111]">₹{invoice.faceValueInr.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] uppercase">Financing Target ({invoice.advanceRatePct || 85}%)</span>
                  <div className="font-bold text-[#2563EB]">₹{financingTarget.toLocaleString("en-IN")}</div>
                </div>
              </div>

              {/* Funding Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#71717A]">Funded: ₹{currentFunded.toLocaleString("en-IN")} ({currentProgressPct}%)</span>
                  <span className="text-[#16A34A] font-bold">Remaining: ₹{remainingCapacity.toLocaleString("en-IN")}</span>
                </div>
                <div className="w-full h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] transition-all duration-300"
                    style={{ width: `${currentProgressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] rounded-[4px] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Investment Input Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-[#111111]">
                  Investment Amount (INR ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-sm text-[#71717A]">₹</span>
                  <input
                    type="number"
                    min="1000"
                    max={remainingCapacity}
                    value={amountInr}
                    onChange={(e) => setAmountInr(e.target.value)}
                    placeholder={`Enter amount (Max ₹${remainingCapacity.toLocaleString("en-IN")})`}
                    className="w-full pl-7 pr-4 py-2 border border-[#E5E5E5] focus:border-[#2563EB] focus:outline-none rounded-[4px] font-mono text-sm"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#71717A] font-mono">
                  <span>Min Investment: ₹1,000</span>
                  <button
                    type="button"
                    onClick={() => setAmountInr(String(remainingCapacity))}
                    className="text-[#2563EB] hover:underline font-semibold"
                  >
                    Invest Max Capacity (₹{remainingCapacity.toLocaleString("en-IN")})
                  </button>
                </div>
              </div>

              {/* Connected Wallet Display */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-[#111111] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#2563EB]" /> Connected Investor Wallet
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] font-mono text-xs text-[#52525B]"
                />
              </div>

              {/* Financing Terms & Expected Repayment Preview */}
              {inputNum > 0 && (
                <div className="p-3 border border-[#BFDBFE] bg-[#EFF6FF] rounded-[4px] space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-[#1E40AF]">
                    <span className="flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" /> Expected Repayment Amount:
                    </span>
                    <span className="font-bold text-sm">₹{expectedRepayment.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#3B82F6]">
                    <span>Tenure: {tenureDays} Days</span>
                    <span>Estimated Return: +{expectedReturnPct}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E5E5]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E5E5E5] text-[#52525B] hover:bg-[#F4F4F5] font-semibold rounded-[4px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || inputNum <= 0 || inputNum > remainingCapacity}
                className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-[4px] flex items-center gap-2"
              >
                <span>{isSubmitting ? "Confirming Transaction..." : "Confirm & Invest"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
