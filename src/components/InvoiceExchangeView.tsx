import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Cpu,
  Coins,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { InvoiceRecord, InvoiceStatus, FactoringMode } from "../types";
import { TokenizeModal } from "./TokenizeModal";

interface InvoiceExchangeViewProps {
  invoices: InvoiceRecord[];
  onTokenize: (invoice: Partial<InvoiceRecord>) => void;
  onAuditInvoice: (invoice: InvoiceRecord) => void;
  onFundInvoice: (invoice: InvoiceRecord) => void;
  onBuyerAttest: (invoice: InvoiceRecord) => void;
  onSettleInvoice: (invoice: InvoiceRecord) => void;
  onTriggerDefault: (invoice: InvoiceRecord) => void;
}

export const InvoiceExchangeView: React.FC<InvoiceExchangeViewProps> = ({
  invoices,
  onTokenize,
  onAuditInvoice,
  onFundInvoice,
  onBuyerAttest,
  onSettleInvoice,
  onTriggerDefault,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(invoices[0] || null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.sellerGstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "Funded":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            FUNDED
          </span>
        );
      case "Verified":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            ORACLE VERIFIED
          </span>
        );
      case "Settled":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold bg-[#F4F4F5] text-[#0A0A0A] border border-[#D4D4D8]">
            SETTLED
          </span>
        );
      case "GracePeriod":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] animate-pulse">
            15D GRACE ACTIVE
          </span>
        );
      case "Defaulted":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
            DEFAULTED
          </span>
        );
      case "Draft":
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold bg-[#FAFAFA] text-[#71717A] border border-[#E4E4E7]">
            DRAFT TOKEN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Action and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#E4E4E7] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Buyer, Supplier, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs font-mono border border-[#0A0A0A] bg-white w-64 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1 text-xs font-mono">
            {["ALL", "Verified", "Funded", "Settled", "GracePeriod", "Defaulted"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-[11px] uppercase tracking-wider ${
                  statusFilter === s
                    ? "bg-[#0A0A0A] text-white font-bold"
                    : "bg-[#F4F4F5] text-[#71717A] hover:text-[#0A0A0A]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#0A0A0A] text-white hover:bg-[#27272A] transition-colors text-xs font-mono font-bold flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> TOKENIZE NEW INVOICE
        </button>
      </div>

      {/* Main Grid: Invoices Table (Left) + Detailed Inspector (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table Column (7/12) */}
        <div className="xl:col-span-8 border border-[#0A0A0A] bg-white overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-wider border-b border-[#0A0A0A]">
                <th className="p-3">INVOICE &amp; TOKEN-2022</th>
                <th className="p-3">MSME SELLER / BUYER</th>
                <th className="p-3 text-right">FACE VALUE (eINR)</th>
                <th className="p-3">RATE &amp; TENURE</th>
                <th className="p-3">RISK TIER</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#F4F4F5]" : "hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <td className="p-3 align-top">
                      <div className="font-bold text-[#0A0A0A] flex items-center gap-1.5">
                        {inv.id}
                        {inv.buyerAttested && (
                          <span title="Enterprise Buyer Attested on Solana">
                            <BadgeCheck className="w-3.5 h-3.5 text-[#059669]" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#71717A] truncate max-w-[140px]">
                        {inv.token2022Mint.slice(0, 10)}...
                      </div>
                      <div className="text-[9px] uppercase px-1 py-0.2 bg-[#E4E4E7] text-[#0A0A0A] inline-block mt-0.5 font-bold">
                        {inv.factoringMode}
                      </div>
                    </td>

                    <td className="p-3 align-top">
                      <div className="font-semibold text-[#0A0A0A] truncate max-w-[180px]">
                        {inv.sellerName}
                      </div>
                      <div className="text-[10px] text-[#2563EB] truncate max-w-[180px] font-bold">
                        → {inv.buyerName}
                      </div>
                      <div className="text-[10px] text-[#71717A]">
                        GSTIN: {inv.sellerGstin}
                      </div>
                    </td>

                    <td className="p-3 align-top text-right">
                      <div className="font-bold text-[#0A0A0A] text-sm">
                        ₹{(inv.faceValueInr).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-[#059669]">
                        Advance: ₹{(inv.fundedAmountInr).toLocaleString("en-IN")} ({inv.advanceRatePct}%)
                      </div>
                    </td>

                    <td className="p-3 align-top">
                      <div className="font-bold text-[#0A0A0A]">
                        {(inv.discountRateBps / 100).toFixed(2)}% APR
                      </div>
                      <div className="text-[10px] text-[#71717A]">
                        {inv.tenureDays}d (Due {inv.maturityDate})
                      </div>
                    </td>

                    <td className="p-3 align-top">
                      <div className="font-bold text-[#0A0A0A]">{inv.riskTier.replace("TIER_", "")}</div>
                      <div className="text-[10px] text-[#71717A]">
                        Score: {inv.authenticityScore}/100
                      </div>
                    </td>

                    <td className="p-3 align-top">
                      {getStatusBadge(inv.status)}
                    </td>

                    <td className="p-3 align-top text-right" onClick={(e) => e.stopPropagation()}>
                      {inv.status === "Draft" && (
                        <button
                          onClick={() => onAuditInvoice(inv)}
                          className="px-2.5 py-1 bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
                        >
                          <Cpu className="w-3 h-3" /> AUDIT
                        </button>
                      )}

                      {inv.status === "Verified" && (
                        <button
                          onClick={() => onFundInvoice(inv)}
                          className="px-2.5 py-1 bg-[#059669] text-white hover:bg-[#047857] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
                        >
                          <Coins className="w-3 h-3" /> FUND
                        </button>
                      )}

                      {inv.status === "Funded" && (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => onSettleInvoice(inv)}
                            className="px-2.5 py-1 bg-[#0A0A0A] text-white hover:bg-[#27272A] text-[10px] font-bold uppercase tracking-wider"
                          >
                            SETTLE
                          </button>
                          {!inv.buyerAttested && (
                            <button
                              onClick={() => onBuyerAttest(inv)}
                              className="text-[9px] text-[#2563EB] hover:underline uppercase font-bold"
                            >
                              + CO-SIGN
                            </button>
                          )}
                        </div>
                      )}

                      {inv.status === "GracePeriod" && (
                        <button
                          onClick={() => onTriggerDefault(inv)}
                          className="px-2.5 py-1 bg-[#DC2626] text-white hover:bg-[#B91C1C] text-[10px] font-bold uppercase tracking-wider"
                        >
                          CLAWBACK
                        </button>
                      )}

                      {inv.status === "Settled" && (
                        <span className="text-[10px] text-[#059669] font-bold">PAID (REBATE)</span>
                      )}

                      {inv.status === "Defaulted" && (
                        <span className="text-[10px] text-[#DC2626] font-bold">LIQUIDATED</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#71717A]">
                    No invoices matching current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Invoice Full Telemetry Inspector (Right 5/12) */}
        {selectedInvoice && (
          <div className="xl:col-span-4 border border-[#0A0A0A] bg-white p-6 space-y-5 font-mono text-xs">
            <div className="border-b border-[#0A0A0A] pb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#71717A] uppercase">SELECTED INVOICE PDA</div>
                <div className="text-base font-extrabold text-[#0A0A0A]">{selectedInvoice.id}</div>
              </div>
              {getStatusBadge(selectedInvoice.status)}
            </div>

            {/* Token-2022 Spec Box */}
            <div className="bg-[#F8F9FA] border border-[#E4E4E7] p-3 space-y-2">
              <div className="text-[10px] text-[#71717A] uppercase font-bold flex items-center justify-between">
                <span>TOKEN-2022 METADATA EXTENSION</span>
                <span className="text-[#059669]">CONFIRMED</span>
              </div>
              <div className="text-[11px] text-[#0A0A0A] break-all">
                <span className="text-[#71717A]">Mint: </span>
                {selectedInvoice.token2022Mint}
              </div>
              <div className="text-[11px] text-[#0A0A0A] break-all">
                <span className="text-[#71717A]">IRN Hash: </span>
                {selectedInvoice.irn}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-[#E4E4E7]">
                <div>
                  <span className="text-[#71717A]">HSN Code:</span> {selectedInvoice.hsnCode}
                </div>
                <div>
                  <span className="text-[#71717A]">e-Way Bill:</span> {selectedInvoice.ewayBillNumber}
                </div>
              </div>
            </div>

            {/* Fractional Financing Breakdown */}
            {(() => {
              const total = selectedInvoice.faceValueInr;
              const funded = selectedInvoice.fundedAmountInr || 0;
              const remaining = Math.max(0, total - funded);
              const pct = Math.min(100, Math.round((funded / total) * 100 * 10) / 10);
              const financers = selectedInvoice.financers || [];

              return (
                <div className="border border-[#0A0A0A] bg-[#F8F9FA] p-3 space-y-2 font-mono text-xs">
                  <div className="text-[10px] text-[#71717A] uppercase font-bold flex justify-between">
                    <span>FRACTIONAL FINANCING STATUS</span>
                    <span className="text-[#059669] font-extrabold">{pct}% FUNDED</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <span className="text-[#71717A] block">Total:</span>
                      <strong className="text-[#0A0A0A]">₹{total.toLocaleString("en-IN")}</strong>
                    </div>
                    <div>
                      <span className="text-[#71717A] block">Funded:</span>
                      <strong className="text-[#059669]">₹{funded.toLocaleString("en-IN")}</strong>
                    </div>
                    <div>
                      <span className="text-[#71717A] block">Remaining:</span>
                      <strong className="text-[#2563EB]">₹{remaining.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <div className="w-full bg-[#E4E4E7] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#059669] h-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                  </div>

                  {financers.length > 0 && (
                    <div className="pt-2 border-t border-[#E4E4E7] space-y-1">
                      <div className="text-[9px] font-bold text-[#71717A] uppercase">Financers ({financers.length})</div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {financers.map((f, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] bg-white p-1 border border-[#E4E4E7]">
                            <span className="font-bold text-[#0A0A0A]">{f.financerName} ({f.tranche})</span>
                            <span className="text-[#059669] font-extrabold">₹{f.amountInr.toLocaleString("en-IN")} ({f.sharePct}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Financial Tranche Allocation Breakdown */}
            <div className="space-y-2">
              <div className="text-[10px] text-[#71717A] uppercase font-bold">
                TRANCHE WATERFALL ALLOCATION
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#52525B]">Senior Tranche (Protected 11.5%):</span>
                  <span className="font-bold text-[#0A0A0A]">
                    ₹{(selectedInvoice.seniorFundingInr || (selectedInvoice.fundedAmountInr * 0.8)).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#2563EB] h-2 w-[80%]"></div>
                </div>

                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-[#52525B]">Junior Tranche (First-Loss 24%):</span>
                  <span className="font-bold text-[#0A0A0A]">
                    ₹{(selectedInvoice.juniorFundingInr || (selectedInvoice.fundedAmountInr * 0.2)).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="w-full bg-[#E4E4E7] h-2">
                  <div className="bg-[#059669] h-2 w-[20%]"></div>
                </div>
              </div>
            </div>

            {/* Recourse Collateral or Non-Recourse Buffer */}
            <div className="border border-[#E4E4E7] p-3 space-y-1">
              <div className="text-[10px] text-[#71717A] uppercase font-bold flex justify-between">
                <span>FACTORING RISK MECHANICS</span>
                <span className="text-[#0A0A0A] font-bold">{selectedInvoice.factoringMode}</span>
              </div>
              <div className="text-xs text-[#52525B] font-sans">
                {selectedInvoice.factoringMode === "Recourse" ? (
                  <>
                    Seller locked <span className="font-mono font-bold text-[#0A0A0A]">₹{(selectedInvoice.collateralLockedInr || 0).toLocaleString("en-IN")} eINR</span> as first-default clawback guarantee.
                  </>
                ) : (
                  <>
                    Zero seller collateral. 100% protocol risk buffered by Junior Tranche and Insurance Reserve PDA.
                  </>
                )}
              </div>
            </div>

            {/* Enterprise Buyer Attestation Status */}
            <div className="border border-[#E4E4E7] p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                <span>ENTERPRISE BUYER CO-SIGN</span>
                {selectedInvoice.buyerAttested ? (
                  <span className="text-[#059669] flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> ATTESTED (-200 BPS)
                  </span>
                ) : (
                  <span className="text-[#D97706] font-bold">PENDING CO-SIGN</span>
                )}
              </div>
              <div className="text-[11px] text-[#52525B]">
                {selectedInvoice.buyerAttested
                  ? `Enterprise Buyer (${selectedInvoice.buyerName}) co-signed on-chain. Early settlement rebate active: ${selectedInvoice.buyerRebateBps} bps.`
                  : `Waiting for enterprise keypair attestation. Co-signing will reduce discount rate from 8.5% to 6.5% APR.`}
              </div>
              {!selectedInvoice.buyerAttested && (
                <button
                  onClick={() => onBuyerAttest(selectedInvoice)}
                  className="w-full mt-2 py-1.5 bg-[#0A0A0A] text-white hover:bg-[#27272A] text-[10px] font-bold uppercase tracking-wider"
                >
                  CO-SIGN AS ENTERPRISE BUYER
                </button>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              {selectedInvoice.status === "Draft" && (
                <button
                  onClick={() => onAuditInvoice(selectedInvoice)}
                  className="w-full py-2.5 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                >
                  <Cpu className="w-4 h-4" /> RUN GEMINI MULTIMODAL AUDIT
                </button>
              )}

              {selectedInvoice.status === "Verified" && (
                <button
                  onClick={() => onFundInvoice(selectedInvoice)}
                  className="w-full py-2.5 bg-[#059669] text-white hover:bg-[#047857] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4" /> FUND TRANCHES (eINR DISBURSEMENT)
                </button>
              )}

              {selectedInvoice.status === "Funded" && (
                <button
                  onClick={() => onSettleInvoice(selectedInvoice)}
                  className="w-full py-2.5 bg-[#0A0A0A] text-white hover:bg-[#27272A] font-bold uppercase tracking-wider text-xs"
                >
                  SETTLE INVOICE &amp; APPLY REBATE
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <TokenizeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onTokenize}
      />
    </div>
  );
};
