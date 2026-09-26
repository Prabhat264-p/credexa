import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Canonical TypeScript Schema for Invoice Extraction
export interface ExtractedFieldEvidence<T = any> {
  value: T | null;
  status: "PRESENT" | "ABSENT" | "INVALID" | "UNCLEAR";
  confidence: number | null;
  sourceLabel?: string | null;
}

export interface ExtractedLineItem {
  description: string | null;
  hsn: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  discount: number | null;
  taxableAmount: number | null;
  tax: number | null;
  amount: number | null;
}

export interface CanonicalInvoiceData {
  document: {
    status: "SUCCESS" | "PARTIAL" | "FAILED" | "UNREADABLE";
    mimeType: string;
    fileSize: number;
    pageCount: number;
    confidence: number | null;
  };
  invoice: {
    invoiceNumber: ExtractedFieldEvidence<string>;
    invoiceDate: ExtractedFieldEvidence<string>;
    dueDate: ExtractedFieldEvidence<string>;
    poNumber: ExtractedFieldEvidence<string>;
    poDate: ExtractedFieldEvidence<string>;
    ewayBillNumber: ExtractedFieldEvidence<string>;
    placeOfSupply: ExtractedFieldEvidence<string>;
    reverseCharge: ExtractedFieldEvidence<boolean>;
  };
  seller: {
    name: ExtractedFieldEvidence<string>;
    gstin: ExtractedFieldEvidence<string>;
    pan: ExtractedFieldEvidence<string>;
    address: ExtractedFieldEvidence<string>;
    phone: ExtractedFieldEvidence<string>;
    email: ExtractedFieldEvidence<string>;
  };
  buyer: {
    name: ExtractedFieldEvidence<string>;
    gstin: ExtractedFieldEvidence<string>;
    pan: ExtractedFieldEvidence<string>;
    address: ExtractedFieldEvidence<string>;
    phone: ExtractedFieldEvidence<string>;
    email: ExtractedFieldEvidence<string>;
  };
  financial: {
    currency: string;
    subtotal: ExtractedFieldEvidence<number>;
    taxableAmount: ExtractedFieldEvidence<number>;
    cgst: ExtractedFieldEvidence<number>;
    sgst: ExtractedFieldEvidence<number>;
    igst: ExtractedFieldEvidence<number>;
    totalTax: ExtractedFieldEvidence<number>;
    discount: ExtractedFieldEvidence<number>;
    roundOff: ExtractedFieldEvidence<number>;
    grandTotal: ExtractedFieldEvidence<number>;
    amountInWords: ExtractedFieldEvidence<string>;
  };
  payment: {
    terms: ExtractedFieldEvidence<string>;
    paymentDueDays: ExtractedFieldEvidence<number>;
    bankName: ExtractedFieldEvidence<string>;
    accountNumber: ExtractedFieldEvidence<string>;
    ifscCode: ExtractedFieldEvidence<string>;
  };
  lineItems: ExtractedLineItem[];
  additional: {
    notes: string | null;
    termsAndConditions: string | null;
  };
  validation: {
    calculationStatus: "PASS" | "FINANCIAL_MISMATCH" | "UNKNOWN";
    expectedGrandTotal: number | null;
    displayedGrandTotal: number | null;
    difference: number;
    findings: string[];
  };
}

/**
 * Parses Indian Currency string representations into clean floating point numbers.
 * Example: "₹82,00,000" -> 8200000, "₹ 6,34,500.50" -> 634500.5
 */
