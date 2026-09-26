import React from "react";
import { Layers, ShieldCheck, AlertCircle } from "lucide-react";

interface FinancingWaterfallProps {
  totalFinancingInr: number;
  seniorInr: number;
  juniorInr: number;
}

export const FinancingWaterfall: React.FC<FinancingWaterfallProps> = ({
  totalFinancingInr,
  seniorInr,
  juniorInr,
}) => {
  const seniorPct = 80;
  const juniorPct = 20;

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 font-sans space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#2563EB]" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#111111]">
            Senior / Junior Capital Waterfall
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#888888]">DEMO FINANCING STRUCTURE</span>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {/* Total Financing Bar */}
        <div className="flex items-center justify-between p-2.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-md font-bold text-[#111111]">
          <span>Maximum Eligible Financing</span>
          <span className="text-[#2563EB]">₹{totalFinancingInr.toLocaleString("en-IN")}</span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-4 bg-[#E5E5E5] rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[#2563EB] flex items-center justify-center text-[9px] font-bold text-white"
            style={{ width: `${seniorPct}%` }}
          >
            Senior 80%
          </div>
          <div
            className="h-full bg-[#D97706] flex items-center justify-center text-[9px] font-bold text-white"
            style={{ width: `${juniorPct}%` }}
          >
            Junior 20%
          </div>
        </div>

        {/* Tranche Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Senior Tranche */}
          <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md space-y-1">
            <div className="flex items-center justify-between font-bold text-[#2563EB]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Senior Tranche (80%)
              </span>
              <span>₹{seniorInr.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-[11px] text-[#555555] font-sans">
              <strong>Priority Repayment:</strong> Low volatility, senior claim on buyer settlement cash flows.
            </p>
          </div>

          {/* Junior Tranche */}
          <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-1">
            <div className="flex items-center justify-between font-bold text-[#D97706]">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Junior Tranche (20%)
              </span>
              <span>₹{juniorInr.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-[11px] text-[#555555] font-sans">
              <strong>First-Loss Buffer:</strong> Subordinated yield tranche absorbing initial default risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
