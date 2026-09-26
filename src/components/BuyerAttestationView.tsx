import React, { useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Percent,
  Coins,
  ArrowRight,
  TrendingDown,
  Building2,
  Key,
} from "lucide-react";
import { InvoiceRecord } from "../types";

interface BuyerAttestationViewProps {
  invoices: InvoiceRecord[];
  onAttestInvoice: (invoice: InvoiceRecord) => void;
  onSettleWithRebate: (invoice: InvoiceRecord, rebateAmount: number) => void;
}

export const BuyerAttestationView: React.FC<BuyerAttestationViewProps> = ({
  invoices,
  onAttestInvoice,
  onSettleWithRebate,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    invoices.find((i) => !i.buyerAttested)?.id || invoices[0]?.id || ""
  );
  const [daysEarlySettlement, setDaysEarlySettlement] = useState<number>(30);
  const [rebateSuccessMsg, setRebateSuccessMsg] = useState<string | null>(null);

  const currentInvoice = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];

  // Dynamic rebate calculation
  // Formula: Face Value * (Rebate BPS / 10,000) * (Days Early / 365)
  const rebateBps = currentInvoice?.buyerRebateBps || 150; // 1.5% annual rate
  const faceVal = currentInvoice?.faceValueInr || 4500000;
  const calculatedEarlyRebate = Math.round((faceVal * (rebateBps / 10000) * (daysEarlySettlement / 365)));
  const netRepayment = faceVal - calculatedEarlyRebate;

  const handleAttest = () => {
    if (!currentInvoice) return;
    onAttestInvoice(currentInvoice);
    setRebateSuccessMsg(
      `Enterprise Keypair Co-Sign confirmed for ${currentInvoice.id}. Discount rate reduced by 200 bps on Solana.`
    );
    setTimeout(() => setRebateSuccessMsg(null), 5000);
  };

  const handleEarlySettle = () => {
    if (!currentInvoice) return;
    onSettleWithRebate(currentInvoice, calculatedEarlyRebate);
    setRebateSuccessMsg(
      `Early settlement completed! Enterprise Buyer saved ₹${calculatedEarlyRebate.toLocaleString("en-IN")} in automated rebate cash deduction.`
    );
    setTimeout(() => setRebateSuccessMsg(null), 6000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-xs font-mono uppercase text-[#71717A] tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
              ENTERPRISE CO-SIGNING // SMART CONTRACT REBATE INCENTIVE ENGINE
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] font-mono mt-1">
              Buyer Attestation &amp; Automated Early Settlement Rebates
            </h2>
          </div>
          <div className="text-right font-mono">
            <div className="text-[10px] text-[#71717A] uppercase">STANDARD CO-SIGN BONUS</div>
            <div className="text-xl font-extrabold text-[#059669]">-200 BPS APR</div>
          </div>
        </div>

        <p className="text-xs text-[#52525B] max-w-3xl pt-3 leading-relaxed">
          Enterprise buyers (such as Tata Motors, Reliance Retail, or Dixon) co-sign invoices on Solana using their corporate keypair. In return for eliminating dispute risk, the supplier's financing cost drops by 200 bps, and the buyer receives a programmed eINR cash rebate if they settle before maturity.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Attestation Console (5/12) */}
        <div className="lg:col-span-5 space-y-5 font-mono text-xs">
          <div className="border border-[#0A0A0A] bg-white p-6 space-y-4">
            <div className="text-[10px] text-[#71717A] uppercase font-bold border-b border-[#E4E4E7] pb-2">
              SELECT INVOICE TO CO-SIGN / SETTLE
            </div>

            <div>
              <label className="block text-[10px] text-[#71717A] uppercase mb-1">Select Invoice</label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} — {inv.buyerName.slice(0, 24)} {inv.buyerAttested ? "(Attested)" : "(Pending Co-Sign)"}
                  </option>
                ))}
              </select>
            </div>

            {currentInvoice && (
              <div className="bg-[#F8F9FA] p-4 border border-[#E4E4E7] space-y-2.5 text-[11px]">
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">Enterprise Buyer:</span>
                  <span className="font-bold text-[#2563EB]">{currentInvoice.buyerName}</span>
                </div>
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">Corporate GSTIN:</span>
                  <span className="font-bold text-[#0A0A0A]">{currentInvoice.buyerGstin}</span>
                </div>
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">MSME Supplier:</span>
                  <span className="font-bold text-[#0A0A0A] truncate max-w-[180px]">{currentInvoice.sellerName}</span>
                </div>
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">Invoice Face Value:</span>
                  <span className="font-bold text-[#059669]">₹{currentInvoice.faceValueInr.toLocaleString("en-IN")} eINR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Attestation Status:</span>
                  <span className={`font-bold ${currentInvoice.buyerAttested ? "text-[#059669]" : "text-[#D97706]"}`}>
                    {currentInvoice.buyerAttested ? "ATTESTED ON-CHAIN" : "PENDING CO-SIGNATURE"}
                  </span>
                </div>
              </div>
            )}

            {currentInvoice && !currentInvoice.buyerAttested && (
              <button
                onClick={handleAttest}
                className="w-full py-3 bg-[#0A0A0A] text-white hover:bg-[#27272A] transition-colors font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4 text-[#059669]" /> CO-SIGN AS ENTERPRISE BUYER (-200 BPS)
              </button>
            )}

            {currentInvoice && currentInvoice.buyerAttested && (
              <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-sans flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Enterprise co-signature verified on Solana Anchor program. Early rebate enabled.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Early Settlement Rebate Simulator (7/12) */}
        <div className="lg:col-span-7 border border-[#0A0A0A] bg-white p-6 md:p-8 space-y-6 font-mono text-xs">
          <div className="border-b border-[#E4E4E7] pb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#71717A] uppercase">REBATE CALCULATION MATRIX</div>
              <h3 className="text-base font-extrabold text-[#0A0A0A]">
                Dynamic Early Payment Cash Rebate Simulator
              </h3>
            </div>
            <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-2 py-1 font-bold border border-[#BFDBFE]">
              REBATE RATE: {rebateBps} BPS ANNUALIZED
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-[#71717A] uppercase mb-1 font-semibold">
                Days Paid in Advance of Maturity: {daysEarlySettlement} Days Early
              </label>
              <input
                type="range"
                min={5}
                max={currentInvoice?.tenureDays || 90}
                step={5}
                value={daysEarlySettlement}
                onChange={(e) => setDaysEarlySettlement(Number(e.target.value))}
                className="w-full accent-[#0A0A0A]"
              />
              <div className="flex justify-between text-[10px] text-[#71717A] mt-1">
                <span>5 Days Early</span>
                <span>30 Days (1 Month Ahead)</span>
                <span>60 Days Early</span>
              </div>
            </div>

            {/* Financial Output Box */}
            <div className="bg-[#F4F4F5] border border-[#E4E4E7] p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] text-[#71717A] uppercase">GROSS INVOICE DUE</div>
                  <div className="text-lg font-bold text-[#0A0A0A]">
                    ₹{(faceVal).toLocaleString("en-IN")}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#71717A] uppercase">AUTOMATED REBATE SAVINGS</div>
                  <div className="text-lg font-extrabold text-[#059669]">
                    - ₹{calculatedEarlyRebate.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-[#059669]">Immediate cash discount</div>
                </div>

                <div>
                  <div className="text-[10px] text-[#71717A] uppercase">NET PAYOUT REQUIRED</div>
                  <div className="text-lg font-extrabold text-[#2563EB]">
                    ₹{netRepayment.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E4E4E7] pt-3 text-[11px] text-[#52525B] font-sans leading-relaxed">
                By settling {daysEarlySettlement} days ahead of scheduled {currentInvoice?.maturityDate} maturity, the enterprise corporate treasury reduces its cost of goods sold (COGS) while maintaining highest tier liquidity scores on Credexa.
              </div>
            </div>

            {rebateSuccessMsg && (
              <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-sans flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{rebateSuccessMsg}</span>
              </div>
            )}

            {currentInvoice?.status === "Funded" && (
              <button
                onClick={handleEarlySettle}
                className="w-full py-3 bg-[#059669] text-white hover:bg-[#047857] transition-colors font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" /> EXECUTE EARLY SETTLEMENT (DEDUCT ₹{calculatedEarlyRebate.toLocaleString("en-IN")} REBATE)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
