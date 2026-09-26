import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  Send,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Cpu,
  FileSearch,
  Layers,
  Lock,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  Check,
} from "lucide-react";
import {
  FraudInvestigationResult,
  VisualForensicFinding,
  CrossDocumentCheck,
  FraudChatMessage,
  InvoiceRecord,
} from "../types";
import { DEMO_INVOICES, DemoInvoice } from "../data/demoInvoices";
import { normalizeFraudResult } from "../utils/normalizeFraudResult";
import { ErrorBoundary } from "./ErrorBoundary";

interface InvoiceFraudVisionViewProps {
  onProceedToFinancing?: (invoiceData: Partial<InvoiceRecord>) => void;
  onNavigateTab?: (tab: string) => void;
}

export const InvoiceFraudVisionView: React.FC<InvoiceFraudVisionViewProps> = ({
  onProceedToFinancing,
  onNavigateTab,
}) => {
  // State for upload & image preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(DEMO_INVOICES[0].svgDataUrl);
  const [selectedDemo, setSelectedDemo] = useState<DemoInvoice | null>(DEMO_INVOICES[0]);
  const [fileError, setFileError] = useState<string | null>(null);

  // State for analysis execution & animated progress stages
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStageIndex, setAnalysisStageIndex] = useState<number>(-1);
  const [investigationResult, setInvestigationResult] = useState<FraudInvestigationResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Image viewer zoom & highlight state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeHighlightLocation, setActiveHighlightLocation] = useState<string | null>(null);

  // State for "Ask Gemini Why?" modal
  const [whyModalFinding, setWhyModalFinding] = useState<{
    finding: string;
    evidence: string;
    location: string;
  } | null>(null);
  const [whyModalExplanation, setWhyModalExplanation] = useState<string | null>(null);
  const [isAskingWhy, setIsAskingWhy] = useState<boolean>(false);

  // State for contextual Ask Gemini mini-chat
  const [chatMessages, setChatMessages] = useState<FraudChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatSending, setIsChatSending] = useState<boolean>(false);

  // State for editable auto-filled fields
  const [editableInvoice, setEditableInvoice] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    dueDate: "",
    sellerName: "",
    sellerGstin: "",
    sellerAddress: "",
    buyerName: "",
    buyerGstin: "",
    buyerAddress: "",
    poNumber: "",
    ewayBillNumber: "",
    hsnCode: "",
    itemDescription: "",
    subtotal: "",
    cgst: "",
    sgst: "",
    igst: "",
    totalTax: "",
    grandTotal: "",
    paymentTerms: "",
    bankDetails: "",
  });
  const [isTokenizing, setIsTokenizing] = useState<boolean>(false);
  const [tokenizeSuccess, setTokenizeSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-fill editable form fields when Gemini investigation completes
  useEffect(() => {
    if (investigationResult?.invoice) {
      const inv = investigationResult.invoice;
      setEditableInvoice({
        invoiceNumber: inv.invoice_number || "",
        invoiceDate: inv.invoice_date || new Date().toISOString().split("T")[0],
        dueDate: inv.due_date || "",
        sellerName: inv.seller_name || "",
        sellerGstin: inv.seller_gstin || "",
        sellerAddress: inv.seller_address || "",
        buyerName: inv.buyer_name || "",
        buyerGstin: inv.buyer_gstin || "",
        buyerAddress: inv.buyer_address || "",
        poNumber: inv.po_number || "",
        ewayBillNumber: inv.eway_bill_number || "",
        hsnCode: inv.hsn_sac_codes || "87084000",
        itemDescription: inv.line_items?.[0]?.description || "B2B Goods Supply",
        subtotal: inv.subtotal ? String(inv.subtotal) : "",
        cgst: inv.cgst ? String(inv.cgst) : "",
        sgst: inv.sgst ? String(inv.sgst) : "",
        igst: inv.igst ? String(inv.igst) : "",
        totalTax: inv.total_tax ? String(inv.total_tax) : inv.tax_amount ? String(inv.tax_amount) : "",
        grandTotal: inv.total_amount ? String(inv.total_amount) : "",
        paymentTerms: inv.payment_terms || "",
        bankDetails: inv.bank_details || "",
      });
    }
  }, [investigationResult]);

  const handleTokenizeFromOcr = async () => {
    setIsTokenizing(true);
    setTokenizeSuccess(null);
    try {
      const faceVal = Number(editableInvoice.grandTotal) || Number(editableInvoice.subtotal) || 1000000;
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: editableInvoice.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          invoiceDate: editableInvoice.invoiceDate,
          dueDate: editableInvoice.dueDate,
          sellerName: editableInvoice.sellerName || "Supplier Entity",
          sellerGstin: editableInvoice.sellerGstin || "27AAACP1842Q1Z9",
          sellerAddress: editableInvoice.sellerAddress,
          buyerName: editableInvoice.buyerName || "Corporate Buyer",
          buyerGstin: editableInvoice.buyerGstin || "27AAACT2727Q1ZW",
          buyerAddress: editableInvoice.buyerAddress,
          poNumber: editableInvoice.poNumber,
          ewayBillNumber: editableInvoice.ewayBillNumber,
          hsnCode: editableInvoice.hsnCode,
          itemDescription: editableInvoice.itemDescription,
          faceValueInr: faceVal,
          fundedAmountInr: 0,
          cgstInr: Number(editableInvoice.cgst) || 0,
          sgstInr: Number(editableInvoice.sgst) || 0,
          igstInr: Number(editableInvoice.igst) || 0,
          totalTaxInr: Number(editableInvoice.totalTax) || 0,
          paymentTerms: editableInvoice.paymentTerms,
          bankDetails: editableInvoice.bankDetails,
          authenticityScore: 90,
          riskTier: "TIER_A",
        }),
      });

      const data = await res.json();
      if (data.success && data.invoice) {
        setTokenizeSuccess(`Invoice ${data.invoice.invoiceNumber || editableInvoice.invoiceNumber} Tokenized & Stored Successfully!`);
        if (onProceedToFinancing) onProceedToFinancing(data.invoice);
      } else {
        throw new Error(data.error || "Tokenization failed");
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to tokenize invoice");
    } finally {
      setIsTokenizing(false);
    }
  };

  const investigationStages = [
    "Document received",
    "Reading invoice",
    "Extracting fields",
    "Checking totals",
    "Checking dates",
    "Checking GST information",
    "Looking for visual anomalies",
    "Cross-checking transaction data",
    "Generating investigation report",
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Helper to convert SVG Data URL to high-res PNG Data URL for Gemini Vision
  const convertSvgToPng = (svgDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = (img.width || 1000) * 2;
        const height = (img.height || 1400) * 2;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(svgDataUrl);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(svgDataUrl);
      img.src = svgDataUrl;
    });
  };

  // Handle file select (image, PDF, HEIC, HEIF, SVG)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setFileError("File size exceeds 15MB limit. Please upload a smaller document.");
      return;
    }

    const fileType = file.type.toLowerCase();
    const ext = file.name.split(".").pop()?.toLowerCase();
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/svg+xml",
      "application/pdf",
    ];
    const validExts = ["jpg", "jpeg", "png", "webp", "heic", "heif", "svg", "pdf"];

    if (!validTypes.includes(fileType) && (!ext || !validExts.includes(ext))) {
      setFileError("Supported formats are JPG, PNG, WEBP, HEIC, HEIF, SVG, and PDF.");
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    setSelectedDemo(null);
    setInvestigationResult(null);
    setAnalysisError(null);
    setChatMessages([]);
    setActiveHighlightLocation(null);
    setZoomLevel(1);

    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result as string;
      if (fileType === "image/svg+xml" || ext === "svg") {
        try {
          const pngUrl = await convertSvgToPng(rawDataUrl);
          setPreviewUrl(pngUrl);
        } catch {
          setPreviewUrl(rawDataUrl);
        }
      } else {
        setPreviewUrl(rawDataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const pseudoEvent = { target: { files: [file] } } as any;
      handleFileChange(pseudoEvent);
    }
  };

  // Select pre-baked demo invoice
  const handleSelectDemo = (demo: DemoInvoice) => {
    setSelectedDemo(demo);
    setSelectedFile(null);
    setPreviewUrl(demo.svgDataUrl);
    setFileError(null);
    setInvestigationResult(null);
    setAnalysisError(null);
    setChatMessages([]);
    setActiveHighlightLocation(null);
    setZoomLevel(1);
  };

  // Execute Gemini Vision analysis API call with stage animation
  const handleRunInvestigation = async () => {
    if (!previewUrl) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStageIndex(0);
    setInvestigationResult(null);
    setActiveHighlightLocation(null);

    // Stage progress animation timer
    const stageInterval = setInterval(() => {
      setAnalysisStageIndex((prev) => {
        if (prev < investigationStages.length - 1) {
          return prev + 1;
        }
        clearInterval(stageInterval);
        return prev;
      });
    }, 280);

    try {
      let finalBase64 = previewUrl;
      let finalMime = selectedFile?.type || "image/png";

      if (selectedDemo && previewUrl.startsWith("data:image/svg+xml")) {
        try {
          finalBase64 = await convertSvgToPng(previewUrl);
          finalMime = "image/png";
        } catch (err) {
          console.warn("[Demo SVG Convert]", err);
        }
      } else if (selectedFile && (selectedFile.type === "image/svg+xml" || selectedFile.name.endsWith(".svg"))) {
        if (previewUrl.startsWith("data:image/svg+xml")) {
          try {
            finalBase64 = await convertSvgToPng(previewUrl);
            finalMime = "image/png";
          } catch (err) {
            console.warn("[Custom SVG Convert]", err);
          }
        } else {
          finalMime = "image/png";
        }
      }

      const payload: any = {
        demoType: selectedDemo ? selectedDemo.demoType : undefined,
        documentImageBase64: finalBase64,
        mimeType: finalMime,
        referenceData: selectedDemo ? {
          sellerName: "Precision Geartech Auto Ancillaries Pvt Ltd",
          sellerGstin: "27AAACP1842Q1Z9",
          buyerName: "Tata Motors Commercial Vehicle Fleet Division",
          buyerGstin: "27AAACT2727Q1ZW",
          poNumber: selectedDemo?.referencePo || "TM/PUN/CV/PO-98214",
          ewayBillNumber: "281982740192",
        } : {},
      };

      const res = await fetch("/api/oracle/investigate-fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.result) {
        const normalized = normalizeFraudResult(data.result);
        setInvestigationResult(normalized);
        setChatMessages([
          {
            sender: "gemini",
            text: `Hello! I have completed the AI Vision Investigation for invoice ${
              normalized.invoice?.invoice_number || "submitted"
            }. ${
              normalized.risk_assessment?.risk_score !== null
                ? `The risk score is ${normalized.risk_assessment?.risk_score}/100 (${normalized.risk_assessment?.risk_level || "Low"}).`
                : `Document analysis status: ${normalized.document_status || "UNREADABLE"}.`
            } Ask me any questions about the evidence or next steps!`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error(data.error || "Invalid response format from Gemini Vision service");
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to complete investigation");
    } finally {
      clearInterval(stageInterval);
      setAnalysisStageIndex(investigationStages.length - 1);
      setIsAnalyzing(false);
    }
  };

  // Trigger "Ask Gemini Why?" modal
  const handleAskWhy = async (finding: string, evidence: string, location: string) => {
    setWhyModalFinding({ finding, evidence, location });
    setWhyModalExplanation(null);
    setIsAskingWhy(true);

    try {
      const res = await fetch("/api/oracle/ask-why", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finding,
          evidence,
          location,
          invoiceContext: investigationResult,
        }),
      });

      const data = await res.json();
      if (data.success && data.explanation) {
        setWhyModalExplanation(data.explanation);
      } else {
        setWhyModalExplanation("Could not retrieve AI explanation. Please try again.");
      }
    } catch (err: any) {
      setWhyModalExplanation("Failed to connect to Gemini AI explanation service.");
    } finally {
      setIsAskingWhy(false);
    }
  };

  // Send message in Ask Gemini chat
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput.trim();
    if (!textToSend || isChatSending) return;

    const userMsg: FraudChatMessage = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatInput("");
    setIsChatSending(true);

    try {
      const res = await fetch("/api/oracle/fraud-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          invoiceContext: investigationResult,
        }),
      });

      const data = await res.json();
      const geminiReply: FraudChatMessage = {
        sender: "gemini",
        text: data.reply || "I am analyzing your query regarding this invoice.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, geminiReply]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "gemini",
          text: "Sorry, I ran into an issue processing your chat question.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Dynamic severity color helper
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "bg-[#7F1D1D] text-white border border-[#991B1B]";
      case "HIGH":
        return "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]";
      case "MEDIUM":
        return "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]";
      case "LOW":
      default:
        return "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]";
    }
  };

  // Risk Score Ring color helper
  const getRiskScoreColor = (score: number | null) => {
    if (score === null) return "#71717A";
    if (score <= 20) return "#059669";
    if (score <= 40) return "#EAB308";
    if (score <= 60) return "#F97316";
    if (score <= 80) return "#DC2626";
    return "#7F1D1D";
  };

  return (
    <ErrorBoundary onReset={() => setInvestigationResult(null)}>
      <div className="space-y-8 font-mono text-xs">
      {/* SCREEN 1 - Top Header Card */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-[11px] font-mono uppercase text-[#71717A] tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
              MULTIMODAL AI INVESTIGATOR // GEMINI VISION
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] font-mono mt-1">
              AI Invoice Fraud Investigator
            </h2>
            <p className="text-xs text-[#52525B] font-sans mt-1">
              Upload an invoice and let Gemini Vision investigate authenticity, inconsistencies, and fraud signals.
            </p>
          </div>

          {investigationResult && (
            <span
              className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest border ${
                investigationResult.execution_mode === "AI Vision Analysis"
                  ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]"
                  : investigationResult.execution_mode === "Rule-Based Fallback"
                  ? "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]"
                  : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 inline mr-1" />
              {investigationResult.execution_mode === "AI Vision Analysis"
                ? "Gemini Vision"
                : investigationResult.execution_mode === "Rule-Based Fallback"
                ? "Rule-Based Fallback"
                : "Analysis Unavailable"}
            </span>
          )}
        </div>

        {/* Demo Invoice Sample Selector Bar */}
        <div className="pt-4 space-y-2">
          <div className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
            OR TRY PRE-LOADED DEMO INVOICES (HACKATHON DEMO MODE):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO_INVOICES.map((demo) => {
              const isSelected = selectedDemo?.id === demo.id;
              return (
                <button
                  key={demo.id}
                  onClick={() => handleSelectDemo(demo)}
                  className={`p-3 text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-[#0A0A0A] bg-[#F4F4F5] shadow-sm"
                      : "border-[#E4E4E7] bg-white hover:border-[#A1A1AA]"
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#0A0A0A] flex items-center justify-between">
                      <span>{demo.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#059669]" />}
                    </div>
                    <div className="text-[10px] text-[#52525B] font-sans mt-1 line-clamp-2">
                      {demo.description}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-[#E4E4E7]">
                    <span className="text-[10px] text-[#71717A]">Face Value: {demo.faceValue}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 uppercase ${
                        demo.demoType === "clean"
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : demo.demoType === "mismatch"
                          ? "bg-[#FEF2F2] text-[#DC2626]"
                          : "bg-[#7F1D1D] text-white"
                      }`}
                    >
                      {demo.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Zone & Controls */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="md:col-span-8 border-2 border-dashed border-[#A1A1AA] hover:border-[#0A0A0A] bg-[#FAFAFA] hover:bg-[#F4F4F5] p-5 text-center cursor-pointer transition-all space-y-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/svg+xml,application/pdf,.heic,.heif,.svg"
              className="hidden"
            />
            <Upload className="w-6 h-6 mx-auto text-[#71717A]" />
            <div className="font-bold text-[#0A0A0A]">
              {selectedFile ? selectedFile.name : "Drag & drop invoice file here, or click to browse"}
            </div>
            <div className="text-[10px] text-[#71717A]">
              Supported Formats: JPG, PNG, WEBP, HEIC, HEIF, SVG, PDF (Max 15MB)
            </div>
          </div>

          <div className="md:col-span-4 space-y-3">
            <button
              onClick={handleRunInvestigation}
              disabled={isAnalyzing || !previewUrl}
              className={`w-full py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 shadow-md ${
                isAnalyzing
                  ? "bg-[#71717A] cursor-not-allowed"
                  : "bg-[#0A0A0A] hover:bg-[#27272A]"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> SCANNING WITH GEMINI VISION...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#059669]" /> 🔍 INVESTIGATE WITH GEMINI
                </>
              )}
            </button>

            {selectedFile && (
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(DEMO_INVOICES[0].svgDataUrl);
                  setSelectedDemo(DEMO_INVOICES[0]);
                  setInvestigationResult(null);
                }}
                className="w-full py-2 border border-[#E4E4E7] text-[#71717A] hover:text-[#0A0A0A] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Remove Custom Upload
              </button>
            )}
          </div>
        </div>

        {fileError && (
          <div className="mt-3 p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {/* Security & Privacy Disclaimer */}
        <div className="mt-4 p-3 bg-[#F8F9FA] border border-[#E4E4E7] text-[10px] text-[#71717A] flex items-center justify-between gap-2 font-sans">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#059669] shrink-0" />
            Your document is analyzed by Gemini AI for this hackathon prototype. Do not upload unnecessary sensitive personal information.
          </span>
          <span className="font-mono text-[9px] uppercase font-bold text-[#A1A1AA]">
            CONFIDENTIAL // LOCAL EVALUATION ONLY
          </span>
        </div>
      </div>

      {/* SCREEN 3 - Animated Investigation Progress */}
      {isAnalyzing && (
        <div className="border border-[#0A0A0A] bg-white p-6 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
            <div className="font-extrabold text-[#0A0A0A] text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#2563EB] animate-spin" />
              GEMINI VISION MULTIMODAL FORENSIC AUDIT IN PROGRESS
            </div>
            <span className="font-bold text-[#2563EB]">
              STAGE {analysisStageIndex + 1} OF {investigationStages.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#E4E4E7] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0A0A0A] h-full transition-all duration-300"
              style={{
                width: `${((analysisStageIndex + 1) / investigationStages.length) * 100}%`,
              }}
            ></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            {investigationStages.map((stage, idx) => {
              const isDone = idx < analysisStageIndex;
              const isCurrent = idx === analysisStageIndex;
              return (
                <div
                  key={idx}
                  className={`p-2 border text-[11px] flex items-center gap-2 ${
                    isDone
                      ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]"
                      : isCurrent
                      ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] font-bold animate-pulse"
                      : "bg-[#FAFAFA] border-[#E4E4E7] text-[#A1A1AA]"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#059669]" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin text-[#2563EB]" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-[#A1A1AA] inline-block shrink-0"></span>
                  )}
                  <span>{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {analysisError && (
        <div className="border-2 border-[#DC2626] bg-[#FEF2F2] p-6 space-y-4 font-mono text-xs shadow-md">
          <div className="flex items-center gap-3 text-[#DC2626] border-b border-[#FECACA] pb-3">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-extrabold text-sm uppercase tracking-wider">ANALYSIS FAILED</div>
              <div className="text-[11px] text-[#991B1B] font-sans mt-0.5">
                Gemini Vision could not complete the forensic analysis.
              </div>
            </div>
          </div>

          <div className="bg-white p-3 border border-[#FECACA] text-[#7F1D1D] font-mono text-[11px]">
            <strong>Error Message:</strong> {analysisError}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleRunInvestigation}
              className="py-2.5 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> RETRY ANALYSIS
            </button>
            {selectedFile && (
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(DEMO_INVOICES[0].svgDataUrl);
                  setSelectedDemo(DEMO_INVOICES[0]);
                  setInvestigationResult(null);
                  setAnalysisError(null);
                }}
                className="py-2.5 px-4 bg-white border border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> REMOVE UPLOAD
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN DUAL PANELS: LEFT INVOICE PREVIEW / RIGHT RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Interactive Invoice Document Preview (5/12) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-[#0A0A0A] bg-white p-4 space-y-3 sticky top-20">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2 font-mono text-xs">
              <span className="font-bold text-[#0A0A0A] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#2563EB]" /> INVOICE DOCUMENT PREVIEW
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(0.7, prev - 0.2))}
                  className="p-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold px-1.5">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(2.0, prev + 0.2))}
                  className="p-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setActiveHighlightLocation(null);
                  }}
                  className="p-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] rounded"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Render Canvas with Dynamic Highlight Overlays */}
            <div className="relative border border-[#E4E4E7] bg-[#52525B] min-h-[460px] max-h-[640px] overflow-auto flex items-center justify-center p-2">
              {previewUrl ? (
                <div
                  className="relative transition-transform duration-200 shadow-2xl bg-white"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
                >
                  <img
                    src={previewUrl}
                    alt="Invoice Preview"
                    className="w-full max-w-full h-auto block"
                  />

                  {/* Interactive Dynamic Bounding Highlight Banner Overlay */}
                  {activeHighlightLocation && (
                    <div className="absolute inset-0 pointer-events-none border-4 border-[#DC2626] bg-[#DC2626]/10 animate-pulse flex items-center justify-center">
                      <div className="bg-[#0A0A0A] text-white px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider shadow-lg border border-[#DC2626]">
                        🎯 HIGHLIGHTED SIGNAL LOCATION: {activeHighlightLocation.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-white text-center font-mono text-xs space-y-2 p-8">
                  <FileSearch className="w-10 h-10 mx-auto text-[#A1A1AA]" />
                  <div>No invoice document loaded</div>
                </div>
              )}
            </div>

            {activeHighlightLocation && (
              <div className="p-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[10px] font-mono flex items-center justify-between">
                <span>Selected Area Highlighted on Invoice: <strong>{activeHighlightLocation}</strong></span>
                <button
                  onClick={() => setActiveHighlightLocation(null)}
                  className="text-[#DC2626] hover:underline font-bold"
                >
                  Clear Highlight
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: AI Investigation Dashboard & Findings (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          {investigationResult ? (
            <>
              {/* SECTION 9 - Risk Score Ring Gauge & Executive Summary */}
              <div className="border border-[#0A0A0A] bg-white p-6 space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[#E4E4E7] pb-5">
                  {/* Gauge */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#E4E4E7"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={getRiskScoreColor(investigationResult.risk_assessment?.risk_score ?? null)}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={251.2}
                          strokeDashoffset={
                            investigationResult.risk_assessment?.risk_score !== null && investigationResult.risk_assessment?.risk_score !== undefined
                              ? 251.2 - (251.2 * investigationResult.risk_assessment.risk_score) / 100
                              : 251.2
                          }
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <div
                          className="text-2xl font-extrabold font-mono"
                          style={{
                            color: getRiskScoreColor(investigationResult.risk_assessment?.risk_score ?? null),
                          }}
                        >
                          {investigationResult.risk_assessment?.risk_score !== null && investigationResult.risk_assessment?.risk_score !== undefined
                            ? investigationResult.risk_assessment.risk_score
                            : "--"}
                        </div>
                        <div className="text-[8px] font-mono uppercase text-[#71717A]">
                          {investigationResult.risk_assessment?.risk_score !== null && investigationResult.risk_assessment?.risk_score !== undefined ? "/ 100" : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">
                        AI INVESTIGATION RISK SCORE
                      </div>
                      <div className="text-xl font-extrabold text-[#0A0A0A] uppercase tracking-tight">
                        {investigationResult.risk_assessment?.risk_level || "UNDETERMINED"} Risk Level
                      </div>
                      <div className="text-[11px] text-[#52525B] mt-0.5">
                        {investigationResult.execution_mode === "AI Vision Analysis"
                          ? "Gemini Confidence Score: "
                          : investigationResult.execution_mode === "Rule-Based Fallback"
                          ? "Fallback Confidence: "
                          : "Confidence: "}
                        <strong>
                          {investigationResult.risk_assessment?.confidence !== null && investigationResult.risk_assessment?.confidence !== undefined
                            ? `${investigationResult.risk_assessment.confidence}%`
                            : "Unavailable"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-[#71717A] uppercase font-bold">DOCUMENT STATUS</div>
                    <div
                      className={`text-sm font-extrabold flex items-center gap-1 justify-end ${
                        investigationResult.document_status === "READABLE" || investigationResult.document_status === "ANALYZED"
                          ? "text-[#059669]"
                          : "text-[#DC2626]"
                      }`}
                    >
                      {investigationResult.document_status === "READABLE" || investigationResult.document_status === "ANALYZED" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                      )}
                      {investigationResult.document_status || "ANALYZED"}
                    </div>
                    <div className="text-[10px] text-[#71717A] mt-1">
                      Mode: <span className="font-bold text-[#0A0A0A]">{investigationResult.execution_mode}</span>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-[#F8F9FA] p-4 border border-[#E4E4E7] space-y-1.5">
                  <div className="text-[10px] text-[#71717A] uppercase font-bold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                    AI INVESTIGATION SUMMARY
                  </div>
                  <p className="text-xs text-[#0A0A0A] font-sans leading-relaxed">
                    {investigationResult.investigation_summary || "Gemini forensic inspection completed."}
                  </p>
                  <p className="text-[11px] text-[#52525B] font-sans pt-1 border-t border-[#E4E4E7]">
                    <strong>Reasoning:</strong> {investigationResult.risk_assessment?.reasoning || "Verified by Gemini Vision."}
                  </p>
                </div>
              </div>

              {/* SECTION 4 - Extracted Structured Invoice Data */}
              <div className="border border-[#E4E4E7] bg-white p-5 space-y-4">
                <div className="text-[10px] text-[#71717A] uppercase font-bold border-b border-[#E4E4E7] pb-2 flex items-center justify-between">
                  <span>EXTRACTED INVOICE INFORMATION</span>
                  <span className="text-[#059669]">GEMINI VISION OCR DATA</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">INVOICE NO</div>
                    <div className="font-bold text-[#0A0A0A]">{investigationResult.invoice?.invoice_number || "NOT VISIBLE"}</div>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">INVOICE DATE</div>
                    <div className="font-bold text-[#0A0A0A]">{investigationResult.invoice?.invoice_date || "NOT VISIBLE"}</div>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">SUPPLIER (SELLER)</div>
                    <div className="font-bold text-[#0A0A0A] truncate">{investigationResult.invoice?.seller_name || "NOT VISIBLE"}</div>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">SELLER GSTIN</div>
                    <div className="font-bold text-[#0A0A0A]">{investigationResult.invoice?.seller_gstin || "NOT VISIBLE"}</div>
                  </div>

                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">ENTERPRISE BUYER</div>
                    <div className="font-bold text-[#2563EB] truncate">{investigationResult.invoice?.buyer_name || "NOT VISIBLE"}</div>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">BUYER GSTIN</div>
                    <div className="font-bold text-[#0A0A0A]">{investigationResult.invoice?.buyer_gstin || "NOT VISIBLE"}</div>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">PURCHASE ORDER</div>
                    <div className="font-bold text-[#0A0A0A]">{investigationResult.invoice?.po_number || "NOT VISIBLE"}</div>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">e-WAY BILL NO</div>
                    <div className="font-bold text-[#059669]">{investigationResult.invoice?.eway_bill_number || "NOT VISIBLE"}</div>
                  </div>
                </div>

                {/* AUTO-FILLED EDITABLE INVOICE FORM (REVIEW & TOKENIZE) */}
                <div className="border border-[#2563EB] bg-[#F4F6FF] p-4 space-y-4 rounded-[4px] mt-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#BFDBFE] pb-2">
                    <span className="font-bold text-[#2563EB] uppercase flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-[#2563EB]" /> AUTO-FILLED INVOICE FORM — REVIEW &amp; EDIT FIELDS
                    </span>
                    <span className="text-[10px] text-[#71717A]">USER VERIFICATION PHASE</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Invoice Number</label>
                      <input
                        type="text"
                        value={editableInvoice.invoiceNumber}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, invoiceNumber: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Invoice Date</label>
                      <input
                        type="text"
                        value={editableInvoice.invoiceDate}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, invoiceDate: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Due Date</label>
                      <input
                        type="text"
                        value={editableInvoice.dueDate}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, dueDate: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Seller Name</label>
                      <input
                        type="text"
                        value={editableInvoice.sellerName}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, sellerName: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Seller GSTIN</label>
                      <input
                        type="text"
                        value={editableInvoice.sellerGstin}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, sellerGstin: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Seller Address</label>
                      <input
                        type="text"
                        value={editableInvoice.sellerAddress}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, sellerAddress: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Buyer Name</label>
                      <input
                        type="text"
                        value={editableInvoice.buyerName}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, buyerName: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs font-bold text-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Buyer GSTIN</label>
                      <input
                        type="text"
                        value={editableInvoice.buyerGstin}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, buyerGstin: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Buyer Address</label>
                      <input
                        type="text"
                        value={editableInvoice.buyerAddress}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, buyerAddress: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">PO Number</label>
                      <input
                        type="text"
                        value={editableInvoice.poNumber}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, poNumber: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">e-Way Bill Number</label>
                      <input
                        type="text"
                        value={editableInvoice.ewayBillNumber}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, ewayBillNumber: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs font-bold text-[#059669]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Grand Total Face Value (₹)</label>
                      <input
                        type="text"
                        value={editableInvoice.grandTotal}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, grandTotal: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs font-extrabold text-[#059669]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Subtotal (₹)</label>
                      <input
                        type="text"
                        value={editableInvoice.subtotal}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, subtotal: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">CGST / SGST / IGST</label>
                      <input
                        type="text"
                        value={editableInvoice.totalTax || editableInvoice.cgst}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, totalTax: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs"
                        placeholder="Tax Amount"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Payment Terms</label>
                      <input
                        type="text"
                        value={editableInvoice.paymentTerms}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, paymentTerms: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs"
                        placeholder="Net 90 Days"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#71717A] uppercase font-bold mb-1">Bank Details</label>
                      <input
                        type="text"
                        value={editableInvoice.bankDetails}
                        onChange={(e) => setEditableInvoice({ ...editableInvoice, bankDetails: e.target.value })}
                        className="w-full border border-[#0A0A0A] p-1.5 bg-white text-xs"
                        placeholder="IFSC / A/C No"
                      />
                    </div>
                  </div>

                  {tokenizeSuccess && (
                    <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-bold text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{tokenizeSuccess}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleTokenizeFromOcr}
                      disabled={isTokenizing}
                      className="py-2.5 px-6 bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 rounded-[4px] shadow-md"
                    >
                      {isTokenizing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> TOKENIZING &amp; STORING INVOICE...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> TOKENIZE &amp; STORE INVOICE IN LEDGER
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 6 - Financial Validation */}
              <div className="border border-[#E4E4E7] bg-white p-5 space-y-3">
                <div className="text-[10px] text-[#71717A] uppercase font-bold border-b border-[#E4E4E7] pb-2 flex items-center justify-between">
                  <span>FINANCIAL CONSISTENCY VALIDATION</span>
                  <span
                    className={`font-bold px-2 py-0.5 uppercase ${
                      (investigationResult.financial_validation?.calculation_status || "PASS") === "PASS"
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : "bg-[#FEF2F2] text-[#DC2626]"
                    }`}
                  >
                    {investigationResult.financial_validation?.calculation_status || "PASS"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">EXTRACTED SUBTOTAL</div>
                    <div className="font-bold text-[#0A0A0A]">
                      {investigationResult.invoice?.subtotal
                        ? `₹${investigationResult.invoice.subtotal.toLocaleString("en-IN")}`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">GST TAX AMOUNT</div>
                    <div className="font-bold text-[#0A0A0A]">
                      {investigationResult.invoice?.tax_amount
                        ? `₹${investigationResult.invoice.tax_amount.toLocaleString("en-IN")}`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">EXPECTED TOTAL</div>
                    <div className="font-bold text-[#0A0A0A]">
                      {investigationResult.financial_validation?.expected_total
                        ? `₹${investigationResult.financial_validation.expected_total.toLocaleString("en-IN")}`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 border border-[#E4E4E7]">
                    <div className="text-[10px] text-[#71717A]">DISPLAYED TOTAL</div>
                    <div
                      className={`font-bold ${
                        investigationResult.financial_validation?.difference && investigationResult.financial_validation.difference !== 0
                          ? "text-[#DC2626]"
                          : "text-[#059669]"
                      }`}
                    >
                      {investigationResult.financial_validation?.displayed_total
                        ? `₹${investigationResult.financial_validation.displayed_total.toLocaleString("en-IN")}`
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {(investigationResult.financial_validation?.findings || []).map((finding, idx) => (
                  <div key={idx} className="p-2.5 bg-[#FAFAFA] border border-[#E4E4E7] text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                    <span>{finding}</span>
                  </div>
                ))}
              </div>

              {/* SECTION 5 - Visual Forensics */}
              <div className="border border-[#E4E4E7] bg-white p-5 space-y-3">
                <div className="text-[10px] text-[#71717A] uppercase font-bold border-b border-[#E4E4E7] pb-2 flex items-center justify-between">
                  <span>VISUAL FORENSICS &amp; TAMPERING SIGNALS</span>
                  <span className="text-[#71717A]">{(investigationResult.visual_forensics || []).length} SIGNALS DETECTED</span>
                </div>

                <div className="space-y-2.5">
                  {(investigationResult.visual_forensics || []).map((vf, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveHighlightLocation(vf.location)}
                      className="p-3 bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#E4E4E7] space-y-2 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-[#0A0A0A] flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{vf.finding}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${getSeverityBadgeClass(vf.severity || "LOW")}`}>
                          {vf.severity || "LOW"}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#52525B] font-sans leading-relaxed">
                        <strong>Evidence:</strong> {vf.evidence}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#71717A] pt-1 border-t border-[#E4E4E7]">
                        <span>📍 Location: <strong>{vf.location}</strong></span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAskWhy(vf.finding, vf.evidence, vf.location);
                          }}
                          className="px-2 py-1 bg-[#0A0A0A] text-white hover:bg-[#27272A] font-bold text-[10px] flex items-center gap-1"
                        >
                          <HelpCircle className="w-3 h-3 text-[#EAB308]" /> Ask Gemini Why?
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 7 - Cross-Document Check */}
              <div className="border border-[#E4E4E7] bg-white p-5 space-y-3">
                <div className="text-[10px] text-[#71717A] uppercase font-bold border-b border-[#E4E4E7] pb-2">
                  CROSS-DOCUMENT TRANSACTION CORROBORATION
                </div>

                <div className="space-y-2 text-[11px]">
                  {(investigationResult.cross_document_checks || []).map((cd, idx) => (
                    <div key={idx} className="p-3 bg-[#F8F9FA] border border-[#E4E4E7] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0A0A0A]">{cd.field}</span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold ${
                            cd.status === "MATCH" ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"
                          }`}
                        >
                          {cd.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#52525B]">
                        <div>Invoice Value: <strong className="text-[#0A0A0A]">{cd.invoice_value}</strong></div>
                        <div>Reference Value: <strong className="text-[#0A0A0A]">{cd.reference_value}</strong></div>
                      </div>
                      <div className="text-[10px] text-[#71717A] pt-1">{cd.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 8 - Duplicate Invoice Check */}
              <div className="border border-[#E4E4E7] bg-white p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#71717A] uppercase font-bold">DUPLICATE / REUSED INVOICE CHECK</div>
                  <div className="text-xs text-[#0A0A0A] font-sans mt-0.5">{investigationResult.duplicate_check?.explanation || "No duplicate detected."}</div>
                </div>
                <span
                  className={`px-3 py-1 text-[10px] font-bold uppercase ${
                    (investigationResult.duplicate_check?.status || "UNIQUE") === "UNIQUE"
                      ? "bg-[#ECFDF5] text-[#059669]"
                      : "bg-[#FEF2F2] text-[#DC2626]"
                  }`}
                >
                  {investigationResult.duplicate_check?.status || "UNIQUE"}
                </span>
              </div>

              {/* SECTION 12 & 21 - Recommended Actions & Financing Connection */}
              <div className="border border-[#0A0A0A] bg-white p-6 space-y-4">
                <div className="text-[10px] text-[#71717A] uppercase font-bold border-b border-[#E4E4E7] pb-2">
                  RECOMMENDED NEXT VERIFICATION ACTIONS
                </div>

                <div className="space-y-1.5">
                  {(investigationResult.recommended_actions || []).map((act, idx) => (
                    <div key={idx} className="p-2.5 bg-[#FAFAFA] border border-[#E4E4E7] text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>

                {/* Financing Action Banner */}
                {(() => {
                  const score = investigationResult.risk_assessment?.risk_score;
                  const isEligible = score !== null && score !== undefined && score <= 30;
                  const isModerate = score !== null && score !== undefined && score > 30 && score <= 60;
                  return (
                    <div
                      className={`p-5 border-2 space-y-3 ${
                        isEligible
                          ? "bg-[#ECFDF5] border-[#059669]"
                          : isModerate
                          ? "bg-[#FFFBEB] border-[#D97706]"
                          : "bg-[#FEF2F2] border-[#DC2626]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-extrabold text-sm text-[#0A0A0A] uppercase tracking-wide">
                            {isEligible
                              ? "✅ Eligible for Simulated Solana Invoice Financing"
                              : isModerate
                              ? "⚠️ Additional PO Verification Recommended"
                              : score === null || score === undefined
                              ? "🚨 Document Analysis Unavailable - Manual Verification Required"
                              : "🚨 Manual Compliance Review Required Before Financing"}
                          </div>
                          <p className="text-xs text-[#52525B] font-sans mt-1">
                            {isEligible
                              ? "All document authenticity checks passed. This invoice is ready to be tokenized into Solana Token-2022 multi-tranche vaults."
                              : score === null || score === undefined
                              ? "Gemini Vision was unable to parse structured text from this document. Please re-upload a clear image or proceed with manual entry."
                              : "High risk flags detected. Disbursing liquidity without resolving discrepancies could cause buyer refusal on maturity."}
                          </p>
                        </div>
                      </div>

                      {isEligible && (
                        <button
                          onClick={() => {
                            if (onProceedToFinancing) {
                              onProceedToFinancing({
                                invoiceNumber: investigationResult.invoice?.invoice_number || undefined,
                                sellerName: investigationResult.invoice?.seller_name || undefined,
                                sellerGstin: investigationResult.invoice?.seller_gstin || undefined,
                                buyerName: investigationResult.invoice?.buyer_name || undefined,
                                buyerGstin: investigationResult.invoice?.buyer_gstin || undefined,
                                faceValueInr: investigationResult.invoice?.total_amount || undefined,
                                poNumber: investigationResult.invoice?.po_number || undefined,
                                ewayBillNumber: investigationResult.invoice?.eway_bill_number || undefined,
                              });
                            }
                            if (onNavigateTab) {
                              onNavigateTab("exchange");
                            }
                          }}
                          className="w-full py-3 bg-[#0A0A0A] text-white hover:bg-[#27272A] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                          PROCEED TO SIMULATED SOLANA TOKENIZATION &amp; FUNDING <ArrowRight className="w-4 h-4 text-[#059669]" />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 27 - Contextual Ask Gemini Mini-Chat */}
              <div className="border border-[#0A0A0A] bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
                  <span className="font-bold text-[#0A0A0A] flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#2563EB]" /> ASK GEMINI CONTEXTUAL ASSISTANT
                  </span>
                  <span className="text-[10px] text-[#71717A]">POWERED BY GEMINI AI</span>
                </div>

                {/* Suggestion Chips */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <button
                    onClick={() => handleSendChatMessage("Why is this invoice risky?")}
                    className="px-2.5 py-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] border border-[#E4E4E7] rounded"
                  >
                    "Why is this invoice risky?"
                  </button>
                  <button
                    onClick={() => handleSendChatMessage("Could this be a legitimate mistake?")}
                    className="px-2.5 py-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] border border-[#E4E4E7] rounded"
                  >
                    "Could this be a legitimate mistake?"
                  </button>
                  <button
                    onClick={() => handleSendChatMessage("What should I verify first?")}
                    className="px-2.5 py-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#0A0A0A] border border-[#E4E4E7] rounded"
                  >
                    "What should I verify first?"
                  </button>
                </div>

                {/* Message Log */}
                <div className="bg-[#F8F9FA] border border-[#E4E4E7] p-3 max-h-56 overflow-y-auto space-y-3 font-sans text-xs">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div className="text-[9px] text-[#71717A] font-mono mb-0.5">
                        {msg.sender === "user" ? "YOU" : "GEMINI INVESTIGATOR"} • {msg.timestamp}
                      </div>
                      <div
                        className={`p-3 max-w-[85%] leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-[#0A0A0A] text-white"
                            : "bg-white text-[#0A0A0A] border border-[#E4E4E7]"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                    placeholder="Ask Gemini anything about this invoice..."
                    className="flex-1 border border-[#0A0A0A] p-2.5 bg-white text-xs font-mono"
                  />
                  <button
                    onClick={() => handleSendChatMessage()}
                    disabled={isChatSending}
                    className="px-4 py-2.5 bg-[#0A0A0A] text-white hover:bg-[#27272A] font-bold text-xs uppercase tracking-wider flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="border border-[#0A0A0A] bg-white p-12 text-center text-[#71717A] space-y-4">
              <FileSearch className="w-12 h-12 mx-auto text-[#A1A1AA]" />
              <div className="font-bold text-[#0A0A0A] text-base font-mono">
                AWAITING GEMINI VISION INVESTIGATION
              </div>
              <p className="max-w-md mx-auto text-xs font-sans">
                Select one of the pre-loaded demo invoices above, or upload a custom invoice file and click <strong>"🔍 INVESTIGATE WITH GEMINI"</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 11 - "ASK GEMINI WHY?" EXPLAINABILITY MODAL */}
      {whyModalFinding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
          <div className="bg-white border-2 border-[#0A0A0A] max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setWhyModalFinding(null)}
              className="absolute top-4 right-4 text-[#71717A] hover:text-[#0A0A0A]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E4E4E7] pb-3">
              <div className="text-[10px] text-[#71717A] uppercase font-bold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#EAB308]" />
                ASK GEMINI WHY? // EXPLAINABLE FRAUD RISK BREAKDOWN
              </div>
              <h3 className="text-lg font-bold text-[#0A0A0A] mt-1">{whyModalFinding.finding}</h3>
            </div>

            <div className="p-3 bg-[#F8F9FA] border border-[#E4E4E7] space-y-1">
              <div><strong>Location:</strong> {whyModalFinding.location}</div>
              <div><strong>Observed Evidence:</strong> {whyModalFinding.evidence}</div>
            </div>

            {isAskingWhy ? (
              <div className="py-8 text-center text-[#71717A] space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#2563EB]" />
                <div>Generating plain-language explainability report with Gemini AI...</div>
              </div>
            ) : (
              <div className="font-sans leading-relaxed space-y-3 text-xs text-[#0A0A0A] bg-white p-4 border border-[#E4E4E7]">
                {whyModalExplanation?.split("\n\n").map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-[#E4E4E7]">
              <button
                onClick={() => setWhyModalFinding(null)}
                className="px-4 py-2 bg-[#0A0A0A] text-white font-bold text-xs uppercase tracking-wider"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};
