import { InvoiceRecord } from "../types";

export interface DemoLineItem {
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface DemoInvoiceFixture extends InvoiceRecord {
  sellerAddress: string;
  buyerAddress: string;
  poDate: string;
  placeOfSupply: string;
  subtotalInr: number;
  cgstInr: number;
  sgstInr: number;
  lineItems: DemoLineItem[];
  maximumFinancingInr: number;
  recommendedAdvancePct: number;
  riskLevel: "LOW" | "HIGH";
  buyerConfirmationStatus: "CONFIRMED" | "PENDING" | "DISPUTED";
  eligibilityStatus: "ELIGIBLE" | "REVIEW_REQUIRED" | "BLOCKED";
}

/**
 * Controlled Demo Invoice Fixture Registry
 * ONLY returns data for exact invoice numbers:
 * - "STS/24-25/4587" (Demo Invoice A - Low Risk)
 * - "OT/25-26/0817"  (Demo Invoice B - High Risk)
 * Returns null for all other invoices to preserve data isolation.
 */
export function getDemoInvoiceFixture(invoiceNumber: string): DemoInvoiceFixture | null {
  if (!invoiceNumber) return null;

  const normalizedNumber = invoiceNumber.trim();

  // DEMO INVOICE A — LOW RISK
  if (normalizedNumber === "STS/24-25/4587") {
    return {
      id: "DEMO-INV-SKYLINE-4587",
      token2022Mint: "Token2022Mint_STS_4587_Devnet",
      invoiceNumber: "STS/24-25/4587",
      invoiceDate: "2025-08-14",
      dueDate: "2025-08-29",
      maturityDate: "2025-08-29",
      tenureDays: 15,
      faceValueInr: 8200000,
      advanceRatePct: 85,
      recommendedAdvancePct: 85,
      maximumFinancingInr: 6970000,
      fundedAmountInr: 0,
      sellerName: "Skyline Trading Solutions Pvt. Ltd.",
      sellerAddress: "302, Prime Business Tower, Andheri East, Mumbai, Maharashtra 400069",
      sellerGstin: "27ABCDE1234F1Z2",
      sellerLocation: "Mumbai, Maharashtra (27)",
      sellerWallet: "Skyline4587...DevnetWallet",
      buyerName: "Tata Motors Limited",
      buyerAddress: "Bombay House, 24 Homi Mody Street, Fort, Mumbai, Maharashtra 400001",
      buyerGstin: "27AAACT2727Q1Z8",
      buyerWallet: "TataMotors...DevnetWallet",
      poNumber: "PO/TTML/2025/778",
      poDate: "2025-08-01",
      placeOfSupply: "Maharashtra (27)",
      subtotalInr: 7050000,
      cgstInr: 634500,
      sgstInr: 634500,
      totalTaxInr: 1269000,
      itemDescription: "Automotive Gear Assembly (Model X1), Precision Machined Components, Logistics & Handling",
      hsnCode: "870899",
      ewayBillNumber: "281982740192",
      irn: "9f8a7c2b5d4e1a0b3c6d8e7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      factoringMode: "Recourse",
      status: "APPROVED",
      buyerConfirmationStatus: "CONFIRMED",
      buyerAttested: true,
      buyerConfirmedAt: "2025-08-15T10:30:00Z",
      buyerConfirmedBy: "procurement@tatamotors.com",
      buyerRebateBps: 200,
      discountRateBps: 850,
      seniorFundingInr: 5576000,
      juniorFundingInr: 1394000,
      daysOverdue: 0,
      authenticityScore: 96,
      riskTier: "TIER_AAA",
      riskLevel: "LOW",
      eligibilityStatus: "ELIGIBLE",
      oracleSignature: "4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c",
      oracleTimestamp: 1755168000,
      collateralLockedInr: 0,
      canonicalHash: "4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c",
      lineItems: [
        {
          description: "Automotive Gear Assembly (Model X1)",
          hsn: "870899",
          quantity: 100,
          unit: "Nos",
          rate: 45000,
          amount: 4500000,
        },
        {
          description: "Precision Machined Components",
          hsn: "848390",
          quantity: 200,
          unit: "Nos",
          rate: 12500,
          amount: 2500000,
        },
        {
          description: "Logistics & Handling Charges",
          hsn: "996711",
          quantity: 1,
          unit: "Lot",
          rate: 50000,
          amount: 50000,
        },
      ],
    };
  }

  // DEMO INVOICE B — HIGH RISK
  if (normalizedNumber === "OT/25-26/0817") {
    return {
      id: "DEMO-INV-OMKAR-0817",
      token2022Mint: "Token2022Mint_OT_0817_Devnet",
      invoiceNumber: "OT/25-26/0817",
      invoiceDate: "2025-08-12",
      dueDate: "2025-09-12",
      maturityDate: "2025-09-12",
      tenureDays: 31,
      faceValueInr: 11050000,
      advanceRatePct: 80,
      recommendedAdvancePct: 80,
      maximumFinancingInr: 8840000,
      fundedAmountInr: 0,
      sellerName: "Omkar Technologies Pvt. Ltd.",
      sellerAddress: "A-45, Industrial Area, Sector 8, Noida, Uttar Pradesh 201301",
      sellerGstin: "09ABCDE1234FZ9",
      sellerLocation: "Noida, Uttar Pradesh (09)",
      sellerWallet: "Omkar0817...DevnetWallet",
      buyerName: "Tata Motors Limited",
      buyerAddress: "Bombay House, 24 Homi Mody Street, Fort, Mumbai, Maharashtra 400001",
      buyerGstin: "27AAACT2727Q1Z8",
      buyerWallet: "TataMotors...DevnetWallet",
      poNumber: "TM/PO/2025/556",
      poDate: "2025-08-01",
      placeOfSupply: "Uttar Pradesh (09)",
      subtotalInr: 8450000,
      cgstInr: 760500,
      sgstInr: 760500,
      totalTaxInr: 1521000,
      itemDescription: "Gear Assembly (Model X1), Precision Machined Parts, Control Module Unit, Packing & Forwarding",
      hsnCode: "870899",
      ewayBillNumber: "341829014872",
      irn: "a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
      factoringMode: "Recourse",
      status: "AI_AUDITING",
      buyerConfirmationStatus: "PENDING",
      buyerAttested: false,
      buyerRebateBps: 0,
      discountRateBps: 1050,
      seniorFundingInr: 7072000,
      juniorFundingInr: 1768000,
      daysOverdue: 0,
      authenticityScore: 68,
      riskTier: "TIER_HIGH_RISK",
      riskLevel: "HIGH",
      eligibilityStatus: "REVIEW_REQUIRED",
      oracleSignature: "7e9f0a1b2c3d4e5f6a7b8c4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d",
      oracleTimestamp: 1754995200,
      collateralLockedInr: 0,
      canonicalHash: "7e9f0a1b2c3d4e5f6a7b8c4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d",
      lineItems: [
        {
          description: "Gear Assembly (Model X1)",
          hsn: "870899",
          quantity: 100,
          unit: "Nos",
          rate: 45000,
          amount: 4500000,
        },
        {
          description: "Precision Machined Parts",
          hsn: "848390",
          quantity: 150,
          unit: "Nos",
          rate: 18500,
          amount: 2775000,
        },
        {
          description: "Control Module Unit",
          hsn: "853710",
          quantity: 50,
          unit: "Nos",
          rate: 22000,
          amount: 1100000,
        },
        {
          description: "Packing & Forwarding Charges",
          hsn: "999799",
          quantity: 1,
          unit: "Lot",
          rate: 75000,
          amount: 75000,
        },
      ],
    };
  }

  return null;
}
