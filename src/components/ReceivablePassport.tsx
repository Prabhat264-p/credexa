import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, Copy, Check, Lock, Cpu } from "lucide-react";
import { ReceivablePassportData } from "../services/receivablePassportService";

interface ReceivablePassportProps {
  passport: ReceivablePassportData;
}

export const ReceivablePassport: React.FC<ReceivablePassportProps> = ({ passport }) => {
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHash = () => {
    if (passport.evidenceHash) {
      navigator.clipboard.writeText(passport.evidenceHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-[#111111] rounded-lg shadow-sm p-5 font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#111111]">
            Credexa Receivable Passport
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#111111] text-white">
          TRUST SUMMARY
        </span>
      </div>

      {/* Basic Info Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAFAFA] p-3 rounded-md border border-[#E5E5E5] text-xs font-mono">
        <div>
          <span className="text-[10px] uppercase text-[#888888]">Invoice</span>
          <div className="font-bold text-[#111111]">{passport.invoiceNumber}</div>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[#888888]">Seller</span>
          <div className="font-bold text-[#111111] truncate">{passport.sellerName}</div>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[#888888]">Buyer</span>
          <div className="font-bold text-[#111111] truncate">{passport.buyerName}</div>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[#888888]">Face Value</span>
          <div className="font-bold text-[#2563EB]">₹{passport.faceValueInr.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Main Grid: Verification Checklist & Underwriting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Left: Verification Checklist */}
        <div className="border border-[#E5E5E5] rounded-md p-3 space-y-2 bg-white">
          <div className="font-bold text-[#111111] text-[11px] uppercase border-b border-[#E5E5E5] pb-1.5 flex items-center justify-between">
            <span>Verification Checklist</span>
            <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <ul className="space-y-1.5 text-[11px]">
            <li className="flex items-center justify-between text-[#16A34A]">
              <span>✓ Invoice Registered</span>
              <span className="font-bold">PASSED</span>
            </li>
            <li className="flex items-center justify-between text-[#16A34A]">
              <span>✓ Risk Assessment</span>
              <span className="font-bold">{passport.riskLevel} RISK</span>
            </li>
            <li className={`flex items-center justify-between ${passport.verification.oracleAttested ? "text-[#16A34A]" : "text-[#D97706]"}`}>
              <span>{passport.verification.oracleAttested ? "✓ Oracle Attestation" : "○ Oracle Attestation"}</span>
              <span className="font-bold">{passport.verification.oracleAttested ? "VERIFIED" : "PENDING"}</span>
            </li>
            <li className={`flex items-center justify-between ${passport.verification.buyerConfirmed ? "text-[#16A34A]" : "text-[#D97706]"}`}>
              <span>{passport.verification.buyerConfirmed ? "✓ Buyer Confirmation" : "○ Buyer Confirmation"}</span>
              <span className="font-bold">{passport.verification.buyerConfirmed ? "CONFIRMED" : "PENDING"}</span>
            </li>
            <li className="flex items-center justify-between text-[#16A34A]">
              <span>✓ Canonical Evidence Hash</span>
              <span className="font-bold">GENERATED</span>
            </li>
            <li className={`flex items-center justify-between ${passport.verification.token2022Minted ? "text-[#16A34A]" : "text-[#D97706]"}`}>
              <span>{passport.verification.token2022Minted ? "✓ Token-2022 Mint" : "○ Token-2022 Mint"}</span>
              <span className="font-bold">{passport.verification.token2022Minted ? "MINTED" : "UNMINTED"}</span>
            </li>
          </ul>
        </div>

        {/* Right: Financing Underwriting */}
        <div className="border border-[#E5E5E5] rounded-md p-3 space-y-2 bg-white flex flex-col justify-between">
          <div>
            <div className="font-bold text-[#111111] text-[11px] uppercase border-b border-[#E5E5E5] pb-1.5 flex items-center justify-between">
              <span>Underwriting Terms</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${passport.riskLevel === "LOW" ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FEF2F2] text-[#E53935]"}`}>
                {passport.riskLevel} RISK
              </span>
            </div>
            <div className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#666666]">Recommended Advance:</span>
                <span className="font-bold text-[#111111]">{passport.recommendedAdvancePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Maximum Financing:</span>
                <span className="font-bold text-[#2563EB]">₹{passport.maximumFinancingInr.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Token Standard:</span>
                <span className="font-bold text-[#111111]">Solana Token-2022</span>
              </div>
            </div>
          </div>

          <div className={`p-2.5 rounded-md text-center font-bold text-xs ${
            passport.eligible 
              ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]" 
              : "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]"
          }`}>
            {passport.statusLabel}
          </div>
        </div>
      </div>

      {/* Blockchain Evidence & Hash Details */}
      <div className="border-t border-[#E5E5E5] pt-3 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-[#555555]">
          <span>Canonical Evidence SHA-256 Hash:</span>
          <button
            onClick={handleCopyHash}
            className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 font-bold"
          >
            {copiedHash ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
            <span>{copiedHash ? "Copied" : "Copy Hash"}</span>
          </button>
        </div>
        <div className="p-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded font-mono text-[10px] break-all text-[#333333]">
          {passport.evidenceHash}
        </div>

        {passport.explorerUrl && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#666666]">Solana Devnet Anchor Transaction:</span>
            <a
              href={passport.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
            >
              <span>View Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
