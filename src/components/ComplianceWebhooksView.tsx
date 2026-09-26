import React, { useState } from "react";
import {
  FileText,
  CheckCircle2,
  Send,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Building,
  ExternalLink,
} from "lucide-react";
import { InvoiceRecord } from "../types";

interface ComplianceWebhooksViewProps {
  invoices: InvoiceRecord[];
}

export const ComplianceWebhooksView: React.FC<ComplianceWebhooksViewProps> = ({
  invoices,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    invoices[0]?.id || "INV-2026-MH-8821"
  );
  const [webhookEventType, setWebhookEventType] = useState<string>("INVOICE_TOKENIZED");
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  const [webhookLog, setWebhookLog] = useState<any[]>([]);

  const currentInvoice = invoices.find((inv) => inv.id === selectedInvoiceId) || invoices[0];

  const handleSendWebhook = async () => {
    setIsSendingWebhook(true);
    try {
      const response = await fetch("/api/webhook/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: webhookEventType,
          invoiceId: currentInvoice.id,
          payload: {
            token2022Mint: currentInvoice.token2022Mint,
            sellerGstin: currentInvoice.sellerGstin,
            buyerGstin: currentInvoice.buyerGstin,
            irn: currentInvoice.irn,
            ewayBillNumber: currentInvoice.ewayBillNumber,
            faceValueInr: currentInvoice.faceValueInr,
            status: currentInvoice.status,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const resData = await response.json();
      setWebhookLog((prev) => [resData, ...prev]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const getTredsPayload = () => {
    if (!currentInvoice) return "{}";
    return JSON.stringify(
      {
        treds_version: "2.1",
        depository_exchange: "RXIL_M1XCHANGE_INTEROP",
        irn_hash: currentInvoice.irn,
        invoice_number: currentInvoice.invoiceNumber,
        seller_gstin: currentInvoice.sellerGstin,
        buyer_gstin: currentInvoice.buyerGstin,
        currency: "INR",
        amount: currentInvoice.faceValueInr,
        due_date: currentInvoice.maturityDate,
        solana_token2022_mint: currentInvoice.token2022Mint,
        legal_assignment_clause: "IRREVOCABLE_FACTORED_SPL_DEBT",
        anti_double_financing_hash: `0x${currentInvoice.irn.slice(0, 16)}...SECURED`,
      },
      null,
      2
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-xs font-mono uppercase text-[#71717A] tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0A0A0A]"></span>
              REGULATORY COMPLIANCE // TReDS &amp; GST INTEROPERABILITY
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] font-mono mt-1">
              Double-Financing Prevention &amp; Webhook Telemetry
            </h2>
          </div>
          <div className="text-right font-mono">
            <div className="text-[10px] text-[#71717A] uppercase">ACT COMPLIANCE</div>
            <div className="text-sm font-bold text-[#059669]">MSMED ACT 2006 (SEC 15-24)</div>
          </div>
        </div>

        <p className="text-xs text-[#52525B] max-w-3xl pt-3 leading-relaxed">
          Credexa enforces strict anti-double-factoring safeguards by anchoring the Indian GST Invoice Reference Number (IRN) and e-Way Bill into SPL Token-2022 metadata. This enables real-time synchronization with RBI-approved TReDS exchanges (RXIL, M1xchange, Invoicemart) and enterprise ERP systems.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* TReDS Depository Registration (Left 6/12) */}
        <div className="lg:col-span-6 border border-[#0A0A0A] bg-white p-6 space-y-4 font-mono text-xs">
          <div className="border-b border-[#E4E4E7] pb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#71717A] uppercase">TReDS CANONICAL EXPORT</div>
              <h3 className="text-base font-bold text-[#0A0A0A]">
                Depository Registration Payload
              </h3>
            </div>
            <span className="text-[10px] bg-[#ECFDF5] text-[#059669] px-2 py-0.5 font-bold border border-[#A7F3D0]">
              ANTI-DOUBLE FINANCING: LOCKED
            </span>
          </div>

          <div>
            <label className="block text-[10px] text-[#71717A] uppercase mb-1">Select Target Invoice</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.id} — {inv.sellerName.slice(0, 24)} (IRN {inv.irn.slice(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#0A0A0A] text-white p-4 font-mono text-[11px] overflow-x-auto leading-relaxed border border-[#0A0A0A]">
            <pre className="text-[#A7F3D0]">{getTredsPayload()}</pre>
          </div>

          <div className="text-[11px] text-[#52525B] font-sans leading-relaxed">
            This payload can be transmitted to the central TReDS registry API to register a charge under Section 19 of the Factoring Regulation Act, preventing the supplier from re-factoring the same invoice with conventional banks.
          </div>
        </div>

        {/* Enterprise ERP Webhook Dispatcher (Right 6/12) */}
        <div className="lg:col-span-6 border border-[#0A0A0A] bg-white p-6 space-y-4 font-mono text-xs">
          <div className="border-b border-[#E4E4E7] pb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#71717A] uppercase">ENTERPRISE ERP WEBHOOK DISPATCHER</div>
              <h3 className="text-base font-bold text-[#0A0A0A]">
                Simulate Real-Time SAP / Oracle ERP Callbacks
              </h3>
            </div>
            <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 font-bold border border-[#BFDBFE]">
              HMAC-SHA256 SIGNED
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-[#71717A] uppercase mb-1">Select Trigger Event</label>
              <select
                value={webhookEventType}
                onChange={(e) => setWebhookEventType(e.target.value)}
                className="w-full border border-[#0A0A0A] p-2 bg-white text-xs font-bold"
              >
                <option value="INVOICE_TOKENIZED">INVOICE_TOKENIZED (SPL Token-2022 Minted)</option>
                <option value="ORACLE_VERIFIED">ORACLE_VERIFIED (Gemini 3.8 Flash Approved)</option>
                <option value="FUNDS_DISBURSED_MSME">FUNDS_DISBURSED_MSME (eINR Disbursed to Supplier)</option>
                <option value="BUYER_ATTESTED">BUYER_ATTESTED (Enterprise Co-Sign -200 BPS)</option>
                <option value="SETTLED_WITH_REBATE">SETTLED_WITH_REBATE (Early Cash Payout Deducted)</option>
                <option value="GRACE_PERIOD_DEFAULT_TRIGGERED">GRACE_PERIOD_DEFAULT_TRIGGERED (15-Day Past Due)</option>
              </select>
            </div>

            <button
              onClick={handleSendWebhook}
              disabled={isSendingWebhook}
              className={`w-full py-3 bg-[#0A0A0A] text-white hover:bg-[#27272A] transition-colors font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 ${
                isSendingWebhook ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSendingWebhook ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> DISPATCHING TO ERP ENDPOINT...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> TRIGGER SIMULATED WEBHOOK CALL
                </>
              )}
            </button>
          </div>

          {/* Webhook History Log */}
          <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
            <div className="text-[10px] text-[#71717A] uppercase font-bold flex justify-between">
              <span>EVENT TELEMETRY LOG</span>
              <span>{webhookLog.length} DISPATCHED</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {webhookLog.length === 0 ? (
                <div className="p-6 text-center text-[#71717A] bg-[#F8F9FA] border border-[#E4E4E7]">
                  No webhooks dispatched in this session. Select an event above and click trigger.
                </div>
              ) : (
                webhookLog.map((log, i) => (
                  <div key={i} className="p-3 bg-[#F8F9FA] border border-[#E4E4E7] space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-[#059669]">{log.event}</span>
                      <span className="text-[#71717A]">{new Date(log.receivedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[10px] text-[#0A0A0A] truncate">
                      Invoice: {log.invoiceId} | Delivery: {log.deliveryStatus}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
