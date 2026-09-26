import React, { useState } from "react";
import {
  TrendingUp,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Scale,
  Zap,
} from "lucide-react";
import { InvoiceRecord } from "../types";

interface OverviewViewProps {
  invoices: InvoiceRecord[];
  onNavigate: (tabId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ invoices, onNavigate }) => {
  const [calculatorInvoiceValue, setCalculatorInvoiceValue] = useState<number>(5000000); // 50 Lakhs
  const [calculatorTenureDays, setCalculatorTenureDays] = useState<number>(90);
  const [buyerCoSigned, setBuyerCoSigned] = useState<boolean>(true);

  // Math for calculator
  const baseDiscountRate = 8.5; // 8.5%
  const effectiveDiscountRate = buyerCoSigned ? baseDiscountRate - 2.0 : baseDiscountRate;
  const advanceRate = 0.85; // 85%
  const advanceAmount = calculatorInvoiceValue * advanceRate;
  const financeCost = (advanceAmount * (effectiveDiscountRate / 100) * (calculatorTenureDays / 365));
  const netDisbursed = advanceAmount - financeCost;
  const traditionalDelayCost = calculatorInvoiceValue * 0.045; // 4.5% opportunity cost of locked capital for 90 days
  const netWorkingCapitalGain = traditionalDelayCost - financeCost;

  return (
    <div className="space-y-8">
      {/* Top Banner: Swiss Problem & Solution Statement */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#71717A] uppercase">
              <span className="w-2 h-2 bg-[#DC2626]"></span>
              INDIAN MSME WORKING CAPITAL CRISIS // STRUCTURAL RESOLUTION
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0A0A0A] leading-tight">
              Eliminating the 90–120 day enterprise payment delay for Indian MSMEs via Solana Token-2022 & Gemini AI.
            </h2>
            <p className="text-base text-[#52525B] max-w-3xl leading-relaxed">
              Credexa tokenizes verified B2B receivables into SPL Token-2022 digital assets, cross-audits Indian e-way bills and GST filings through a Gemini Multimodal Oracle, and unlocks instant liquidity via segregated Senior and Junior first-loss tranches—denominated strictly in an INR-pegged stablecoin (eINR).
            </p>
          </div>

          <div className="lg:col-span-4 border-l-0 lg:border-l border-[#E4E4E7] lg:pl-8 space-y-4 font-mono text-xs">
            <div className="border-b border-[#E4E4E7] pb-3">
              <div className="text-[#71717A] uppercase text-[10px]">RBI MSME DELAY ESTIMATE</div>
              <div className="text-xl font-bold text-[#DC2626]">₹10.7 Lakh Crore ($130B)</div>
              <div className="text-[10px] text-[#71717A]">Unpaid receivables past 45-day MSMED Act limit</div>
            </div>
            <div className="border-b border-[#E4E4E7] pb-3">
              <div className="text-[#71717A] uppercase text-[10px]">CREDEXA SETTLEMENT SPEED</div>
              <div className="text-xl font-bold text-[#059669]">&lt; 400 Milliseconds</div>
              <div className="text-[10px] text-[#71717A]">Solana confirmation with instant eINR deposit</div>
            </div>
            <div>
              <div className="text-[#71717A] uppercase text-[10px]">FX RISK EXPOSURE</div>
              <div className="text-xl font-bold text-[#0A0A0A]">0.00% (eINR Local Peg)</div>
              <div className="text-[10px] text-[#71717A]">Completely shielded from USD/crypto volatility</div>
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric Mathematical Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#0A0A0A] border border-[#0A0A0A]">
        {/* Metric 1 */}
        <div className="bg-white p-6 space-y-2">
          <div className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider flex items-center justify-between">
            <span>01 // TOTAL VOLUME</span>
            <span className="w-1.5 h-1.5 bg-[#0A0A0A]"></span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#0A0A0A]">₹38,45,00,000</div>
          <div className="text-xs text-[#52525B]">
            Cumulative tokenized invoices across 142 Indian industrial clusters.
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 space-y-2">
          <div className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider flex items-center justify-between">
            <span>02 // TRANCHE DISTRIBUTION</span>
            <span className="w-1.5 h-1.5 bg-[#2563EB]"></span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#2563EB]">
            73.3% <span className="text-base text-[#71717A] font-normal font-sans">SNR</span> / 26.7% <span className="text-base text-[#71717A] font-normal font-sans">JNR</span>
          </div>
          <div className="text-xs text-[#52525B]">
            Direct fractional financing backed by verified B2B invoice positions.
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 space-y-2">
          <div className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider flex items-center justify-between">
            <span>03 // INSURANCE RESERVE</span>
            <span className="w-1.5 h-1.5 bg-[#059669]"></span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#059669]">₹1,48,50,000</div>
          <div className="text-xs text-[#52525B]">
            Protocol fee reserve PDA covering systemic enterprise tail risk.
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 space-y-2">
          <div className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider flex items-center justify-between">
            <span>04 // DEFAULT TRACK RECORD</span>
            <span className="w-1.5 h-1.5 bg-[#059669]"></span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#0A0A0A]">0.42%</div>
          <div className="text-xs text-[#059669] font-medium">
            100% Senior Tranche principal preservation since inception.
          </div>
        </div>
      </div>

      {/* Protocol Architecture: 6-Step End-to-End Pipeline */}
      <div className="border border-[#E4E4E7] bg-white p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-xs font-mono uppercase text-[#71717A] tracking-wider">
              SYSTEM MECHANICS // DETERMINISTIC FINANCING CYCLE
            </div>
            <h3 className="text-xl font-bold text-[#0A0A0A] font-mono mt-1">
              End-to-End Protocol Architecture
            </h3>
          </div>
          <button
            onClick={() => onNavigate("contracts")}
            className="px-4 py-2 text-xs font-mono font-semibold bg-[#0A0A0A] text-white hover:bg-[#27272A] transition-colors self-start md:self-auto flex items-center gap-2"
          >
            VIEW ANCHOR RUST SOURCE <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
          {/* Step 1 */}
          <div className="border border-[#E4E4E7] p-5 space-y-3 bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 bg-[#0A0A0A] text-white">STEP 01</span>
              <span className="text-[11px] text-[#71717A]">TOKEN-2022</span>
            </div>
            <div className="font-bold text-sm text-[#0A0A0A]">Invoice Tokenization</div>
            <p className="text-xs text-[#52525B] font-sans leading-relaxed">
              MSME issues an SPL Token-2022 digital receivable. Metadata extensions embed the legally binding irrevocable debt assignment, IRN hash, HSN codes, and GSTINs.
            </p>
            <div className="text-[10px] text-[#71717A] pt-2 border-t border-[#E4E4E7]">
              PROGRAM: <code className="text-[#0A0A0A]">tokenize_invoice()</code>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-[#E4E4E7] p-5 space-y-3 bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 bg-[#2563EB] text-white">STEP 02</span>
              <span className="text-[11px] text-[#71717A]">GEMINI 3.8 FLASH</span>
            </div>
            <div className="font-bold text-sm text-[#0A0A0A]">Multimodal Credit Oracle</div>
            <p className="text-xs text-[#52525B] font-sans leading-relaxed">
              Gemini audits multi-page e-way bills, GSTR-1/3B filings, and enterprise POs. Outputs strictly typed JSON with authenticity score, risk tier, and Ed25519 signature.
            </p>
            <div className="text-[10px] text-[#71717A] pt-2 border-t border-[#E4E4E7]">
              VERIFICATION: <code className="text-[#0A0A0A]">verify_oracle_evaluation()</code>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-[#E4E4E7] p-5 space-y-3 bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 bg-[#059669] text-white">STEP 03</span>
              <span className="text-[11px] text-[#71717A]">KEYPAIR CO-SIGN</span>
            </div>
            <div className="font-bold text-sm text-[#0A0A0A]">Enterprise Attestation</div>
            <p className="text-xs text-[#52525B] font-sans leading-relaxed">
              Enterprise buyer co-signs the invoice PDA. Unlocks an immediate 200 bps discount reduction and schedules an automated early settlement rebate.
            </p>
            <div className="text-[10px] text-[#71717A] pt-2 border-t border-[#E4E4E7]">
              INCENTIVE: <code className="text-[#059669]">-200 bps APR + Early Rebate</code>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border border-[#E4E4E7] p-5 space-y-3 bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 bg-[#0A0A0A] text-white">STEP 04</span>
              <span className="text-[11px] text-[#71717A]">SPL eINR VAULTS</span>
            </div>
            <div className="font-bold text-sm text-[#0A0A0A]">Multi-Tranche Funding</div>
            <p className="text-xs text-[#52525B] font-sans leading-relaxed">
              Liquidity auto-routed: Senior Vault (80% allocation, protected capital) + Junior Vault (20% allocation, first-loss absorption). Transferable LP tokens minted.
            </p>
            <div className="text-[10px] text-[#71717A] pt-2 border-t border-[#E4E4E7]">
              PROGRAM: <code className="text-[#0A0A0A]">fund_invoice_tranches()</code>
            </div>
          </div>

          {/* Step 5 */}
          <div className="border border-[#E4E4E7] p-5 space-y-3 bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 bg-[#059669] text-white">STEP 05</span>
              <span className="text-[11px] text-[#71717A]">AUTOMATED REBATE</span>
            </div>
            <div className="font-bold text-sm text-[#0A0A0A]">Early Settlement</div>
            <p className="text-xs text-[#52525B] font-sans leading-relaxed">
              Buyer settles invoice before maturity. Early rebate deduction is credited automatically. Waterfall pays Senior Tranche principal + APY first, followed by Junior Tranche.
            </p>
            <div className="text-[10px] text-[#71717A] pt-2 border-t border-[#E4E4E7]">
              WATERFALL: <code className="text-[#0A0A0A]">Senior P+I -&gt; Junior P+I</code>
            </div>
          </div>

          {/* Step 6 */}
          <div className="border border-[#E4E4E7] p-5 space-y-3 bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 bg-[#DC2626] text-white">STEP 06</span>
              <span className="text-[11px] text-[#71717A]">15-DAY BUFFER</span>
            </div>
            <div className="font-bold text-sm text-[#0A0A0A]">Default &amp; Clawback</div>
            <p className="text-xs text-[#52525B] font-sans leading-relaxed">
              If unpaid 15 days past maturity: Recourse mode freezes &amp; liquidates seller collateral. Non-recourse activates Junior buffer &amp; Insurance Reserve. Legal claims assigned.
            </p>
            <div className="text-[10px] text-[#71717A] pt-2 border-t border-[#E4E4E7]">
              TRIGGER: <code className="text-[#DC2626]">trigger_invoice_default()</code>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive MSME Working Capital Calculator (Swiss Mathematical Layout) */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8 space-y-6">
        <div className="border-b border-[#E4E4E7] pb-4">
          <div className="text-xs font-mono uppercase text-[#71717A] tracking-wider">
            FINANCIAL SIMULATION ENGINE // MSME LIQUIDITY CALCULATOR
          </div>
          <h3 className="text-xl font-bold text-[#0A0A0A] font-mono mt-1">
            Cashflow Compression &amp; Working Capital Optimization
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-5 font-mono text-xs">
            <div>
              <label className="block text-[#71717A] mb-1 uppercase font-semibold">
                Invoice Face Value: ₹{(calculatorInvoiceValue).toLocaleString("en-IN")} eINR
              </label>
              <input
                type="range"
                min={500000}
                max={25000000}
                step={500000}
                value={calculatorInvoiceValue}
                onChange={(e) => setCalculatorInvoiceValue(Number(e.target.value))}
                className="w-full accent-[#0A0A0A]"
              />
              <div className="flex justify-between text-[10px] text-[#71717A] mt-1">
                <span>₹5 Lakhs</span>
                <span>₹1.25 Crore</span>
                <span>₹2.5 Crore</span>
              </div>
            </div>

            <div>
              <label className="block text-[#71717A] mb-1 uppercase font-semibold">
                Enterprise Buyer Payment Tenure: {calculatorTenureDays} Days
              </label>
              <input
                type="range"
                min={30}
                max={120}
                step={15}
                value={calculatorTenureDays}
                onChange={(e) => setCalculatorTenureDays(Number(e.target.value))}
                className="w-full accent-[#0A0A0A]"
              />
              <div className="flex justify-between text-[10px] text-[#71717A] mt-1">
                <span>30 Days (Fast)</span>
                <span>90 Days (Typical)</span>
                <span>120 Days (Severe)</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 border border-[#E4E4E7] bg-[#FAFAFA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={buyerCoSigned}
                  onChange={(e) => setBuyerCoSigned(e.target.checked)}
                  className="w-4 h-4 accent-[#059669]"
                />
                <div>
                  <div className="font-bold text-[#0A0A0A]">Enterprise Buyer Co-Signed (Tata / Reliance)</div>
                  <div className="text-[11px] text-[#52525B]">Reduces discount rate by 200 bps (from 8.5% to 6.5% APR)</div>
                </div>
              </label>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7 bg-[#F4F4F5] border border-[#E4E4E7] p-6 space-y-4 font-mono">
            <div className="text-xs uppercase text-[#71717A] font-bold border-b border-[#E4E4E7] pb-2">
              FINANCIAL OUTPUT // SIMULATED SETTLEMENT
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] text-[#71717A] uppercase">ADVANCE RATE</div>
                <div className="text-lg font-bold text-[#0A0A0A]">85.0%</div>
                <div className="text-[10px] text-[#52525B]">₹{advanceAmount.toLocaleString("en-IN")}</div>
              </div>

              <div>
                <div className="text-[10px] text-[#71717A] uppercase">ANNUALIZED DISCOUNT</div>
                <div className="text-lg font-bold text-[#2563EB]">{effectiveDiscountRate.toFixed(1)}% APR</div>
                <div className="text-[10px] text-[#52525B]">{buyerCoSigned ? "-200 bps co-sign" : "Standard rate"}</div>
              </div>

              <div>
                <div className="text-[10px] text-[#71717A] uppercase">DISCOUNT FEE ({calculatorTenureDays}d)</div>
                <div className="text-lg font-bold text-[#DC2626]">₹{Math.round(financeCost).toLocaleString("en-IN")}</div>
                <div className="text-[10px] text-[#52525B]">{((financeCost / advanceAmount) * 100).toFixed(2)}% absolute</div>
              </div>
            </div>

            <div className="border-t border-[#E4E4E7] pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="text-[10px] text-[#71717A] uppercase">NET SAME-DAY eINR DISBURSED TO MSME</div>
                <div className="text-2xl font-extrabold text-[#059669]">
                  ₹{Math.round(netDisbursed).toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-[#52525B]">Available immediately in MSME Solana current account</div>
              </div>

              <div className="text-left sm:text-right border-l sm:border-l-0 border-[#E4E4E7] pl-4 sm:pl-0">
                <div className="text-[10px] text-[#71717A] uppercase">ESTIMATED NET VALUE GAIN</div>
                <div className="text-base font-bold text-[#0A0A0A]">
                  + ₹{Math.round(netWorkingCapitalGain).toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-[#52525B]">Saved vs informal working capital debt (18-24%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
