import React, { useState, useEffect } from "react";
import {
  Wallet,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  Coins,
  History,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { getSolanaExplorerUrl } from "../utils/solana";
import { safeFetch } from "../services/apiClient";

interface CustodialWalletData {
  id: string;
  userId: string;
  publicAddress: string;
  network: string;
  balanceSol: number;
  status: string;
  createdAt: string;
}

interface WalletTxRecord {
  id: string;
  transactionSignature: string;
  transactionType: string;
  status: string;
  explorerUrl: string;
  createdAt: string;
}

export const CustodialWalletView: React.FC = () => {
  const [wallet, setWallet] = useState<CustodialWalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTxRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAirdropping, setIsAirdropping] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchWallet = async () => {
    setIsRefreshing(true);
    try {
      const res = await safeFetch("/api/wallet");
      if (res.ok && res.data.success && res.data.wallet) {
        setWallet(res.data.wallet);
      }
    } catch (err: any) {
      console.warn("Failed to fetch custodial wallet:", err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await safeFetch("/api/wallet/transactions");
      if (res.ok && res.data.success && Array.isArray(res.data.transactions)) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.warn("Failed to fetch wallet transactions:", err);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  const handleCopyAddress = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.publicAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAirdrop = async () => {
    if (isAirdropping) return;
    setIsAirdropping(true);
    setMessage(null);

    try {
      const res = await safeFetch("/api/wallet/airdrop", {
        method: "POST",
        body: JSON.stringify({ amountSol: 1.0 }),
      });

      if (res.ok && res.data.success) {
        setMessage({
          type: "success",
          text: `Successfully requested Devnet SOL airdrop! Signature: ${(res.data.signature || "").slice(0, 16)}...`,
        });
        await fetchWallet();
        await fetchTransactions();
      } else {
        setMessage({
          type: "error",
          text: res.data?.error || "Devnet SOL faucet rate-limited. Please retry or visit faucet.solana.com",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to request Devnet SOL airdrop",
      });
    } finally {
      setIsAirdropping(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs space-y-3">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#2563EB]" />
        <div>Loading Custodial Solana Devnet Wallet...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Header Card */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-[11px] uppercase text-[#71717A] tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
              SECURE CUSTODIAL KEYPAIR // DEVNET ONLY
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] mt-1">
              Custodial Solana Wallet
            </h2>
            <p className="text-xs text-[#52525B] font-sans mt-1">
              Server-side encrypted Solana keypair for automated Devnet invoice anchoring, tokenization, and fractional financing.
            </p>
          </div>

          <span className="px-3 py-1.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-bold uppercase tracking-wider self-start md:self-auto flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> SOLANA DEVNET ACTIVE
          </span>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mt-4 p-3 border text-xs flex items-center justify-between font-sans ${
              message.type === "success"
                ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]"
                : "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-mono font-bold text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Main Wallet Card Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Address & Network Info */}
          <div className="md:col-span-7 bg-[#FAFAFA] border border-[#E4E4E7] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                  CUSTODIAL WALLET PUBLIC ADDRESS
                </span>
                <span className="text-[10px] bg-[#E4E4E7] text-[#0A0A0A] px-2 py-0.5 font-bold uppercase">
                  {wallet?.network || "SOLANA DEVNET"}
                </span>
              </div>

              <div className="p-3 bg-white border border-[#0A0A0A] font-mono text-xs font-bold text-[#0A0A0A] flex items-center justify-between gap-2 break-all">
                <span>{wallet?.publicAddress}</span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] border border-[#E4E4E7] shrink-0 transition-all"
                  title="Copy Public Address"
                >
                  {copied ? <Check className="w-4 h-4 text-[#059669]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E4E4E7]">
              <button
                onClick={fetchWallet}
                disabled={isRefreshing}
                className="py-2 px-3 bg-white hover:bg-[#F4F4F5] border border-[#0A0A0A] text-[#0A0A0A] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh Balance
              </button>

              <a
                href={`https://explorer.solana.com/address/${wallet?.publicAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] text-[#52525B] hover:text-[#0A0A0A] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5"
              >
                View on Explorer <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Balance & Airdrop Panel */}
          <div className="md:col-span-5 bg-[#0A0A0A] text-white p-5 space-y-4 flex flex-col justify-between shadow-md">
            <div>
              <div className="text-[10px] text-[#A1A1AA] uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#059669]" /> REAL DEVNET SOL BALANCE
              </div>
              <div className="text-3xl font-extrabold tracking-tight font-mono mt-2 text-white">
                {wallet?.balanceSol.toFixed(4)} <span className="text-sm font-normal text-[#A1A1AA]">SOL</span>
              </div>
              <div className="text-[10px] text-[#71717A] font-sans mt-1">
                Used exclusively for Solana Devnet transaction gas fees and on-chain anchoring.
              </div>
            </div>

            <button
              onClick={handleAirdrop}
              disabled={isAirdropping}
              className={`w-full py-3 px-4 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${
                isAirdropping
                  ? "bg-[#52525B] text-white cursor-not-allowed"
                  : "bg-[#059669] hover:bg-[#047857] text-white"
              }`}
            >
              {isAirdropping ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> REQUESTING FAUCET SOL...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> GET FREE DEVNET SOL (AIRDROP)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security & Disclaimer */}
        <div className="mt-5 p-3 bg-[#F8F9FA] border border-[#E4E4E7] text-[10px] text-[#71717A] flex items-center justify-between gap-2 font-sans">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669] shrink-0" />
            Private key is encrypted with AES-256-GCM and stored securely on backend. It is never exposed to client side.
          </span>
          <span className="font-mono text-[9px] uppercase font-bold text-[#A1A1AA]">
            DEVNET TESTNET ONLY // NO REAL ASSETS
          </span>
        </div>
      </div>

      {/* Custodial Wallet Transactions Table */}
      <div className="border border-[#0A0A0A] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
          <div className="font-extrabold text-[#0A0A0A] text-sm uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-[#2563EB]" /> CUSTODIAL BLOCKCHAIN TRANSACTIONS
          </div>
          <span className="text-[10px] text-[#71717A] uppercase font-bold">
            {transactions.length} DEVNET RECORDS
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="bg-[#F4F4F5] border-b border-[#0A0A0A] text-[10px] text-[#71717A] uppercase">
                  <th className="p-3">DATE / TIME</th>
                  <th className="p-3">TYPE</th>
                  <th className="p-3">REAL TRANSACTION SIGNATURE</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-right">EXPLORER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAFAFA] transition-all">
                    <td className="p-3 text-[#52525B]">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[9px] font-bold uppercase">
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#0A0A0A] max-w-[220px] truncate">
                      {tx.transactionSignature}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                          tx.status === "VERIFIED"
                            ? "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                            : "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={tx.explorerUrl || getSolanaExplorerUrl(tx.transactionSignature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0A0A0A] hover:bg-[#27272A] text-white font-bold text-[10px] uppercase tracking-wider"
                      >
                        SOLANA EXPLORER <ArrowUpRight className="w-3 h-3 text-[#059669]" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-[#71717A] font-sans space-y-2">
            <Clock className="w-8 h-8 mx-auto text-[#A1A1AA]" />
            <div className="font-bold text-[#0A0A0A] font-mono text-xs">NO DEVNET TRANSACTIONS YET</div>
            <p className="text-xs max-w-sm mx-auto">
              Transactions will automatically appear here when you tokenize invoices or execute fractional financing investments on Solana Devnet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
