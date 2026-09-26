import React, { useState, useEffect } from "react";
import {
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Wallet,
  DollarSign,
  TrendingUp,
  Coins,
  Clock,
} from "lucide-react";
import { InvoiceRecord, InvestmentRecord } from "../types";
import { SolanaWalletButton } from "./SolanaWalletButton";
import { InvestModal } from "./InvestModal";
import { safeFetch } from "../services/apiClient";
import { WalletConnectionState } from "../utils/solana";

interface InvestorDashboardViewProps {
  invoices: InvoiceRecord[];
  onRefreshData: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const InvestorDashboardView: React.FC<InvestorDashboardViewProps> = ({
  invoices,
  onRefreshData,
  onNavigateTab,
}) => {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState<boolean>(false);
  const [walletState, setWalletState] = useState<WalletConnectionState>({
    connected: false,
    publicKey: null,
    balanceSol: 0,
    network: "Solana Devnet",
    error: null,
  });

  const fetchMyInvestments = async () => {
    setLoading(true);
    try {
      const res = await safeFetch("/api/investments");
      if (res.ok && res.data.success && Array.isArray(res.data.investments)) {
        setInvestments(res.data.investments);
      }
    } catch (err) {
      console.warn("Failed to fetch investments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInvestments();
  }, []);

  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amountInr || 0), 0);
  const activeInvestments = investments.filter((i) => i.status === "CONFIRMED");
  const repaidInvestments = investments.filter((i) => i.status === "REPAID");
  const totalRepaid = repaidInvestments.reduce((sum, i) => sum + (i.repaymentAmount || i.amountInr * 1.085), 0);

  const handleOpenInvest = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setIsInvestModalOpen(true);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner & Wallet Bar */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-[11px] uppercase text-[#71717A] font-bold tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
              INVESTOR PORTFOLIO // SOLANA DEVNET
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] mt-1">
              My Investment Portfolio
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchMyInvestments();
                onRefreshData();
              }}
              className="px-3 py-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] border border-[#0A0A0A] font-bold text-xs uppercase flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> REFRESH
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 text-xs text-[#52525B] font-sans leading-relaxed">
            Manage your direct invoice investment positions. Each investment represents a direct fractional claim backed by a verified B2B invoice on Solana Devnet.
          </div>
          <div className="md:col-span-4">
            <SolanaWalletButton onWalletStateChange={setWalletState} />
          </div>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-[#E4E4E7] bg-white p-4 space-y-1">
          <div className="text-[10px] text-[#71717A] uppercase font-bold">TOTAL CAPITAL INVESTED</div>
          <div className="text-xl font-extrabold text-[#2563EB]">₹{totalInvested.toLocaleString("en-IN")}</div>
        </div>

        <div className="border border-[#E4E4E7] bg-white p-4 space-y-1">
          <div className="text-[10px] text-[#71717A] uppercase font-bold">ACTIVE POSITIONS</div>
          <div className="text-xl font-extrabold text-[#111111]">{activeInvestments.length}</div>
        </div>

        <div className="border border-[#E4E4E7] bg-white p-4 space-y-1">
          <div className="text-[10px] text-[#71717A] uppercase font-bold">REPAID POSITIONS</div>
          <div className="text-xl font-extrabold text-[#16A34A]">{repaidInvestments.length}</div>
        </div>

        <div className="border border-[#E4E4E7] bg-white p-4 space-y-1">
          <div className="text-[10px] text-[#71717A] uppercase font-bold">TOTAL REPAID AMOUNT</div>
          <div className="text-xl font-extrabold text-[#16A34A]">₹{Math.round(totalRepaid).toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* My Investments Table */}
      <div className="border border-[#0A0A0A] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[#0A0A0A]">
            <Coins className="w-5 h-5 text-[#2563EB]" />
            <span>MY DIRECT INVESTMENT POSITIONS</span>
          </div>
          <span className="text-[10px] text-[#71717A] uppercase font-bold">
            {investments.length} Positions
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#71717A]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2563EB]" />
            Loading investment portfolio...
          </div>
        ) : investments.length === 0 ? (
          <div className="p-8 text-center text-[#71717A] space-y-2">
            <div>No investment positions found for your account.</div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("fractional")}
                className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-[4px]"
              >
                Browse Invoice Marketplace
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[10px] text-[#71717A] uppercase">
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Seller / Buyer</th>
                  <th className="p-3">Amount Invested</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Expected Repayment</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Blockchain Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-xs">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAFAFA]">
                    <td className="p-3 font-bold text-[#111111]">{inv.invoiceNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-[#111111]">{inv.sellerName}</div>
                      <div className="text-[10px] text-[#71717A]">Buyer: {inv.buyerName}</div>
                    </td>
                    <td className="p-3 font-bold text-[#2563EB]">₹{(inv.amountInr || 0).toLocaleString("en-IN")}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                          inv.status === "REPAID"
                            ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]"
                            : inv.status === "CONFIRMED"
                            ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                            : "bg-[#FAFAFA] text-[#71717A] border border-[#E5E5E5]"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#16A34A]">
                      ₹{(inv.repaymentAmount || Math.round((inv.amountInr || 0) * 1.085)).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 font-mono text-[#52525B]">{inv.dueDate || "2026-11-30"}</td>
                    <td className="p-3 text-right">
                      {inv.solanaTxSignature ? (
                        <a
                          href={inv.explorerUrl || `https://explorer.solana.com/tx/${inv.solanaTxSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-bold text-[11px]"
                        >
                          <span>{inv.solanaTxSignature.slice(0, 12)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[#71717A]">On-Chain</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Marketplace Invoices Quick Access */}
      <div className="border border-[#0A0A0A] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[#0A0A0A]">
            <TrendingUp className="w-5 h-5 text-[#16A34A]" />
            <span>OPEN INVOICE FINANCING OPPORTUNITIES</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices
            .filter((inv) => inv.status !== "REPAID")
            .slice(0, 3)
            .map((inv) => {
              const maxRate = (inv.advanceRatePct || 85) / 100;
              const target = inv.faceValueInr * maxRate;
              const funded = inv.fundedAmountInr || 0;
              const remaining = Math.max(0, target - funded);

              return (
                <div key={inv.id} className="border border-[#E4E4E7] bg-white p-4 space-y-3 rounded-[6px]">
                  <div className="flex justify-between items-center border-b border-[#E4E4E7] pb-2">
                    <span className="font-bold text-[#111111]">{inv.invoiceNumber}</span>
                    <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[9px] font-bold rounded uppercase">
                      {inv.riskTier || "VERIFIED"}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <div>Seller: <strong>{inv.sellerName}</strong></div>
                    <div>Buyer: <strong>{inv.buyerName}</strong></div>
                    <div className="flex justify-between pt-1">
                      <span>Face Value:</span>
                      <strong className="text-[#111111]">₹{inv.faceValueInr.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Capacity:</span>
                      <strong className="text-[#D97706]">₹{remaining.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenInvest(inv)}
                    disabled={remaining === 0}
                    className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-[4px] text-xs uppercase"
                  >
                    {remaining === 0 ? "Fully Funded" : "Invest Now"}
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      <InvestModal
        isOpen={isInvestModalOpen}
        onClose={() => {
          setIsInvestModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSuccess={() => {
          fetchMyInvestments();
          onRefreshData();
        }}
      />
    </div>
  );
};
