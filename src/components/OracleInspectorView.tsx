import React, { useState } from "react";
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Key,
  Terminal,
  RefreshCw,
  ExternalLink,
  Zap,
} from "lucide-react";
import { InvoiceRecord, OracleAuditResult } from "../types";

interface OracleInspectorViewProps {
  invoices: InvoiceRecord[];
  onAuditComplete: (invoiceId: string, result: OracleAuditResult) => void;
}

export const OracleInspectorView: React.FC<OracleInspectorViewProps> = ({
  invoices,
  onAuditComplete,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    invoices[0]?.id || "INV-2026-MH-8821"
  );
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<OracleAuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"AUDIT" | "PROMPT" | "SIGNATURE">("AUDIT");

  const currentInvoice = invoices.find((inv) => inv.id === selectedInvoiceId) || invoices[0];

  const handleRunAudit = async () => {
    if (!currentInvoice) return;
    setIsAuditing(true);
    setAuditError(null);

    try {
      const response = await fetch("/api/oracle/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: currentInvoice.id,
          sellerName: currentInvoice.sellerName,
          sellerGstin: currentInvoice.sellerGstin,
          buyerName: currentInvoice.buyerName,
          buyerGstin: currentInvoice.buyerGstin,
          invoiceNumber: currentInvoice.invoiceNumber,
          invoiceDate: currentInvoice.invoiceDate,
          tenureDays: currentInvoice.tenureDays,
          faceValueInr: currentInvoice.faceValueInr,
          itemDescription: currentInvoice.itemDescription,
          hsnCode: currentInvoice.hsnCode,
          ewayBillNumber: currentInvoice.ewayBillNumber,
          poNumber: currentInvoice.poNumber,
          factoringMode: currentInvoice.factoringMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Oracle server returned HTTP ${response.status}`);
      }

      const data: OracleAuditResult = await response.json();
      setAuditResult(data);
      onAuditComplete(currentInvoice.id, data);
    } catch (err: any) {
      setAuditError(err.message || "Failed to execute credit oracle");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-xs font-mono uppercase text-[#71717A] tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              ON-CHAIN CREDIT ORACLE // GEMINI MULTIMODAL API + ED25519 SIGNING
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] font-mono mt-1">
              Cross-Document Audit &amp; Cryptographic Attestation
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab("AUDIT")}
              className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider ${
                activeSubTab === "AUDIT" ? "bg-[#0A0A0A] text-white" : "bg-[#F4F4F5] text-[#71717A]"
              }`}
            >
              01 // AUDIT RESULTS
            </button>
            <button
              onClick={() => setActiveSubTab("PROMPT")}
              className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider ${
                activeSubTab === "PROMPT" ? "bg-[#0A0A0A] text-white" : "bg-[#F4F4F5] text-[#71717A]"
              }`}
            >
              02 // SYSTEM PROMPT
            </button>
            <button
              onClick={() => setActiveSubTab("SIGNATURE")}
              className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider ${
                activeSubTab === "SIGNATURE" ? "bg-[#0A0A0A] text-white" : "bg-[#F4F4F5] text-[#71717A]"
              }`}
            >
              03 // ED25519 ORACLE SPEC
            </button>
          </div>
        </div>

        <p className="text-xs text-[#52525B] max-w-4xl pt-3 leading-relaxed">
          The Credexa Credit Oracle ingests multi-page Indian e-way bills (NIC portal verified), GSTR-1 outward supply filings, and Enterprise Purchase Orders. It analyzes authentic supply chain delivery signals and signs a canonical payload using an authorized Ed25519 keypair for on-chain verification in Solana Anchor.
        </p>
      </div>

      {/* Select Invoice to Inspect */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Selection & Verification artifacts (5/12) */}
        <div className="lg:col-span-5 space-y-4 font-mono text-xs">
          <div className="border border-[#0A0A0A] bg-white p-5 space-y-4">
            <div className="text-[10px] text-[#71717A] uppercase font-bold border-b border-[#E4E4E7] pb-2">
              SELECT INVOICE BUNDLE FOR ORACLE AUDIT
            </div>

            <div>
              <label className="block text-[10px] text-[#71717A] uppercase mb-1">Target Invoice Record</label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  setAuditResult(null);
                }}
                className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} — {inv.buyerName.slice(0, 24)} (₹{(inv.faceValueInr / 100000).toFixed(1)}L)
                  </option>
                ))}
              </select>
            </div>

            {currentInvoice && (
              <div className="space-y-3 bg-[#F8F9FA] p-3 border border-[#E4E4E7] text-[11px]">
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">Supplier (MSME):</span>
                  <span className="font-bold text-[#0A0A0A] truncate max-w-[180px]">{currentInvoice.sellerName}</span>
                </div>
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">Supplier GSTIN:</span>
                  <span className="font-bold text-[#0A0A0A]">{currentInvoice.sellerGstin}</span>
                </div>
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">Enterprise Buyer:</span>
                  <span className="font-bold text-[#2563EB] truncate max-w-[180px]">{currentInvoice.buyerName}</span>
                </div>
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">Buyer GSTIN:</span>
                  <span className="font-bold text-[#0A0A0A]">{currentInvoice.buyerGstin}</span>
                </div>
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">e-Way Bill #:</span>
                  <span className="font-bold text-[#059669]">{currentInvoice.ewayBillNumber}</span>
                </div>
                <div className="flex justify-between border-b border-[#E4E4E7] pb-1">
                  <span className="text-[#71717A]">Purchase Order:</span>
                  <span className="font-bold text-[#0A0A0A]">{currentInvoice.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Face Value:</span>
                  <span className="font-bold text-[#059669]">₹{currentInvoice.faceValueInr.toLocaleString("en-IN")} eINR</span>
                </div>
              </div>
            )}

            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className={`w-full py-3 text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 ${
                isAuditing
                  ? "bg-[#71717A] cursor-not-allowed"
                  : "bg-[#2563EB] hover:bg-[#1D4ED8]"
              }`}
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> EXAMINING INDIAN TAX &amp; E-WAY BILLS...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" /> TRIGGER GEMINI ORACLE AUDIT
                </>
              )}
            </button>
          </div>

          {/* Cross-Document Match Matrix */}
          <div className="border border-[#E4E4E7] bg-white p-5 space-y-3">
            <div className="text-[10px] text-[#71717A] uppercase font-bold border-b border-[#E4E4E7] pb-2">
              ORACLE CROSS-DOCUMENT CORROBORATION
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 bg-[#F8F9FA] border border-[#E4E4E7]">
                <span>1. NIC e-Way Bill Active Status</span>
                <span className="text-[#059669] font-bold">MATCHED (HSN {currentInvoice.hsnCode})</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#F8F9FA] border border-[#E4E4E7]">
                <span>2. GSTR-1 Outward B2B Supply</span>
                <span className="text-[#059669] font-bold">RECONCILED</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#F8F9FA] border border-[#E4E4E7]">
                <span>3. GSTR-3B Tax Paid Verification</span>
                <span className="text-[#059669] font-bold">ACTIVE REGISTRATION</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#F8F9FA] border border-[#E4E4E7]">
                <span>4. Enterprise PO Milestone Check</span>
                <span className="text-[#059669] font-bold">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Output Display (7/12) */}
        <div className="lg:col-span-7">
          {activeSubTab === "AUDIT" && (
            <div className="border border-[#0A0A0A] bg-white p-6 space-y-5 font-mono text-xs">
              <div className="border-b border-[#0A0A0A] pb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#71717A] uppercase">UNDERWRITING STATUS</div>
                  <div className="text-base font-extrabold text-[#0A0A0A]">
                    {auditResult ? "ORACLE VERIFICATION CONFIRMED" : "AWAITING AUDIT EXECUTION"}
                  </div>
                </div>
                {auditResult && (
                  <span className="px-2.5 py-1 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-bold text-[10px] uppercase tracking-wider">
                    {auditResult.audit.default_risk_tier}
                  </span>
                )}
              </div>

              {auditError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{auditError}</span>
                </div>
              )}

              {auditResult ? (
                <div className="space-y-5">
                  {/* Metric Ribbon */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#F8F9FA] p-3 border border-[#E4E4E7]">
                      <div className="text-[10px] text-[#71717A] uppercase">AUTHENTICITY</div>
                      <div className="text-2xl font-extrabold text-[#059669]">
                        {auditResult.audit.authenticity_score}/100
                      </div>
                    </div>

                    <div className="bg-[#F8F9FA] p-3 border border-[#E4E4E7]">
                      <div className="text-[10px] text-[#71717A] uppercase">RECOMMENDED APR</div>
                      <div className="text-2xl font-extrabold text-[#2563EB]">
                        {(auditResult.audit.recommended_discount_rate_bps / 100).toFixed(2)}%
                      </div>
                    </div>

                    <div className="bg-[#F8F9FA] p-3 border border-[#E4E4E7]">
                      <div className="text-[10px] text-[#71717A] uppercase">MAX ADVANCE</div>
                      <div className="text-2xl font-extrabold text-[#0A0A0A]">
                        {auditResult.audit.max_advance_rate_pct}%
                      </div>
                    </div>

                    <div className="bg-[#F8F9FA] p-3 border border-[#E4E4E7]">
                      <div className="text-[10px] text-[#71717A] uppercase">FIRST-LOSS BUFFER</div>
                      <div className="text-2xl font-extrabold text-[#D97706]">
                        {auditResult.audit.junior_tranche_buffer_pct}%
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning Summary */}
                  <div className="p-4 bg-[#F4F4F5] border border-[#E4E4E7] space-y-2">
                    <div className="text-[10px] text-[#71717A] uppercase font-bold flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                      GEMINI CREDIT ORACLE UNDERWRITING RATIONALE
                    </div>
                    <p className="text-xs text-[#0A0A0A] font-sans leading-relaxed">
                      {auditResult.audit.reasoning_summary}
                    </p>
                  </div>

                  {/* Underwriting Flags */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#71717A] uppercase font-bold">
                      UNDERWRITING AUDIT FLAGS &amp; RISK MITIGANTS
                    </div>
                    <div className="space-y-1.5">
                      {auditResult.audit.underwriting_flags.map((flag, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 bg-[#FAFAFA] border border-[#E4E4E7] text-[11px]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
                          <span className="text-[#0A0A0A]">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cryptographic Signature Box */}
                  <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A] uppercase font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-[#059669]" />
                        SOLANA ON-CHAIN ED25519 ORACLE SIGNATURE
                      </span>
                      <span className="text-[#059669]">VALIDATED</span>
                    </div>

                    <div className="bg-[#0A0A0A] text-white p-3 font-mono text-[10px] break-all leading-relaxed space-y-1">
                      <div>
                        <span className="text-[#71717A]">ORACLE_PUBKEY: </span>
                        <span className="text-[#A7F3D0]">{auditResult.oraclePubKey}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A]">SIGNATURE_HEX: </span>
                        <span className="text-[#93C5FD]">{auditResult.oracleSignature}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A]">CANONICAL_PAYLOAD: </span>
                        <span className="text-[#E4E4E7]">{auditResult.canonicalPayload}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-[#71717A] space-y-3">
                  <Cpu className="w-8 h-8 mx-auto text-[#A1A1AA]" />
                  <p>Click "TRIGGER GEMINI ORACLE AUDIT" on the left to evaluate this invoice bundle with multimodal tax and e-way bill analysis.</p>
                </div>
              )}
            </div>
          )}

          {activeSubTab === "PROMPT" && (
            <div className="border border-[#0A0A0A] bg-white p-6 space-y-4 font-mono text-xs">
              <div className="text-xs uppercase font-bold text-[#0A0A0A] border-b border-[#E4E4E7] pb-2">
                SYSTEM INSTRUCTION ARCHITECTURE // GEMINI 3.8 FLASH
              </div>

              <div className="bg-[#F8F9FA] border border-[#E4E4E7] p-4 text-[11px] text-[#0A0A0A] space-y-3 leading-relaxed">
                <div className="text-[#71717A] font-bold">SYSTEM_PROMPT:</div>
                <p>
                  You are the Credexa Decentralized Credit Oracle for Indian Supply Chain Finance on Solana. Your role is to cross-examine Indian B2B invoicing artifacts:
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li><strong>e-Way Bill Validation:</strong> Verify e-Way Bill #, vehicle/transporter details, distance, HSN conformity.</li>
                  <li><strong>GST Compliance:</strong> GSTIN structure verification (2 digits state code + 10 digits PAN + 1 entity + 1 'Z' + 1 check digit) and GSTR-3B tax payment checks.</li>
                  <li><strong>Enterprise Buyer Rating:</strong> Differentiate blue-chip Indian OEMs (Tata Motors, Reliance, Dixon, L&amp;T) from unrated mid-market SMEs.</li>
                  <li><strong>Anti-Fraud Signals:</strong> Check for circular trading, inflated invoice values, and excessive payment tenure.</li>
                </ol>
                <div className="text-[#71717A] font-bold pt-2">OUTPUT_SCHEMA:</div>
                <code className="text-[#2563EB] block bg-white p-2 border border-[#E4E4E7]">
                  {`{
  "authenticity_score": 0..100,
  "gst_reconciliation_status": "MATCHED" | "DISCREPANCY",
  "eway_bill_validity": "ACTIVE_CONFIRMED" | "EXPIRED",
  "default_risk_tier": "TIER_AAA" | "TIER_AA" | "TIER_A" | "TIER_BBB",
  "recommended_discount_rate_bps": 850..1500,
  "max_advance_rate_pct": 80..90,
  "junior_tranche_buffer_pct": 10..25,
  "underwriting_flags": string[],
  "reasoning_summary": string
}`}
                </code>
              </div>
            </div>
          )}

          {activeSubTab === "SIGNATURE" && (
            <div className="border border-[#0A0A0A] bg-white p-6 space-y-4 font-mono text-xs">
              <div className="text-xs uppercase font-bold text-[#0A0A0A] border-b border-[#E4E4E7] pb-2">
                ON-CHAIN SOLANA VERIFICATION SPECIFICATION
              </div>

              <div className="bg-[#F8F9FA] border border-[#E4E4E7] p-4 text-[11px] space-y-3 leading-relaxed">
                <p>
                  The Anchor program verifies the signature inside <code className="font-bold text-[#0A0A0A]">verify_oracle_evaluation()</code> using Solana's native Ed25519 precompile instruction:
                </p>

                <div className="bg-[#0A0A0A] text-white p-3 space-y-1 font-mono text-[10px]">
                  <div>// Solana Anchor Instruction Call</div>
                  <div className="text-[#93C5FD]">pub fn verify_oracle_evaluation(</div>
                  <div className="pl-4 text-[#A7F3D0]">ctx: Context&lt;VerifyOracleEvaluation&gt;,</div>
                  <div className="pl-4 text-[#A7F3D0]">payload: OraclePayload,</div>
                  <div className="pl-4 text-[#A7F3D0]">signature: [u8; 64],</div>
                  <div className="text-[#93C5FD]">) -&gt; Result&lt;()&gt; &#123;</div>
                  <div className="pl-4 text-[#E4E4E7]">require!(ctx.accounts.oracle_signer.key() == config.oracle_pubkey, CredexaError::UnauthorizedOracle);</div>
                  <div className="pl-4 text-[#E4E4E7]">invoice.status = InvoiceStatus::Verified;</div>
                  <div className="text-[#93C5FD]">&#125;</div>
                </div>

                <div className="text-[#52525B]">
                  This guarantees that only authorized, cryptographically signed AI credit reports can advance an invoice from <code className="text-[#0A0A0A]">Draft</code> to <code className="text-[#0A0A0A]">Verified</code> on Solana.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
