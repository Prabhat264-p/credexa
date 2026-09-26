import React, { useState, useEffect } from "react";
import {
  PieChart,
  DollarSign,
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  Layers,
  Building2,
  FileText,
  X,
  Coins,
} from "lucide-react";
import { safeFetch } from "../services/apiClient";
import { InvestModal } from "./InvestModal";

export interface FinancingOpportunity {
  id: string;
  invoiceNumber: string;
  sellerName: string;
  sellerGstin: string;
  buyerName: string;
  buyerGstin: string;
  faceValueInr: number;
  fundedAmountInr: number;
  remainingAmountInr: number;
  fundingPercentage: number;
  financerCount: number;
  financingStatus: "OPEN" | "PARTIALLY_FUNDED" | "FULLY_FUNDED";
  tenureDays: number;
  discountRateBps: number;
  riskTier: string;
  status: string;
  investments?: Array<{
    id: string;
    amount: number;
    tranche: string;
    financer: { name: string; organizationName?: string };
    createdAt: string;
  }>;
}

export const FractionalFinancingView: React.FC<{
  onNavigateTab?: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  const [opportunities, setOpportunities] = useState<FinancingOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState<boolean>(false);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await safeFetch("/api/financing/opportunities");
      if (res.ok && res.data.success && Array.isArray(res.data.opportunities)) {
        setOpportunities(res.data.opportunities);
      }
    } catch (err) {
      console.warn("Failed to fetch opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleOpenInvest = (opp: FinancingOpportunity) => {
    setSelectedInvoice(opp);
    setIsInvestModalOpen(true);
  };

  if (loading) {
    return (
      <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs space-y-3">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#2563EB]" />
        <div>Loading Direct Invoice Financing Opportunities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Top Header Card */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-[11px] uppercase text-[#71717A] tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
              DIRECT INVOICE FINANCING MARKETPLACE
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] mt-1">
              Invest in Verified Invoices
            </h2>
            <p className="text-xs text-[#52525B] font-sans mt-1">
              Invest directly into verified enterprise MSME invoices with fractional individual wallet allocations on Solana Devnet.
            </p>
          </div>

          <button
            onClick={fetchOpportunities}
            className="py-2 px-3 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] border border-[#0A0A0A] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> REFRESH MARKETPLACE
          </button>
        </div>

        {/* Opportunities Metrics Overview Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#FAFAFA] p-3 border border-[#E4E4E7]">
            <div className="text-[10px] text-[#71717A] uppercase font-bold">ACTIVE INVOICES</div>
            <div className="text-xl font-extrabold text-[#0A0A0A] mt-0.5">{opportunities.length}</div>
          </div>
          <div className="bg-[#FAFAFA] p-3 border border-[#E4E4E7]">
            <div className="text-[10px] text-[#71717A] uppercase font-bold">TOTAL MARKETPLACE VALUE</div>
            <div className="text-xl font-extrabold text-[#059669] mt-0.5">
              ₹
              {opportunities
                .reduce((sum, o) => sum + o.faceValueInr, 0)
                .toLocaleString("en-IN")}
            </div>
          </div>
          <div className="bg-[#FAFAFA] p-3 border border-[#E4E4E7]">
            <div className="text-[10px] text-[#71717A] uppercase font-bold">TOTAL INVESTED LIQUIDITY</div>
            <div className="text-xl font-extrabold text-[#2563EB] mt-0.5">
              ₹
              {opportunities
                .reduce((sum, o) => sum + o.fundedAmountInr, 0)
                .toLocaleString("en-IN")}
            </div>
          </div>
          <div className="bg-[#FAFAFA] p-3 border border-[#E4E4E7]">
            <div className="text-[10px] text-[#71717A] uppercase font-bold">REMAINING FUNDING CAPACITY</div>
            <div className="text-xl font-extrabold text-[#D97706] mt-0.5">
              ₹
              {opportunities
                .reduce((sum, o) => sum + o.remainingAmountInr, 0)
                .toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Opportunities Marketplace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities.map((opp) => {
          const isFullyFunded = opp.remainingAmountInr === 0 || opp.financingStatus === "FULLY_FUNDED";
          return (
            <div
              key={opp.id}
              className={`border-2 bg-white p-5 space-y-4 flex flex-col justify-between transition-all ${
                isFullyFunded ? "border-[#E4E4E7] opacity-80" : "border-[#0A0A0A] hover:shadow-lg"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
                  <span className="font-extrabold text-[#0A0A0A] text-sm">{opp.invoiceNumber}</span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                      isFullyFunded
                        ? "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                        : opp.fundedAmountInr > 0
                        ? "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]"
                        : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                    }`}
                  >
                    {isFullyFunded ? "FULLY FUNDED" : opp.fundedAmountInr > 0 ? "PARTIALLY FUNDED" : "OPEN FOR FUNDING"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#0A0A0A] flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#71717A] shrink-0" /> {opp.sellerName}
                  </div>
                  <div className="text-[10px] text-[#71717A] font-sans">
                    Buyer: <strong>{opp.buyerName}</strong>
                  </div>
                </div>

                {/* Face Value & Progress */}
                <div className="bg-[#FAFAFA] p-3 border border-[#E4E4E7] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#71717A] font-bold">FACE VALUE</span>
                    <span className="font-extrabold text-sm text-[#0A0A0A]">
                      ₹{opp.faceValueInr.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#059669] font-bold">
                      Funded: ₹{opp.fundedAmountInr.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[#DC2626] font-bold">
                      Remaining: ₹{opp.remainingAmountInr.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#E4E4E7] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isFullyFunded ? "bg-[#059669]" : "bg-[#2563EB]"
                      }`}
                      style={{ width: `${opp.fundingPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-[#71717A]">
                    <span>{opp.fundingPercentage}% FUNDED</span>
                    <span>{opp.financerCount} FINANCER(S)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-[#52525B]">
                  <div className="bg-white p-2 border border-[#E4E4E7]">
                    <div>TENURE</div>
                    <div className="font-bold text-[#0A0A0A]">{opp.tenureDays} Days</div>
                  </div>
                  <div className="bg-white p-2 border border-[#E4E4E7]">
                    <div>DISCOUNT RATE</div>
                    <div className="font-bold text-[#059669]">{(opp.discountRateBps / 100).toFixed(2)}% p.a.</div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleOpenInvest(opp)}
                  disabled={isFullyFunded}
                  className={`w-full py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    isFullyFunded
                      ? "bg-[#E4E4E7] text-[#71717A] cursor-not-allowed border border-[#A1A1AA]"
                      : "bg-[#0A0A0A] hover:bg-[#27272A] text-white shadow-sm"
                  }`}
                >
                  {isFullyFunded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#059669]" /> 100% FULLY FUNDED
                    </>
                  ) : (
                    <>
                      FINANCE THIS INVOICE <ArrowRight className="w-4 h-4 text-[#059669]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DIRECT INVOICE FINANCING MODAL */}
      <InvestModal
        isOpen={isInvestModalOpen}
        onClose={() => {
          setIsInvestModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSuccess={fetchOpportunities}
      />
    </div>
  );
};
