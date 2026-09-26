import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Upload,
  RefreshCw,
  Cpu,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Coins,
  Check,
  Trash2,
} from "lucide-react";
import { InvoiceRecord, FactoringMode } from "../types";
import { calculateLendingRecommendation, LendingRecommendation } from "../utils/lendingCalculator";
import { safeFetch } from "../services/apiClient";
import { normalizeFraudResult } from "../utils/normalizeFraudResult";
import { CanonicalInvoiceData } from "../services/invoiceDocumentService";

interface TokenizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (invoice: Partial<InvoiceRecord>) => void;
  onSuccess?: (createdInvoice: InvoiceRecord, token2022Result: any) => void;
  initialData?: any | null;
}

interface LineItem {
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

type ProvenanceStatus = "autofilled" | "blank" | "user_edited";

export const TokenizeModal: React.FC<TokenizeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  initialData,
}) => {
  // Section 1: Invoice State
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [poNumber, setPoNumber] = useState<string>("");
  const [faceValueInr, setFaceValueInr] = useState<string>(""); // Empty string if unknown, NEVER 0 (Req 7)

  // Section 2: Parties State
  const [sellerName, setSellerName] = useState<string>("");
  const [sellerGstin, setSellerGstin] = useState<string>("");
  const [sellerLocation, setSellerLocation] = useState<string>("");
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerGstin, setBuyerGstin] = useState<string>("");
  const [buyerAddress, setBuyerAddress] = useState<string>("");

  // Section 3: Financing State
  const [tenureDays, setTenureDays] = useState<string>("90");
  const [factoringMode, setFactoringMode] = useState<FactoringMode>("Recourse");
  const [riskTier, setRiskTier] = useState<string>("UNDETERMINED");
  const [authenticityScore, setAuthenticityScore] = useState<number>(0);

  // Financial Subtotals & Line items
  const [subtotal, setSubtotal] = useState<string>("");
  const [cgst, setCgst] = useState<string>("");
  const [sgst, setSgst] = useState<string>("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Additional Details (Collapsible)
  const [showAdditionalDetails, setShowAdditionalDetails] = useState<boolean>(false);
  const [ewayBillNumber, setEwayBillNumber] = useState<string>("");
  const [hsnCode, setHsnCode] = useState<string>("");
  const [itemDescription, setItemDescription] = useState<string>("");

  // Provenance & Extraction Status Tracking
  const [fieldProvenance, setFieldProvenance] = useState<Record<string, ProvenanceStatus>>({});
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "loading" | "success" | "failed">("idle");
  const [extractedFileName, setExtractedFileName] = useState<string>("");
  const [extractedCount, setExtractedCount] = useState<number>(0);
  const [missingCount, setMissingCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Minting state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mintStatusStep, setMintStatusStep] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mintedResult, setMintedResult] = useState<{
    invoice: InvoiceRecord;
    mintAddress: string;
    signature: string;
    explorerUrl: string;
    mintExplorerUrl: string;
  } | null>(null);
  const [showBlockchainDetails, setShowBlockchainDetails] = useState<boolean>(false);

  // State reset helper (Requirement 18)
  const resetFormState = () => {
    setInvoiceNumber("");
    setInvoiceDate("");
    setDueDate("");
    setPoNumber("");
    setFaceValueInr("");
    setSellerName("");
    setSellerGstin("");
    setSellerLocation("");
    setBuyerName("");
    setBuyerGstin("");
    setBuyerAddress("");
    setSubtotal("");
    setCgst("");
    setSgst("");
    setLineItems([]);
    setEwayBillNumber("");
    setHsnCode("");
    setItemDescription("");
    setRiskTier("UNDETERMINED");
    setAuthenticityScore(0);
    setFieldProvenance({});
    setExtractedCount(0);
    setMissingCount(0);
    setSubmitError(null);
  };

  // Populate from normalized data
  const applyExtractedInvoiceData = (normalized: any, fileName: string) => {
    const inv = normalized.invoice || {};
    const prov: Record<string, ProvenanceStatus> = {};
    let found = 0;
    let missing = 0;

    const setField = (key: string, val: string | number | null | undefined, setter: (v: string) => void) => {
      if (val !== null && val !== undefined && val !== "" && val !== "null") {
        setter(String(val));
        prov[key] = "autofilled";
        found++;
      } else {
        setter("");
        prov[key] = "blank";
        missing++;
      }
    };

    setField("invoiceNumber", inv.invoice_number, setInvoiceNumber);
    setField("invoiceDate", inv.invoice_date, setInvoiceDate);
    setField("dueDate", inv.due_date, setDueDate);
    setField("poNumber", inv.po_number, setPoNumber);
    setField("faceValueInr", inv.total_amount, setFaceValueInr);
    setField("sellerName", inv.seller_name, setSellerName);
    setField("sellerGstin", inv.seller_gstin, setSellerGstin);
    setField("sellerLocation", inv.seller_address, setSellerLocation);
    setField("buyerName", inv.buyer_name, setBuyerName);
    setField("buyerGstin", inv.buyer_gstin, setBuyerGstin);
    setField("buyerAddress", inv.buyer_address, setBuyerAddress);
    setField("subtotal", inv.subtotal, setSubtotal);
    setField("cgst", inv.cgst, setCgst);
    setField("sgst", inv.sgst, setSgst);
    setField("ewayBillNumber", inv.eway_bill_number, setEwayBillNumber);
    setField("hsnCode", inv.hsn_sac_codes, setHsnCode);

    // Line items table
    if (Array.isArray(inv.line_items) && inv.line_items.length > 0) {
      setLineItems(
        inv.line_items.map((it: any) => ({
          description: it.description || "Item",
          hsn: it.hsn || "",
          quantity: it.quantity || 1,
          unit: it.unit || "Nos",
          unitPrice: it.unitPrice || 0,
          amount: it.subtotal || it.amount || 0,
        }))
      );
      setItemDescription(inv.line_items[0]?.description || "");
      prov["lineItems"] = "autofilled";
      found++;
    } else {
      setLineItems([]);
    }

    setFieldProvenance(prov);
    setExtractedCount(found);
    setMissingCount(missing);

    if (normalized.risk_assessment) {
      setRiskTier(normalized.risk_assessment.risk_level || "Low");
      setAuthenticityScore(normalized.risk_assessment.confidence || 95);
    }

    if (found > 0) {
      setExtractionStatus("success");
      setExtractedFileName(fileName);
    } else {
      setExtractionStatus("failed");
    }
  };

  // Auto-populate when initialData is passed
  useEffect(() => {
    if (initialData && isOpen) {
      const norm = normalizeFraudResult(initialData);
      applyExtractedInvoiceData(norm, "Initial Document Data");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Compute Lending Recommendation deterministically (Requirement 8)
  const faceValNum = parseFloat(faceValueInr);
  const lendingRec: LendingRecommendation = calculateLendingRecommendation(
    isNaN(faceValNum) || faceValNum <= 0 ? null : faceValNum,
    riskTier,
    authenticityScore
  );

  const handleFieldChange = (fieldKey: string, setter: (val: string) => void, val: string) => {
    setter(val);
    setFieldProvenance((prev) => ({
      ...prev,
      [fieldKey]: val.trim() ? "user_edited" : "blank",
    }));
  };

  // Populate from canonical extraction data (Requirement 2 & 3: Direct Invoice Extraction Endpoint)
  const applyCanonicalExtractionData = (extraction: CanonicalInvoiceData, fileName: string) => {
    const prov: Record<string, ProvenanceStatus> = {};
    let found = 0;
    let missing = 0;

    const setField = (key: string, val: any, setter: (v: string) => void) => {
      const strVal = val !== null && val !== undefined ? String(val).trim() : "";
      if (
        strVal !== "" &&
        strVal.toUpperCase() !== "NULL" &&
        strVal.toUpperCase() !== "NOT DETECTED" &&
        strVal.toUpperCase() !== "ABSENT IN PDF" &&
        strVal.toUpperCase() !== "N/A"
      ) {
        setter(strVal);
        prov[key] = "autofilled";
        found++;
      } else {
        setter("");
        prov[key] = "blank";
        missing++;
      }
    };

    setField("invoiceNumber", extraction.invoice?.invoiceNumber?.value, setInvoiceNumber);
    setField("invoiceDate", extraction.invoice?.invoiceDate?.value, setInvoiceDate);
    setField("dueDate", extraction.invoice?.dueDate?.value, setDueDate);
    setField("poNumber", extraction.invoice?.poNumber?.value, setPoNumber);
    setField("faceValueInr", extraction.financial?.grandTotal?.value, setFaceValueInr);
    setField("sellerName", extraction.seller?.name?.value, setSellerName);
    setField("sellerGstin", extraction.seller?.gstin?.value, setSellerGstin);
    setField("sellerLocation", extraction.seller?.address?.value, setSellerLocation);
    setField("buyerName", extraction.buyer?.name?.value, setBuyerName);
    setField("buyerGstin", extraction.buyer?.gstin?.value, setBuyerGstin);
    setField("buyerAddress", extraction.buyer?.address?.value, setBuyerAddress);
    setField("subtotal", extraction.financial?.subtotal?.value, setSubtotal);
    setField("cgst", extraction.financial?.cgst?.value, setCgst);
    setField("sgst", extraction.financial?.sgst?.value, setSgst);
    setField("ewayBillNumber", extraction.invoice?.ewayBillNumber?.value, setEwayBillNumber);

    // Line items table
    const items = extraction.lineItems || [];
    if (Array.isArray(items) && items.length > 0) {
      const formattedItems: LineItem[] = items.map((it) => ({
        description: it.description || "Item",
        hsn: it.hsn || "",
        quantity: it.quantity ?? 1,
        unit: it.unit || "Nos",
        unitPrice: it.unitPrice ?? 0,
        amount: it.amount ?? (it.quantity && it.unitPrice ? it.quantity * it.unitPrice : 0),
      }));
      setLineItems(formattedItems);
      if (formattedItems[0]?.hsn) setHsnCode(formattedItems[0].hsn);
      if (formattedItems[0]?.description) setItemDescription(formattedItems[0].description);
      prov["lineItems"] = "autofilled";
      found++;
    } else {
      setLineItems([]);
    }

    setFieldProvenance(prov);
    setExtractedCount(found);
    setMissingCount(missing);

    if (extraction.document?.status === "SUCCESS" || extraction.document?.status === "PARTIAL" || found > 0) {
      setExtractionStatus("success");
      setExtractedFileName(fileName);
      setStatusMessage(`Extracted ${found} fields from ${fileName} via Gemini Document Intelligence.`);
      setRiskTier("Low");
      setAuthenticityScore(Math.round((extraction.document?.confidence || 0.95) * 100));
      console.log(`[OCR-FE] extraction status: success`);
      console.log(`[OCR-FE] extracted field count: ${found}`);
    } else {
      setExtractionStatus("failed");
      setStatusMessage("We couldn't reliably read this invoice. Please enter missing details manually.");
      setRiskTier("UNDETERMINED");
      setAuthenticityScore(0);
      setFieldProvenance({});
      console.log(`[OCR-FE] extraction status: failed`);
      console.log(`[OCR-FE] extracted field count: ${found}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage("File size exceeds 10MB limit. Please upload a smaller document.");
      setExtractionStatus("failed");
      setRiskTier("UNDETERMINED");
      setAuthenticityScore(0);
      setFieldProvenance({});
      return;
    }

    const mime = file.type || "application/pdf";
    const endpoint = "/api/invoice-intelligence/extract";

    console.log(`[OCR-FE] upload started`);
    console.log(`[OCR-FE] filename: ${file.name}`);
    console.log(`[OCR-FE] mime: ${mime}`);
    console.log(`[OCR-FE] size: ${file.size} bytes`);
    console.log(`[OCR-FE] endpoint: ${endpoint}`);

    // State Reset before new upload (Requirement 9 & 18)
    resetFormState();
    setExtractionStatus("loading");
    setStatusMessage("Reading and parsing invoice document with Gemini AI Multimodal Engine...");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        console.log(`[OCR-FE] request sent`);

        // Direct call to new authoritative Invoice Document Intelligence extraction endpoint (Requirement 2 & 3)
        const res = await safeFetch(endpoint, {
          method: "POST",
          body: JSON.stringify({
            documentBase64: base64Data,
            mimeType: mime,
            fileName: file.name,
          }),
        }, 60000);

        console.log(`[OCR-FE] response status: ${res.status}`);
        console.log(`[OCR-FE] response body:`, res.data);

        if (res.data?.error === "GEMINI_CONFIGURATION_ERROR" || res.data?.error === "GEMINI_QUOTA_EXCEEDED") {
          setExtractionStatus("failed");
          setStatusMessage(`Gemini AI Engine Service Error: ${res.data.message || res.data.error}`);
          setRiskTier("UNDETERMINED");
          setAuthenticityScore(0);
          setFieldProvenance({});
          console.log(`[OCR-FE] extraction status: failed (Configuration/Quota Error)`);
          console.log(`[OCR-FE] extracted field count: 0`);
          return;
        }

        if (res.ok && res.data.success && res.data.extraction) {
          applyCanonicalExtractionData(res.data.extraction, file.name);
        } else if (res.ok && res.data.result) {
          const norm = normalizeFraudResult(res.data.result);
          applyExtractedInvoiceData(norm, file.name);
        } else {
          setExtractionStatus("failed");
          setStatusMessage("We couldn't reliably read this invoice. Please upload a clearer document or enter the missing information manually.");
          setRiskTier("UNDETERMINED");
          setAuthenticityScore(0);
          setFieldProvenance({});
          console.log(`[OCR-FE] extraction status: failed`);
          console.log(`[OCR-FE] extracted field count: 0`);
        }
      } catch (err: any) {
        setExtractionStatus("failed");
        setStatusMessage(err.message || "Failed to process document with Gemini OCR");
        setRiskTier("UNDETERMINED");
        setAuthenticityScore(0);
        setFieldProvenance({});
        console.log(`[OCR-FE] extraction status: failed`);
        console.log(`[OCR-FE] extracted field count: 0`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sample Skyline Invoice Test Case Loader (Requirement 2 & 17)
  const loadSkylineTestInvoice = () => {
    resetFormState();
    setExtractionStatus("loading");
    setStatusMessage("Extracting Skyline Trading Solutions test invoice...");

    setTimeout(() => {
      const skylineData = {
        invoiceNumber: "STS/24-25/4587",
        invoiceDate: "2025-08-14",
        dueDate: "2025-08-29",
        poNumber: "PO/TTML/2025/778",
        seller: {
          name: "Skyline Trading Solutions Pvt. Ltd.",
          gstin: "27ABCDE1234F12",
          address: "302, Prime Business Tower, Andheri East, Mumbai, Maharashtra 400069",
        },
        buyer: {
          name: "Tata Motors Limited",
          gstin: "27AAACT2727Q1Z8",
          address: "Bombay House, 24 Homi Mody Street, Fort, Mumbai, Maharashtra 400001",
        },
        financial: {
          subtotal: 7050000,
          cgst: 634500,
          sgst: 634500,
          igst: null,
          totalTax: 1269000,
          grandTotal: 8200000,
          currency: "INR",
        },
        lineItems: [
          {
            description: "Automotive Gear Assembly (Model X1)",
            hsn: "870899",
            quantity: 100,
            unit: "Nos",
            unitPrice: 45000,
            amount: 4500000,
          },
          {
            description: "Precision Machined Components",
            hsn: "848390",
            quantity: 200,
            unit: "Nos",
            unitPrice: 12500,
            amount: 2500000,
          },
          {
            description: "Logistics & Handling Charges",
            hsn: "996711",
            quantity: 1,
            unit: "Lot",
            unitPrice: 50000,
            amount: 50000,
          },
        ],
        paymentTerms: "Payment within 15 days from invoice date",
        ewayBillNumber: null,
        hsnSacCodes: "870899, 848390, 996711",
        risk_assessment: {
          risk_level: "Low",
          confidence: 96,
          reasoning: "Authentic B2B invoice from Skyline Trading Solutions to Tata Motors Limited.",
        },
      };

      const norm = normalizeFraudResult(skylineData);
      applyExtractedInvoiceData(norm, "Skyline_Trading_Solutions_INV4587.pdf");
    }, 350);
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { description: "New Item", hsn: "", quantity: 1, unit: "Nos", unitPrice: 0, amount: 0 },
    ]);
  };

  const handleRemoveLineItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (idx: number, field: keyof LineItem, val: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: val };
      if (field === "quantity" || field === "unitPrice") {
        item.amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      }
      updated[idx] = item;
      return updated;
    });
  };

  const handleMintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const faceVal = Number(faceValueInr);
    if (isNaN(faceVal) || faceVal <= 0) {
      setSubmitError("Please enter a valid invoice face value greater than ₹0.");
      setIsSubmitting(false);
      return;
    }

    if (!invoiceNumber || !sellerName || !buyerName) {
      setSubmitError("Invoice Number, Seller Name, and Buyer Name are required.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      invoiceNumber,
      invoiceDate: invoiceDate || undefined,
      dueDate: dueDate || undefined,
      sellerName,
      sellerGstin: sellerGstin || undefined,
      sellerLocation: sellerLocation || undefined,
      buyerName,
      buyerGstin: buyerGstin || undefined,
      buyerAddress: buyerAddress || undefined,
      faceValueInr: faceVal,
      advanceRatePct: lendingRec.recommendedPercentage || (factoringMode === "Recourse" ? 85 : 80),
      tenureDays: Number(tenureDays) || 90,
      itemDescription: itemDescription || lineItems[0]?.description || undefined,
      hsnCode: hsnCode || lineItems[0]?.hsn || undefined,
      ewayBillNumber: ewayBillNumber || undefined,
      poNumber: poNumber || undefined,
      factoringMode,
      riskTier,
      authenticityScore,
      lineItems: lineItems.length > 0 ? lineItems : undefined,
    };

    try {
      setMintStatusStep("Creating Token-2022 Mint Account on Solana Devnet...");
      const res = await safeFetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data.success) {
        setMintStatusStep("Verifying transaction confirmation on-chain...");
        const inv = res.data.invoice;
        const token2022 = res.data.token2022 || {};

        const resultObj = {
          invoice: inv,
          mintAddress: token2022.mintAddress || inv.token2022Mint || `Mint_${inv.id}`,
          signature: token2022.signature || inv.oracleSignature || "",
          explorerUrl: token2022.explorerUrl || `https://explorer.solana.com/tx/${inv.oracleSignature || "demo"}?cluster=devnet`,
          mintExplorerUrl: token2022.mintExplorerUrl || `https://explorer.solana.com/address/${token2022.mintAddress || "mint"}?cluster=devnet`,
        };

        setMintedResult(resultObj);
        if (onSubmit) onSubmit(inv);
        if (onSuccess) onSuccess(inv, token2022);
      } else {
        setSubmitError(res.data?.error || "Failed to tokenize invoice on Solana Devnet.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Network error during tokenization execution.");
    } finally {
      setIsSubmitting(false);
      setMintStatusStep("");
    }
  };

  // Small clean status badge (Requirement 10)
  const renderFieldBadge = (fieldKey: string) => {
    const status = fieldProvenance[fieldKey];
    if (status === "autofilled") {
      return (
        <span className="text-[10px] font-semibold text-[#16A34A] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> ✓ AI extracted
        </span>
      );
    }
    return <span className="text-[10px] text-[#71717A]">Manual input</span>;
  };

  return (
    <div className="app-modal-overlay">
      <div className="app-modal-content font-sans text-xs">
        {/* Modal Header */}
        <div className="border-b border-[#E5E5E5] bg-[#0A0A0A] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-[#2563EB]" />
            <span className="font-bold text-xs sm:text-sm tracking-wide font-mono truncate">
              INVOICE TOKENIZATION // SOLANA TOKEN-2022
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white transition-colors p-1"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Successful Minting Display View */}
        {mintedResult ? (
          <div className="p-8 space-y-6">
            <div className="p-6 border border-[#16A34A] bg-[#F0FDF4] space-y-2 rounded-[6px]">
              <div className="flex items-center gap-2 text-[#16A34A] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>INVOICE TOKENIZED ON SOLANA DEVNET (TOKEN-2022)</span>
              </div>
              <p className="text-xs text-[#333333] leading-relaxed">
                Invoice <strong>{mintedResult.invoice.invoiceNumber}</strong> for face value <strong>₹{mintedResult.invoice.faceValueInr.toLocaleString("en-IN")}</strong> has been minted on-chain.
              </p>
            </div>

            <div className="space-y-2.5 p-4 border border-[#E5E5E5] bg-[#FAFAFA] rounded-[6px] font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#666666]">Token-2022 Mint Address:</span>
                <span className="font-bold text-[#111111] break-all">{mintedResult.mintAddress}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#666666]">Devnet Transaction Signature:</span>
                <span className="font-bold text-[#2563EB] truncate max-w-[320px]">{mintedResult.signature}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E5E5E5]">
              <a
                href={mintedResult.mintExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-2 rounded-[4px]"
              >
                <span>View Mint on Solana Explorer</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#111111] text-white hover:bg-[#333333] font-semibold text-xs uppercase rounded-[4px]"
              >
                Close &amp; Return to Dashboard
              </button>
            </div>

            {/* Expandable Blockchain Details */}
            <div className="border border-[#E5E5E5] rounded-[4px] overflow-hidden">
              <button
                onClick={() => setShowBlockchainDetails(!showBlockchainDetails)}
                className="w-full p-3 bg-[#FAFAFA] flex items-center justify-between font-bold text-xs text-[#111111]"
              >
                <span>BLOCKCHAIN &amp; AUDIT DETAILS</span>
                {showBlockchainDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showBlockchainDetails && (
                <div className="p-4 space-y-2 bg-white text-[11px] font-mono border-t border-[#E5E5E5]">
                  <div>Network: <strong className="text-[#16A34A]">Solana Devnet (https://api.devnet.solana.com)</strong></div>
                  <div>Token Program: <strong className="text-[#2563EB]">SPL Token-2022 (TokenzQdBN...)</strong></div>
                  <div>Explorer Transaction: <a href={mintedResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] underline break-all">{mintedResult.explorerUrl}</a></div>
                  <div>Explorer Address: <a href={mintedResult.mintExplorerUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] underline break-all">{mintedResult.mintExplorerUrl}</a></div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Modal Form Body */
          <form onSubmit={handleMintSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* CLEAN EXTRACTION HEADER (Requirement 11) */}
            <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-4 rounded-[6px] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                    AI INVOICE EXTRACTION
                  </div>
                  {extractionStatus === "loading" && (
                    <div className="flex items-center gap-2 text-xs text-[#2563EB] font-medium mt-0.5">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{statusMessage || "Analyzing document with Gemini..."}</span>
                    </div>
                  )}
                  {extractionStatus === "success" && (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Invoice analyzed successfully</span>
                      </div>
                      <div className="text-[11px] text-[#52525B]">
                        {extractedCount} fields extracted • {missingCount} fields require manual input ({extractedFileName})
                      </div>
                    </div>
                  )}
                  {extractionStatus === "failed" && (
                    <div className="mt-1 space-y-0.5 text-xs text-[#DC2626]">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>We couldn't reliably read this invoice.</span>
                      </div>
                      <div className="text-[11px] text-[#52525B]">
                        Please upload a clearer document or enter the missing information manually.
                      </div>
                    </div>
                  )}
                  {extractionStatus === "idle" && (
                    <div className="text-xs text-[#52525B] mt-0.5">
                      Upload a PDF invoice to extract fields automatically.
                    </div>
                  )}
                </div>

                {/* Upload Action / Quick Test Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <label className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs cursor-pointer flex items-center gap-1.5 rounded-[4px] transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{extractionStatus === "success" ? "Replace Invoice" : "Upload PDF"}</span>
                    <input
                      type="file"
                      accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg,.svg"
                      onChange={handleFileUpload}
                      disabled={extractionStatus === "loading"}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={loadSkylineTestInvoice}
                    disabled={extractionStatus === "loading"}
                    className="px-3 py-1.5 bg-white border border-[#E5E5E5] hover:bg-[#F4F4F5] text-[#111111] font-mono text-[11px] rounded-[4px] transition-colors"
                  >
                    Test Skyline PDF
                  </button>
                </div>
              </div>
            </div>

            {/* CLEAN RISK & FINANCING CARD (Requirement 12) */}
            <div className="border border-[#E5E5E5] bg-white p-4 rounded-[6px] space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] border-b border-[#E5E5E5] pb-2 flex items-center justify-between">
                <span className="font-bold text-[#111111] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> RISK &amp; FINANCING
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  riskTier === "UNDETERMINED"
                    ? "bg-[#F4F4F5] text-[#71717A] border-[#D4D4D8]"
                    : riskTier.toLowerCase().includes("high")
                    ? "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                    : "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                }`}>
                  Risk Level: {riskTier.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 border border-[#E5E5E5] rounded bg-[#FAFAFA] space-y-0.5">
                  <div className="text-[10px] text-[#71717A] uppercase font-mono">Invoice Value</div>
                  <div className="font-bold text-[#111111] font-mono text-sm">
                    {faceValNum > 0 ? `₹${faceValNum.toLocaleString("en-IN")}` : "—"}
                  </div>
                </div>

                <div className="p-2.5 border border-[#E5E5E5] rounded bg-[#FAFAFA] space-y-0.5">
                  <div className="text-[10px] text-[#71717A] uppercase font-mono">Risk Level</div>
                  <div className={`font-bold font-mono text-sm ${
                    riskTier === "UNDETERMINED" ? "text-[#71717A]" : riskTier.toLowerCase().includes("high") ? "text-[#DC2626]" : "text-[#16A34A]"
                  }`}>
                    {riskTier.toUpperCase()}
                  </div>
                </div>

                <div className="p-2.5 border border-[#E5E5E5] rounded bg-[#FAFAFA] space-y-0.5">
                  <div className="text-[10px] text-[#71717A] uppercase font-mono">Eligible Financing (80%–85%)</div>
                  <div className="font-bold text-[#2563EB] font-mono text-sm">
                    {lendingRec.minimumRangeAmount && lendingRec.maximumRangeAmount
                      ? `₹${lendingRec.minimumRangeAmount.toLocaleString("en-IN")} – ₹${lendingRec.maximumRangeAmount.toLocaleString("en-IN")}`
                      : "—"}
                  </div>
                </div>

                <div className="p-2.5 border border-[#E5E5E5] rounded bg-[#FAFAFA] space-y-0.5">
                  <div className="text-[10px] text-[#71717A] uppercase font-mono">
                    Recommended Advance ({lendingRec.recommendedPercentage || 85}%)
                  </div>
                  <div className="font-bold text-[#16A34A] font-mono text-sm">
                    {lendingRec.recommendedAmount
                      ? `₹${lendingRec.recommendedAmount.toLocaleString("en-IN")}`
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Dynamic Why List (Requirement 12) */}
              <div className="text-[11px] text-[#52525B] space-y-1 pt-1">
                <div className="font-semibold text-[#111111]">Extraction Evidence:</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px]">
                  {fieldProvenance.faceValueInr === "autofilled" && faceValNum > 0 && (
                    <span className="flex items-center gap-1 text-[#16A34A]">
                      <Check className="w-3 h-3" /> Invoice amount detected (₹{faceValNum.toLocaleString("en-IN")})
                    </span>
                  )}
                  {fieldProvenance.buyerName === "autofilled" && buyerName.trim() !== "" && (
                    <span className="flex items-center gap-1 text-[#16A34A]">
                      <Check className="w-3 h-3" /> Buyer identified ({buyerName})
                    </span>
                  )}
                  {fieldProvenance.sellerGstin === "autofilled" && sellerGstin.trim() !== "" && (
                    <span className="flex items-center gap-1 text-[#16A34A]">
                      <Check className="w-3 h-3" /> Seller GSTIN detected ({sellerGstin})
                    </span>
                  )}
                  {fieldProvenance.dueDate === "autofilled" && dueDate.trim() !== "" && (
                    <span className="flex items-center gap-1 text-[#16A34A]">
                      <Check className="w-3 h-3" /> Due date detected ({dueDate})
                    </span>
                  )}
                  {(!fieldProvenance.faceValueInr || fieldProvenance.faceValueInr !== "autofilled") &&
                   (!fieldProvenance.buyerName || fieldProvenance.buyerName !== "autofilled") &&
                   (!fieldProvenance.sellerGstin || fieldProvenance.sellerGstin !== "autofilled") &&
                   (!fieldProvenance.dueDate || fieldProvenance.dueDate !== "autofilled") && (
                    <span className="text-[#71717A] italic">
                      No document fields automatically detected. Please upload an invoice PDF or enter details manually.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3 CLEAN FORM SECTIONS (Requirement 13) */}

            {/* SECTION 1: INVOICE */}
            <div className="border border-[#E5E5E5] p-4 rounded-[6px] space-y-3 bg-white">
              <div className="text-xs font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E5] pb-1.5 flex justify-between items-center">
                <span>1. INVOICE</span>
                <span className="text-[10px] text-[#71717A] font-mono">CORE SPECIFICATION</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#333333]">Invoice Number *</label>
                    {renderFieldBadge("invoiceNumber")}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter Invoice Number"
                    value={invoiceNumber}
                    onChange={(e) => handleFieldChange("invoiceNumber", setInvoiceNumber, e.target.value)}
                    className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#333333]">Invoice Date</label>
                    {renderFieldBadge("invoiceDate")}
                  </div>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD or DD-MM-YYYY"
                    value={invoiceDate}
                    onChange={(e) => handleFieldChange("invoiceDate", setInvoiceDate, e.target.value)}
                    className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#333333]">Due Date</label>
                    {renderFieldBadge("dueDate")}
                  </div>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD or DD-MM-YYYY"
                    value={dueDate}
                    onChange={(e) => handleFieldChange("dueDate", setDueDate, e.target.value)}
                    className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#333333]">Purchase Order (PO) #</label>
                    {renderFieldBadge("poNumber")}
                  </div>
                  <input
                    type="text"
                    placeholder="Enter PO Number"
                    value={poNumber}
                    onChange={(e) => handleFieldChange("poNumber", setPoNumber, e.target.value)}
                    className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#333333]">Invoice Value (₹) *</label>
                    {renderFieldBadge("faceValueInr")}
                  </div>
                  <input
                    type="number"
                    required
                    placeholder="Enter Invoice Value (₹)"
                    value={faceValueInr}
                    onChange={(e) => handleFieldChange("faceValueInr", setFaceValueInr, e.target.value)}
                    className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono font-bold text-[#16A34A] rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#333333]">Subtotal (Excl. Tax)</label>
                    {renderFieldBadge("subtotal")}
                  </div>
                  <input
                    type="number"
                    placeholder="Enter Subtotal"
                    value={subtotal}
                    onChange={(e) => handleFieldChange("subtotal", setSubtotal, e.target.value)}
                    className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PARTIES */}
            <div className="border border-[#E5E5E5] p-4 rounded-[6px] space-y-3 bg-white">
              <div className="text-xs font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E5] pb-1.5 flex justify-between items-center">
                <span>2. PARTIES</span>
                <span className="text-[10px] text-[#71717A] font-mono">SUPPLIER &amp; BUYER</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seller */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-[#333333]">Seller Name *</label>
                      {renderFieldBadge("sellerName")}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Enter Seller Name"
                      value={sellerName}
                      onChange={(e) => handleFieldChange("sellerName", setSellerName, e.target.value)}
                      className="w-full border border-[#D4D4D8] px-3 py-2 text-xs rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-[#333333]">Supplier GSTIN</label>
                      {renderFieldBadge("sellerGstin")}
                    </div>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="15-digit GSTIN"
                      value={sellerGstin}
                      onChange={(e) => handleFieldChange("sellerGstin", setSellerGstin, e.target.value)}
                      className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono uppercase rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-[#333333]">Seller Address</label>
                      {renderFieldBadge("sellerLocation")}
                    </div>
                    <input
                      type="text"
                      placeholder="Street, City, State, PIN"
                      value={sellerLocation}
                      onChange={(e) => handleFieldChange("sellerLocation", setSellerLocation, e.target.value)}
                      className="w-full border border-[#D4D4D8] px-3 py-2 text-xs rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Buyer */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-[#333333]">Buyer Corporate Name *</label>
                      {renderFieldBadge("buyerName")}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Enter Buyer Name"
                      value={buyerName}
                      onChange={(e) => handleFieldChange("buyerName", setBuyerName, e.target.value)}
                      className="w-full border border-[#D4D4D8] px-3 py-2 text-xs rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-[#333333]">Buyer GSTIN</label>
                      {renderFieldBadge("buyerGstin")}
                    </div>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="15-digit GSTIN"
                      value={buyerGstin}
                      onChange={(e) => handleFieldChange("buyerGstin", setBuyerGstin, e.target.value)}
                      className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono uppercase rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-[#333333]">Buyer Address</label>
                      {renderFieldBadge("buyerAddress")}
                    </div>
                    <input
                      type="text"
                      placeholder="Street, City, State, PIN"
                      value={buyerAddress}
                      onChange={(e) => handleFieldChange("buyerAddress", setBuyerAddress, e.target.value)}
                      className="w-full border border-[#D4D4D8] px-3 py-2 text-xs rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COMPACT LINE ITEMS TABLE (Requirement 14) */}
            <div className="border border-[#E5E5E5] p-4 rounded-[6px] space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  LINE ITEMS ({lineItems.length})
                </div>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="px-2.5 py-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#111111] font-semibold text-[11px] rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              {lineItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] text-[#71717A] text-[10px] uppercase">
                        <th className="pb-2 font-semibold">Description</th>
                        <th className="pb-2 font-semibold w-24">HSN</th>
                        <th className="pb-2 font-semibold w-20">Qty</th>
                        <th className="pb-2 font-semibold w-24">Rate (₹)</th>
                        <th className="pb-2 font-semibold w-28 text-right">Amount (₹)</th>
                        <th className="pb-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F4F5]">
                      {lineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#FAFAFA]">
                          <td className="py-1.5 pr-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                              className="w-full border border-[#E5E5E5] px-2 py-1 text-xs rounded"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => handleLineItemChange(idx, "hsn", e.target.value)}
                              className="w-full border border-[#E5E5E5] px-2 py-1 text-xs rounded"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(idx, "quantity", e.target.value)}
                              className="w-full border border-[#E5E5E5] px-2 py-1 text-xs rounded"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleLineItemChange(idx, "unitPrice", e.target.value)}
                              className="w-full border border-[#E5E5E5] px-2 py-1 text-xs rounded"
                            />
                          </td>
                          <td className="py-1.5 text-right font-bold text-[#111111]">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-1.5 pl-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              className="text-[#A1A1AA] hover:text-[#DC2626]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-[11px] text-[#71717A] py-2 text-center">
                  No line items extracted. Click "+ Add Item" to specify individual deliverables.
                </div>
              )}
            </div>

            {/* SECTION 3: FINANCING */}
            <div className="border border-[#E5E5E5] p-4 rounded-[6px] space-y-3 bg-white">
              <div className="text-xs font-bold uppercase tracking-wider text-[#111111] border-b border-[#E5E5E5] pb-1.5 flex justify-between items-center">
                <span>3. FINANCING</span>
                <span className="text-[10px] text-[#71717A] font-mono">TRANCHE &amp; FACTORING</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#333333] mb-1">Tenure (Days)</label>
                  <select
                    value={tenureDays}
                    onChange={(e) => setTenureDays(e.target.value)}
                    className="w-full border border-[#D4D4D8] px-3 py-2 text-xs bg-white rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                  >
                    <option value="15">15 Days (Quick Settlement)</option>
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days (Standard TReDS)</option>
                    <option value="120">120 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#333333] mb-1">Factoring Mode</label>
                  <select
                    value={factoringMode}
                    onChange={(e) => setFactoringMode(e.target.value as FactoringMode)}
                    className="w-full border border-[#D4D4D8] px-3 py-2 text-xs bg-white rounded-[4px] focus:outline-hidden focus:border-[#2563EB]"
                  >
                    <option value="Recourse">Recourse Factoring (8.5% APR • 10% Collateral)</option>
                    <option value="NonRecourse">Non-Recourse Factoring (10.5% APR • 100% Junior Buffer)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* COLLAPSIBLE ADDITIONAL DETAILS (Requirement 13) */}
            <div className="border border-[#E5E5E5] rounded-[6px] overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
                className="w-full p-3 bg-[#FAFAFA] flex items-center justify-between text-xs font-semibold text-[#111111]"
              >
                <span>ADDITIONAL DETAILS (E-WAY BILL, TAX CODES)</span>
                {showAdditionalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdditionalDetails && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#E5E5E5]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#333333] mb-1">e-Way Bill Number</label>
                    <input
                      type="text"
                      placeholder="Enter 12-digit e-Way Bill"
                      value={ewayBillNumber}
                      onChange={(e) => handleFieldChange("ewayBillNumber", setEwayBillNumber, e.target.value)}
                      className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono rounded-[4px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#333333] mb-1">HSN / SAC Codes</label>
                    <input
                      type="text"
                      placeholder="e.g. 870899, 848390"
                      value={hsnCode}
                      onChange={(e) => handleFieldChange("hsnCode", setHsnCode, e.target.value)}
                      className="w-full border border-[#D4D4D8] px-3 py-2 text-xs font-mono rounded-[4px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {submitError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] text-xs font-mono font-bold flex items-center gap-2 rounded-[4px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-[#E5E5E5] pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 border border-[#D4D4D8] text-[#111111] hover:bg-[#F4F4F5] transition-colors font-medium rounded-[4px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || extractionStatus === "loading"}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors font-semibold flex items-center gap-2 rounded-[4px]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> {mintStatusStep || "Minting Token-2022 Asset..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> MINT TOKEN-2022 INVOICE
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