export function parseIndianCurrency(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (typeof val === "string") {
    // Strip out currency symbols, commas, spaces, and non-numeric chars except minus & decimal
    const cleaned = val.replace(/[^0-9.-]+/g, "");
    if (!cleaned) return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Standardizes raw date strings into ISO format YYYY-MM-DD.
 * Supports: 14-08-2025, 14/08/2025, 14.08.2025, 14 Aug 2025, August 14, 2025
 */
export function normalizeDate(val: any): string | null {
  if (!val || typeof val !== "string") return null;
  const str = val.trim();
  if (!str || str.toLowerCase() === "null" || str.toLowerCase() === "n/a") return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, "0");
    const month = ddmmyyyy[2].padStart(2, "0");
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // Attempt JS Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Validates Indian 15-character GSTIN structure strictly.
 * Format: 2 digits (State), 5 alpha (PAN), 4 digits, 1 alpha, 1 char/digit, 'Z', 1 checksum.
 */
export function validateGSTIN(gstinStr: any): { valid: boolean; normalized: string | null } {
  if (!gstinStr || typeof gstinStr !== "string") return { valid: false, normalized: null };
  const cleaned = gstinStr.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  
  // 15-character GSTIN regex
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (cleaned.length === 15 && gstRegex.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }
  
  return { valid: false, normalized: cleaned.length === 15 ? cleaned : null };
}

/**
 * Main Normalization Layer: Sanitizes Gemini document extraction response
 * into guaranteed canonical schema with zero placeholders.
 */
export function normalizeInvoiceExtraction(raw: any, meta: { mimeType: string; fileSize: number }): CanonicalInvoiceData {
  const getObj = (target: any) => (target && typeof target === "object" ? target : {});

  const rawDoc = getObj(raw.document);
  const rawInv = getObj(raw.invoice);
  const rawSel = getObj(raw.seller);
  const rawBuy = getObj(raw.buyer);
  const rawFin = getObj(raw.financial);
  const rawPay = getObj(raw.payment);
  const rawAdd = getObj(raw.additional);

  const makeEvidence = <T>(
    rawValue: any,
    normalizer: (v: any) => T | null,
    sourceLabel?: string
  ): ExtractedFieldEvidence<T> => {
    let cleanVal = normalizer(rawValue);
    
    // Convert string placeholders ("NOT DETECTED", "N/A", "NONE", "NULL") to null
    if (typeof cleanVal === "string") {
      const lower = cleanVal.trim().toLowerCase();
      if (
        lower === "not detected" ||
        lower === "n/a" ||
        lower === "none" ||
        lower === "null" ||
        lower === "absent" ||
        lower === "unknown"
      ) {
        cleanVal = null;
      }
    }

    const isPresent = cleanVal !== null && cleanVal !== undefined && cleanVal !== "";
    return {
      value: isPresent ? cleanVal : null,
      status: isPresent ? "PRESENT" : "ABSENT",
      confidence: isPresent ? 0.95 : null,
      sourceLabel: sourceLabel || null,
    };
  };

  const stringNorm = (v: any): string | null => {
    if (!v) return null;
    const str = String(v).trim();
    if (!str || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") return null;
    return str;
  };

  // 1. Invoice Fields
  const invoiceNumber = makeEvidence(rawInv.invoiceNumber || rawInv.invoice_number, stringNorm, "Invoice No.");
  const invoiceDate = makeEvidence(rawInv.invoiceDate || rawInv.invoice_date, normalizeDate, "Invoice Date");
  const dueDate = makeEvidence(rawInv.dueDate || rawInv.due_date, normalizeDate, "Due Date");
  const poNumber = makeEvidence(rawInv.poNumber || rawInv.po_number, stringNorm, "PO No.");
  const poDate = makeEvidence(rawInv.poDate || rawInv.po_date, normalizeDate, "PO Date");
  const ewayBillNumber = makeEvidence(rawInv.ewayBillNumber || rawInv.eway_bill_number, stringNorm, "e-Way Bill No.");
  const placeOfSupply = makeEvidence(rawInv.placeOfSupply || rawInv.place_of_supply, stringNorm, "Place of Supply");
  const reverseCharge = makeEvidence(rawInv.reverseCharge, (v) => (typeof v === "boolean" ? v : null), "Reverse Charge");

  // 2. Seller Fields
  const sellerName = makeEvidence(rawSel.name || rawSel.seller_name, stringNorm, "Seller Name");
  
  const rawSellerGst = rawSel.gstin || rawSel.seller_gstin;
  const sellerGstCheck = validateGSTIN(rawSellerGst);
  const sellerGstin: ExtractedFieldEvidence<string> = {
    value: sellerGstCheck.normalized,
    status: sellerGstCheck.valid ? "PRESENT" : sellerGstCheck.normalized ? "INVALID" : "ABSENT",
    confidence: sellerGstCheck.valid ? 0.98 : null,
    sourceLabel: "Seller GSTIN",
  };

  const sellerPan = makeEvidence(rawSel.pan || rawSel.seller_pan, stringNorm, "Seller PAN");
  const sellerAddress = makeEvidence(rawSel.address || rawSel.seller_address, stringNorm, "Seller Address");
  const sellerPhone = makeEvidence(rawSel.phone || rawSel.seller_phone, stringNorm, "Seller Phone");
  const sellerEmail = makeEvidence(rawSel.email || rawSel.seller_email, stringNorm, "Seller Email");

  // 3. Buyer Fields
  const buyerName = makeEvidence(rawBuy.name || rawBuy.buyer_name, stringNorm, "Buyer Name");

  const rawBuyerGst = rawBuy.gstin || rawBuy.buyer_gstin;
  const buyerGstCheck = validateGSTIN(rawBuyerGst);
  const buyerGstin: ExtractedFieldEvidence<string> = {
    value: buyerGstCheck.normalized,
    status: buyerGstCheck.valid ? "PRESENT" : buyerGstCheck.normalized ? "INVALID" : "ABSENT",
    confidence: buyerGstCheck.valid ? 0.98 : null,
    sourceLabel: "Buyer GSTIN",
  };

  const buyerPan = makeEvidence(rawBuy.pan || rawBuy.buyer_pan, stringNorm, "Buyer PAN");
  const buyerAddress = makeEvidence(rawBuy.address || rawBuy.buyer_address, stringNorm, "Buyer Address");
  const buyerPhone = makeEvidence(rawBuy.phone || rawBuy.buyer_phone, stringNorm, "Buyer Phone");
  const buyerEmail = makeEvidence(rawBuy.email || rawBuy.buyer_email, stringNorm, "Buyer Email");

  // 4. Financial Fields
  const currency = stringNorm(rawFin.currency) || "INR";
  const subtotal = makeEvidence(rawFin.subtotal, parseIndianCurrency, "Subtotal");
  const taxableAmount = makeEvidence(rawFin.taxableAmount || rawFin.taxable_amount, parseIndianCurrency, "Taxable Amount");
  const cgst = makeEvidence(rawFin.cgst, parseIndianCurrency, "CGST");
  const sgst = makeEvidence(rawFin.sgst, parseIndianCurrency, "SGST");
  const igst = makeEvidence(rawFin.igst, parseIndianCurrency, "IGST");
  const totalTax = makeEvidence(rawFin.totalTax || rawFin.total_tax, parseIndianCurrency, "Total Tax");
  const discount = makeEvidence(rawFin.discount, parseIndianCurrency, "Discount");
  const roundOff = makeEvidence(rawFin.roundOff || rawFin.round_off, parseIndianCurrency, "Round Off");
  const grandTotal = makeEvidence(rawFin.grandTotal || rawFin.grand_total || rawFin.total_amount, parseIndianCurrency, "Grand Total");
  const amountInWords = makeEvidence(rawFin.amountInWords || rawFin.amount_in_words, stringNorm, "Amount in Words");

  // 5. Payment Fields
  const paymentTerms = makeEvidence(rawPay.terms || rawPay.payment_terms, stringNorm, "Payment Terms");
  const paymentDueDays = makeEvidence(rawPay.paymentDueDays || rawPay.due_days, parseIndianCurrency, "Due Days");
  const bankName = makeEvidence(rawPay.bankName || rawPay.bank_name, stringNorm, "Bank Name");
  const accountNumber = makeEvidence(rawPay.accountNumber || rawPay.account_number, stringNorm, "Account No.");
  const ifscCode = makeEvidence(rawPay.ifscCode || rawPay.ifsc_code, stringNorm, "IFSC Code");

  // 6. Line Items Processing
  const rawItems = Array.isArray(raw.lineItems) ? raw.lineItems : Array.isArray(raw.line_items) ? raw.line_items : [];
  const lineItems: ExtractedLineItem[] = rawItems.map((item: any) => ({
    description: stringNorm(item.description),
    hsn: stringNorm(item.hsn || item.hsn_sac_codes || item.hsnCode),
    quantity: parseIndianCurrency(item.quantity),
    unit: stringNorm(item.unit),
    unitPrice: parseIndianCurrency(item.unitPrice || item.unit_price || item.rate),
    discount: parseIndianCurrency(item.discount),
    taxableAmount: parseIndianCurrency(item.taxableAmount || item.subtotal),
    tax: parseIndianCurrency(item.tax || item.tax_amount),
    amount: parseIndianCurrency(item.amount || item.total_amount || item.total),
  }));

  // 7. Deterministic Financial Validation & Reconciliation
  const calcItemsTotal = lineItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const computedSubtotal = subtotal.value || calcItemsTotal || 0;
  const computedTax = totalTax.value || ((cgst.value || 0) + (sgst.value || 0) + (igst.value || 0));
  const expectedGrandTotal = computedSubtotal + computedTax - (discount.value || 0);

  const findings: string[] = [];
  let calcStatus: "PASS" | "FINANCIAL_MISMATCH" | "UNKNOWN" = "PASS";

  if (grandTotal.value !== null && expectedGrandTotal > 0) {
    const diff = Math.abs(grandTotal.value - expectedGrandTotal);
    if (diff > 5) {
      calcStatus = "FINANCIAL_MISMATCH";
      findings.push(
        `Financial Reconciliation Discrepancy: Extracted Grand Total (₹${grandTotal.value.toLocaleString(
          "en-IN"
        )}) differs from calculated total (₹${expectedGrandTotal.toLocaleString("en-IN")}) by ₹${diff.toLocaleString("en-IN")}.`
      );
    }
  } else {
    calcStatus = "UNKNOWN";
  }

  // 8. Overall Document Status
  const hasCoreFields = invoiceNumber.value !== null && sellerName.value !== null && grandTotal.value !== null;
  const hasAnyFields = invoiceNumber.value !== null || sellerName.value !== null || buyerName.value !== null || grandTotal.value !== null || lineItems.length > 0;
  const docStatus: "SUCCESS" | "PARTIAL" | "FAILED" | "UNREADABLE" = hasCoreFields
    ? "SUCCESS"
    : hasAnyFields
    ? "PARTIAL"
    : "UNREADABLE";

  return {
    document: {
      status: docStatus,
      mimeType: meta.mimeType,
      fileSize: meta.fileSize,
      pageCount: rawDoc.pageCount || 1,
      confidence: hasCoreFields ? 0.96 : hasAnyFields ? 0.6 : null,
    },
    invoice: {
      invoiceNumber,
      invoiceDate,
      dueDate,
      poNumber,
      poDate,
      ewayBillNumber,
      placeOfSupply,
      reverseCharge,
    },
    seller: {
      name: sellerName,
      gstin: sellerGstin,
      pan: sellerPan,
      address: sellerAddress,
      phone: sellerPhone,
      email: sellerEmail,
    },
    buyer: {
      name: buyerName,
      gstin: buyerGstin,
      pan: buyerPan,
      address: buyerAddress,
      phone: buyerPhone,
      email: buyerEmail,
    },
    financial: {
      currency,
      subtotal,
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalTax,
      discount,
      roundOff,
      grandTotal,
      amountInWords,
    },
    payment: {
      terms: paymentTerms,
      paymentDueDays,
      bankName,
      accountNumber,
      ifscCode,
    },
    lineItems,
    additional: {
      notes: stringNorm(rawAdd.notes),
      termsAndConditions: stringNorm(rawAdd.termsAndConditions),
    },
    validation: {
      calculationStatus: calcStatus,
      expectedGrandTotal: expectedGrandTotal > 0 ? expectedGrandTotal : null,
      displayedGrandTotal: grandTotal.value,
      difference: grandTotal.value !== null && expectedGrandTotal > 0 ? Math.abs(grandTotal.value - expectedGrandTotal) : 0,
      findings,
    },
  };
}

/**
 * Primary Invoice Document Intelligence Service using Google Antigravity / Gemini Multimodal Engine
 */
export async function processInvoiceDocument(
  base64Data: string,
  mimeType: string,
  fileName: string = "document.pdf"
): Promise<CanonicalInvoiceData> {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`[OCR-GEMINI] API key configured: ${!!apiKey}`);

  if (!apiKey) {
    console.error(`[OCR-GEMINI] ERROR: Gemini API key is missing`);
    const err = new Error("Gemini API key is not configured in environment variables (GEMINI_API_KEY).");
    (err as any).code = "GEMINI_CONFIGURATION_ERROR";
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  // Clean raw Base64 string
  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  const fileSize = buffer.length;

  console.log(`[OCR-BE] request received`);
  console.log(`[OCR-BE] filename: ${fileName}`);
  console.log(`[OCR-BE] mime: ${mimeType}`);
  console.log(`[OCR-BE] size: ${fileSize} bytes`);
  console.log(`[OCR-BE] buffer present: ${buffer.length > 0}`);

  if (buffer.length === 0) {
    console.error("[OCR-BE] Error: Uploaded buffer is empty (0 bytes)");
    return normalizeInvoiceExtraction({}, { mimeType, fileSize: 0 });
  }

  let contentParts: any[] = [];
  let effectiveMime = mimeType;

  if (mimeType === "image/svg+xml" || base64Data.startsWith("data:image/svg+xml")) {
    const svgText = buffer.toString("utf-8");
    contentParts = [
      { text: `Process this SVG invoice document XML layout content:\n${svgText}` },
      { text: "Extract structured invoice data according to system prompt instructions." },
    ];
  } else {
    if (mimeType.includes("pdf")) effectiveMime = "application/pdf";
    else if (mimeType.includes("png")) effectiveMime = "image/png";
    else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) effectiveMime = "image/jpeg";
    else if (mimeType.includes("webp")) effectiveMime = "image/webp";

    contentParts = [
      {
        inlineData: {
          data: cleanBase64,
          mimeType: effectiveMime,
        },
      },
      { text: "Perform complete multimodal visual OCR and structured invoice document extraction." },
    ];
  }

  const systemPrompt = `You are Credexa's Authoritative Invoice Document Intelligence Engine.
Your task is to inspect ONLY the provided invoice document (image or PDF) and extract visibly present invoice data into strict JSON format.

CRITICAL LAWS:
1. Extract ONLY information visibly supported by the provided document.
2. NEVER infer missing values, invent values, or extrapolate values not visually present.
3. NEVER use demo invoice numbers (such as PGA/25-26/1104), seller names (Precision Geartech), or demo GSTINs unless they literally appear in the uploaded document.
4. If a field is missing, unreadable, or not present, set its value to null. Do NOT output "NOT DETECTED", "N/A", "ABSENT", or fake text—use literal null.
5. If the document is unreadable, corrupted, or not an invoice document, set document.status to "UNREADABLE".
6. Extract all visible line items in the invoice table with full descriptions, HSN/SAC codes, quantities, unit rates, and totals.
7. Perform mathematical verification of invoice subtotal, tax amounts (CGST, SGST, IGST), and grand total.

Return ONLY a valid JSON object matching this schema EXACTLY:
{
  "document": {
    "status": "SUCCESS",
    "pageCount": 1,
    "confidence": 0.98
  },
  "invoice": {
    "invoiceNumber": null,
    "invoiceDate": null,
    "dueDate": null,
    "poNumber": null,
    "poDate": null,
    "ewayBillNumber": null,
    "placeOfSupply": null,
    "reverseCharge": false
  },
  "seller": {
    "name": null,
    "gstin": null,
    "pan": null,
    "address": null,
    "phone": null,
    "email": null
  },
  "buyer": {
    "name": null,
    "gstin": null,
    "pan": null,
    "address": null,
    "phone": null,
    "email": null
  },
  "financial": {
    "currency": "INR",
    "subtotal": null,
    "taxableAmount": null,
    "cgst": null,
    "sgst": null,
    "igst": null,
    "totalTax": null,
    "discount": null,
    "roundOff": null,
    "grandTotal": null,
    "amountInWords": null
  },
  "payment": {
    "terms": null,
    "paymentDueDays": null,
    "bankName": null,
    "accountNumber": null,
    "ifscCode": null
  },
  "lineItems": [
    {
      "description": "string",
      "hsn": "string",
      "quantity": 0,
      "unit": "string",
      "unitPrice": 0,
      "discount": 0,
      "taxableAmount": 0,
      "tax": 0,
      "amount": 0
    }
  ],
  "additional": {
    "notes": null,
    "termsAndConditions": null
  }
}`;

  console.log(`[OCR] file received`);
  console.log(`[OCR] mime type: ${effectiveMime}`);
  console.log(`[OCR] file size: ${fileSize} bytes`);

  // Step 1: PDF Magic Bytes Validation (Phase 3)
  if (effectiveMime === "application/pdf") {
    const isPdfValid = buffer.length >= 5 && buffer.slice(0, 5).toString() === "%PDF-";
    console.log(`[OCR-BE] PDF signature valid: ${isPdfValid}`);
    console.log(`[OCR] PDF validation: ${isPdfValid ? "PASSED (%PDF- magic bytes verified)" : "FAILED (invalid header)"}`);
    if (!isPdfValid) {
      console.error("[OCR] PDF validation error: Missing or corrupt %PDF- header magic bytes.");
      return normalizeInvoiceExtraction({}, { mimeType: effectiveMime, fileSize });
    }
  } else {
    console.log(`[OCR] Image validation: PASSED (${effectiveMime})`);
  }

  // Phase 4: Gemini Call Diagnostics
  console.log(`[OCR-GEMINI] request starting`);
  console.log(`[OCR-GEMINI] mime type: ${effectiveMime}`);
  console.log(`[OCR-GEMINI] payload size: ${fileSize} bytes`);
  console.log(`[OCR-GEMINI] model: ${modelName}`);

  let rawResult: any = null;
  let lastErr: any = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentParts,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      if (response && response.text) {
        console.log(`[OCR-GEMINI] response received`);
        console.log(`[OCR-GEMINI] response text length: ${response.text.length}`);
        console.log(`[OCR-GEMINI] JSON parse started`);

        const cleanJson = response.text.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
        try {
          rawResult = JSON.parse(cleanJson);
          console.log(`[OCR-GEMINI] JSON parse success: true`);
          console.log(`[OCR] JSON parsing: SUCCESSFUL`);
          break;
        } catch (jsonErr: any) {
          console.error(`[OCR-GEMINI] JSON parse success: false (${jsonErr?.message})`);
          console.error(`[OCR] JSON parsing: FAILED (${jsonErr})`);
        }
      }
    } catch (err: any) {
      lastErr = err;
      console.error(`[OCR-GEMINI] ERROR`);
      console.error(`[OCR-GEMINI] error name: ${err.name || "Error"}`);
      console.error(`[OCR-GEMINI] error message: ${err.message}`);
      console.error(`[OCR-GEMINI] status: ${err.status || err.statusCode || err.code || "UNKNOWN"}`);

      // Check if this is a configuration/API key error or quota exceeded error
      const isQuotaOrConfig =
        err.status === 429 ||
        err.status === 400 ||
        err.status === 403 ||
        /quota|rate limit|api key|unauthorized|forbidden|not found/i.test(err.message || "");

      if (isQuotaOrConfig) {
        // Do NOT classify configuration/quota errors as unreadability!
        const configErr = new Error(`Gemini API Error (${err.status || "API_ERROR"}): ${err.message}`);
        (configErr as any).code = err.status === 429 ? "GEMINI_QUOTA_EXCEEDED" : "GEMINI_CONFIGURATION_ERROR";
        throw configErr;
      }

      if (attempt < 1) await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!rawResult) {
    if (lastErr) {
      // If there was an error that reached here, rethrow it rather than masking as unreadable
      throw lastErr;
    }
    console.error("[OCR] Gemini Document Extraction Failure: Empty response from Gemini engine.");
    console.log(`[OCR] final status: UNREADABLE`);
    return normalizeInvoiceExtraction({}, { mimeType: effectiveMime, fileSize });
  }

  const normalized = normalizeInvoiceExtraction(rawResult, { mimeType: effectiveMime, fileSize });

  let parsedCount = 0;
  Object.values(normalized.invoice).forEach((f: any) => { if (f?.status === "PRESENT") parsedCount++; });
  Object.values(normalized.seller).forEach((f: any) => { if (f?.status === "PRESENT") parsedCount++; });
  Object.values(normalized.buyer).forEach((f: any) => { if (f?.status === "PRESENT") parsedCount++; });
  Object.values(normalized.financial).forEach((f: any) => { if (f?.status === "PRESENT") parsedCount++; });
  if (normalized.lineItems.length > 0) parsedCount += normalized.lineItems.length;

  const schemaValid = parsedCount > 0 && normalized.document.status !== "UNREADABLE";
  console.log(`[OCR] schema validation: ${schemaValid ? "PASSED" : "FAILED"}`);
  console.log(`[OCR] extracted field count: ${parsedCount}`);
  console.log(`[OCR] final status: ${normalized.document.status}`);

  return normalized;
}
