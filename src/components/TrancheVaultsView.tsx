import React, { useState, useEffect } from "react";
import {
  Layers,
  ShieldCheck,
  Zap,
  Coins,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  Lock,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { safeFetch } from "../services/apiClient";
import { InvestModal } from "./InvestModal";

interface TrancheVaultsViewProps {
  pools?: any[];
  insuranceReserveBalance?: number;
}

export const TrancheVaultsView: React.FC<TrancheVaultsViewProps> = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState<boolean>(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await safeFetch("/api/financing/opportunities");
      if (res.ok && res.data.success && Array.isArray(res.data.opportunities)) {
        setInvoices(res.data.opportunities);
      }
    } catch (err) {
      console.warn("Failed to fetch opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleInvest = (inv: any) => {
    setSelectedInvoice(inv);
    setIsInvestModalOpen(true);
  };

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Top Banner */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-xs uppercase text-[#71717A] tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
              DIRECT FRACTIONAL INVOICE FINANCING
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] mt-1">
              Direct Invoice Investment Positions
            </h2>
          </div>
          <div className="text-right">
            <button
              onClick={fetchInvoices}
              className="px-3 py-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] border border-[#0A0A0A] font-bold text-xs uppercase flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> REFRESH
            </button>
          </div>
        </div>

        <p className="text-xs text-[#52525B] max-w-3xl pt-3 leading-relaxed font-sans">
          Credexa allows individual wallet owners to fund specific verified invoices directly. Each investment position is backed directly by the underlying B2B invoice asset, with no common pool or tokenized LP intermediaries.
        </p>
      </div>

      {/* Available Verified Invoices Table */}
      <div className="border border-[#0A0A0A] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[#0A0A0A]">
            <Coins className="w-5 h-5 text-[#2563EB]" />
            <span>AVAILABLE VERIFIED INVOICES</span>
          </div>
          <span className="text-[10px] text-[#71717A] uppercase font-bold">
            {invoices.length} Verified Assets
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#71717A]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2563EB]" />
            Loading opportunities...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-[#71717A]">No verified invoices currently listed for financing.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[10px] text-[#71717A] uppercase">
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Seller / Buyer</th>
                  <th className="p-3">Face Value</th>
                  <th className="p-3">Financing Target</th>
                  <th className="p-3">Funded</th>
                  <th className="p-3">Remaining</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-xs">
                {invoices.map((inv) => {
                  const maxRate = (inv.advanceRatePct || 85) / 100;
                  const target = inv.financingTargetInr || Math.round(inv.faceValueInr * maxRate);
                  const funded = inv.fundedAmountInr || 0;
                  const remaining = Math.max(0, target - funded);
                  const isFullyFunded = remaining === 0;

                  return (
                    <tr key={inv.id} className="hover:bg-[#FAFAFA]">
                      <td className="p-3 font-bold text-[#111111]">{inv.invoiceNumber}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#111111]">{inv.sellerName}</div>
                        <div className="text-[10px] text-[#71717A]">Buyer: {inv.buyerName}</div>
                      </td>
                      <td className="p-3 font-bold text-[#111111]">₹{inv.faceValueInr.toLocaleString("en-IN")}</td>
                      <td className="p-3 font-bold text-[#2563EB]">₹{target.toLocaleString("en-IN")}</td>
                      <td className="p-3 font-semibold text-[#16A34A]">₹{funded.toLocaleString("en-IN")}</td>
                      <td className="p-3 font-bold text-[#D97706]">₹{remaining.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleInvest(inv)}
                          disabled={isFullyFunded}
                          className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold text-xs rounded-[4px]"
                        >
                          {isFullyFunded ? "Fully Funded" : "Invest Now"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvestModal
        isOpen={isInvestModalOpen}
        onClose={() => {
          setIsInvestModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSuccess={fetchInvoices}
      />
    </div>
  );
};
