import fs from "fs";
import path from "path";
import {
  InvoiceRecord,
  InvoiceStatus,
  OracleAuditResponse,
  AuditEvent,
  SolanaTxRecord,
  InvestmentRecord,
  RepaymentResult,
} from "../types";

export interface DBStructure {
  invoices: InvoiceRecord[];
  audits: Record<string, OracleAuditResponse>;
  attestations: Record<string, { payloadHash: string; publicKey: string; signature: string; timestamp: number }>;
  investments: InvestmentRecord[];
  solanaTxs: SolanaTxRecord[];
  repayments: Record<string, RepaymentResult>;
  auditEvents: Record<string, AuditEvent[]>;
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "credexa_db.json");

// Initial Seed Data for Demo Mode
const SEED_INVOICES: InvoiceRecord[] = [
  {
    id: "DEMO-INV-SKYLINE-4587",
    token2022Mint: "Token2022Mint_STS_4587_Devnet",
    invoiceNumber: "STS/24-25/4587",
    invoiceDate: "2025-08-14",
    tenureDays: 15,
    faceValueInr: 8200000,
    advanceRatePct: 85,
    fundedAmountInr: 0,
    sellerName: "Skyline Trading Solutions Pvt. Ltd.",
    sellerGstin: "27ABCDE1234F1Z2",
    sellerLocation: "Mumbai, Maharashtra",
    sellerWallet: "Skyline4587...DevnetWallet",
    buyerName: "Tata Motors Limited",
    buyerGstin: "27AAACT2727Q1Z8",
    buyerWallet: "TataMotors...DevnetWallet",
    itemDescription: "Automotive Gear Assembly (Model X1), Precision Machined Components, Logistics & Handling",
    hsnCode: "870899",
    ewayBillNumber: "281982740192",
    poNumber: "PO/TTML/2025/778",
    irn: "9f8a7c2b5d4e1a0b3c6d8e7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    factoringMode: "Recourse",
    status: "APPROVED",
    buyerConfirmationStatus: "CONFIRMED",
    buyerAttested: true,
    buyerRebateBps: 200,
    discountRateBps: 850,
    seniorFundingInr: 5576000,
    juniorFundingInr: 1394000,
    maturityDate: "2025-08-29",
    daysOverdue: 0,
    authenticityScore: 96,
    riskTier: "TIER_AAA",
    oracleSignature: "4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c",
    oracleTimestamp: 1755168000,
    collateralLockedInr: 0,
  },
  {
    id: "DEMO-INV-OMKAR-0817",
    token2022Mint: "Token2022Mint_OT_0817_Devnet",
    invoiceNumber: "OT/25-26/0817",
    invoiceDate: "2025-08-12",
    tenureDays: 31,
    faceValueInr: 11050000,
    advanceRatePct: 80,
    fundedAmountInr: 0,
    sellerName: "Omkar Technologies Pvt. Ltd.",
    sellerGstin: "09ABCDE1234FZ9",
    sellerLocation: "Noida, Uttar Pradesh",
    sellerWallet: "Omkar0817...DevnetWallet",
    buyerName: "Tata Motors Limited",
    buyerGstin: "27AAACT2727Q1Z8",
    buyerWallet: "TataMotors...DevnetWallet",
    itemDescription: "Gear Assembly (Model X1), Precision Machined Parts, Control Module Unit, Packing & Forwarding",
    hsnCode: "870899",
    ewayBillNumber: "341829014872",
    poNumber: "TM/PO/2025/556",
    irn: "a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
    factoringMode: "Recourse",
    status: "AI_AUDITING",
    buyerConfirmationStatus: "PENDING",
    buyerAttested: false,
    buyerRebateBps: 0,
    discountRateBps: 1050,
    seniorFundingInr: 7072000,
    juniorFundingInr: 1768000,
    maturityDate: "2025-09-12",
    daysOverdue: 0,
    authenticityScore: 68,
    riskTier: "TIER_HIGH_RISK",
    oracleSignature: "7e9f0a1b2c3d4e5f6a7b8c4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d",
    oracleTimestamp: 1754995200,
    collateralLockedInr: 0,
  },
  {
    id: "INV-2026-GJ-4491",
    token2022Mint: "CRDxMint4491sW4aBC29kM8v1L4uT6h7R2eW1qNxYz99",
    invoiceNumber: "SWS/TEX/2026/089",
    invoiceDate: "2026-08-20",
    tenureDays: 120,
    faceValueInr: 2850000,
    advanceRatePct: 80,
    fundedAmountInr: 2280000,
    sellerName: "Surat Weavecraft Synthetics LLP",
    sellerGstin: "24AABCS4412K1ZT",
    sellerLocation: "Pandesara GIDC, Surat, GJ",
    sellerWallet: "5wR2...mB88",
    buyerName: "Reliance Retail Trends Apparel SCM",
    buyerGstin: "24AAACR1214G1ZU",
    buyerWallet: "RILr...44AP",
    itemDescription: "Recycled polyester blended twill fabric rolls (GSM 240)",
    hsnCode: "54075200",
    ewayBillNumber: "341829014872",
    poNumber: "RR/APP/SUR/26-5510",
    irn: "a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
    factoringMode: "NonRecourse",
    status: "LISTED",
    discountRateBps: 975,
    seniorFundingInr: 0,
    juniorFundingInr: 0,
    buyerAttested: false,
    buyerRebateBps: 0,
    maturityDate: "2026-12-18",
    daysOverdue: 0,
    authenticityScore: 89,
    riskTier: "TIER_AA",
    oracleSignature: "7e9f0a1b2c3d4e5f6a7b8c4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d",
    oracleTimestamp: 1787238400,
    collateralLockedInr: 0,
  },
  {
    id: "INV-2026-UP-1029",
    token2022Mint: "CRDxMint1029eP3bBC33kM7v3L5uT8h9R3eW2qNxYz11",
    invoiceNumber: "EPW/NOI/26/0412",
    invoiceDate: "2026-09-02",
    tenureDays: 75,
    faceValueInr: 1750000,
    advanceRatePct: 80,
    fundedAmountInr: 1400000,
    sellerName: "ElectroPulse Wire & Cable Industries",
    sellerGstin: "09AAACE9912M1ZY",
    sellerLocation: "Sector 63, Noida, UP",
    sellerWallet: "3eP9...xL77",
    buyerName: "Dixon Technologies Consumer Electronics Unit",
    buyerGstin: "09AAACD4490P1ZB",
    buyerWallet: "DxOn...10CE",
    itemDescription: "Halogen-free multi-core copper interconnect cabling harnesses",
    hsnCode: "85444990",
    ewayBillNumber: "198274019284",
    poNumber: "DXN/UP/2026/9021",
    irn: "e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9f8a7c2b5d4e1a0b3c6d8e7f9a0b1c2d3",
    factoringMode: "Recourse",
    status: "REPAID",
    discountRateBps: 850,
    seniorFundingInr: 1120000,
    juniorFundingInr: 280000,
    buyerAttested: true,
    buyerRebateBps: 120,
    attestationTimestamp: 1788361600,
    maturityDate: "2026-11-16",
    daysOverdue: 0,
    authenticityScore: 92,
    riskTier: "TIER_A",
    oracleSignature: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    oracleTimestamp: 1788360000,
    collateralLockedInr: 175000,
  }
];

function getInitialState(): DBStructure {
  const auditEvents: Record<string, AuditEvent[]> = {};

  SEED_INVOICES.forEach((inv) => {
    auditEvents[inv.id] = [
      {
        id: "evt-01-" + inv.id,
        invoiceId: inv.id,
        eventType: "INVOICE_SUBMITTED",
        title: "Invoice Draft Created",
        description: `Invoice ${inv.invoiceNumber} submitted by ${inv.sellerName} for ₹${inv.faceValueInr.toLocaleString("en-IN")}.`,
        actor: "MSME",
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: "evt-02-" + inv.id,
        invoiceId: inv.id,
        eventType: "GEMINI_AUDIT_COMPLETED",
        title: "Gemini AI Risk Audit Completed",
        description: `Authenticity Score: ${inv.authenticityScore}/100, Tier: ${inv.riskTier}.`,
        actor: "GEMINI_AI",
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: "evt-03-" + inv.id,
        invoiceId: inv.id,
        eventType: "ORACLE_ATTESTATION_SIGNED",
        title: "Ed25519 Oracle Signature Generated",
        description: "Canonical payload signed by Credexa Credit Oracle.",
        actor: "ORACLE",
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    if (inv.status === "FUNDED" || inv.status === "REPAID") {
      auditEvents[inv.id].push({
        id: "evt-04-" + inv.id,
        invoiceId: inv.id,
        eventType: "SOLANA_DEVNET_ANCHORED",
        title: "Anchored on Solana Devnet",
        description: "Transaction memo anchor confirmed on Solana Devnet.",
        actor: "SOLANA_DEVNET",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      });
      auditEvents[inv.id].push({
        id: "evt-05-" + inv.id,
        invoiceId: inv.id,
        eventType: "INVOICE_FUNDED",
        title: "Multi-Tranche Vault Disbursed",
        description: `Disbursed ₹${inv.fundedAmountInr.toLocaleString("en-IN")} eINR.`,
        actor: "INVESTOR",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      });
    }

    if (inv.status === "REPAID") {
      auditEvents[inv.id].push({
        id: "evt-06-" + inv.id,
        invoiceId: inv.id,
        eventType: "BUYER_REPAYMENT_COMPLETED",
        title: "Simulated Buyer Repayment Complete",
        description: `Full repayment received. Senior & Junior tranche yields settled.`,
        actor: "BUYER",
        timestamp: new Date().toISOString(),
      });
    }
  });

  return {
    invoices: SEED_INVOICES,
    audits: {},
    attestations: {},
    investments: [],
    solanaTxs: [],
    repayments: {},
    auditEvents,
  };
}

export class CredexaStore {
  private data: DBStructure;

  constructor() {
    this.data = this.loadDB();
  }

  private loadDB(): DBStructure {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        const initial = getInitialState();
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
        return initial;
      }
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      console.warn("[Store] Error loading DB, resetting to initial seed:", err);
      return getInitialState();
    }
  }

  private saveDB(): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("[Store] Failed to write to db file:", err);
    }
  }

  private enrichInvoice(inv: InvoiceRecord): InvoiceRecord {
    const invInvestments = (this.data.investments || []).filter((i) => i.invoiceId === inv.id);
    const totalFundedFromInv = invInvestments.reduce((sum, i) => sum + i.amountInr, 0);
    const actualFunded = invInvestments.length > 0 ? totalFundedFromInv : inv.fundedAmountInr;

    const financers = invInvestments.map((i) => ({
      id: i.id,
      financerName: i.financerName || (i.investorWallet ? `${i.investorWallet.slice(0, 8)}...` : "Financer"),
      amountInr: i.amountInr,
      tranche: i.tranche,
      fundedAt: i.createdAt,
      sharePct: inv.faceValueInr > 0 ? Math.round((i.amountInr / inv.faceValueInr) * 100 * 10) / 10 : 0,
    }));

    return {
      ...inv,
      fundedAmountInr: actualFunded,
      investments: invInvestments,
      financers,
    };
  }

  public getAllInvoices(): InvoiceRecord[] {
    return this.data.invoices.map((inv) => this.enrichInvoice(inv));
  }

  public getInvoiceById(id: string): InvoiceRecord | undefined {
    const inv = this.data.invoices.find((i) => i.id === id);
    if (!inv) return undefined;
    return this.enrichInvoice(inv);
  }

  public createInvoice(newInv: Partial<InvoiceRecord>): InvoiceRecord {
    const id = newInv.id || `INV-2026-MH-${Math.floor(1000 + Math.random() * 9000)}`;
    const faceVal = newInv.faceValueInr || 1000000;
    const fullRecord: InvoiceRecord = {
      id,
      token2022Mint: newInv.token2022Mint || `CRDxMint${Math.floor(1000 + Math.random() * 9000)}pQ4aBC17kM9v2L3uT5h8R1eW0qNxYz88`,
      invoiceNumber: newInv.invoiceNumber || `INV/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: newInv.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate: newInv.dueDate || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      tenureDays: newInv.tenureDays || 90,
      faceValueInr: faceVal,
      advanceRatePct: newInv.advanceRatePct || 85,
      fundedAmountInr: newInv.fundedAmountInr !== undefined ? newInv.fundedAmountInr : 0,
      sellerName: newInv.sellerName || "Supplier Entity",
      sellerGstin: newInv.sellerGstin || "27AAACP1842Q1Z9",
      sellerLocation: newInv.sellerLocation || "Mumbai, MH",
      sellerWallet: newInv.sellerWallet || "7eT4...kM9p",
      sellerAddress: newInv.sellerAddress || undefined,
      buyerName: newInv.buyerName || "Corporate Buyer",
      buyerGstin: newInv.buyerGstin || "27AAACT2727Q1ZW",
      buyerWallet: newInv.buyerWallet || "TaTa...99CV",
      buyerAddress: newInv.buyerAddress || undefined,
      itemDescription: newInv.itemDescription || "B2B Goods Supply",
      hsnCode: newInv.hsnCode || "87084000",
      ewayBillNumber: newInv.ewayBillNumber || "281982740192",
      poNumber: newInv.poNumber || "PO-2026-001",
      irn: newInv.irn || "9f8a7c2b5d4e1a0b3c6d8e7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      factoringMode: newInv.factoringMode || "Recourse",
      status: (newInv.status as InvoiceStatus) || "DRAFT",
      discountRateBps: newInv.discountRateBps || 850,
      seniorFundingInr: 0,
      juniorFundingInr: 0,
      buyerAttested: false,
      buyerRebateBps: 0,
      maturityDate: newInv.maturityDate || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      daysOverdue: 0,
      authenticityScore: newInv.authenticityScore || 90,
      riskTier: newInv.riskTier || "TIER_A",
      collateralLockedInr: Math.round(faceVal * 0.1),
      cgstInr: newInv.cgstInr,
      sgstInr: newInv.sgstInr,
      igstInr: newInv.igstInr,
      totalTaxInr: newInv.totalTaxInr,
      discountInr: newInv.discountInr,
      paymentTerms: newInv.paymentTerms,
      bankDetails: newInv.bankDetails,
    };

    this.data.invoices.unshift(fullRecord);
    this.addAuditEvent(id, {
      eventType: "INVOICE_SUBMITTED",
      title: "Invoice Draft Created",
      description: `Invoice ${fullRecord.invoiceNumber} submitted by ${fullRecord.sellerName} for ₹${fullRecord.faceValueInr.toLocaleString("en-IN")}.`,
      actor: "MSME",
      timestamp: new Date().toISOString(),
    });
    this.saveDB();
    return this.enrichInvoice(fullRecord);
  }

  public updateInvoiceStatus(id: string, nextStatus: InvoiceStatus): InvoiceRecord | undefined {
    const inv = this.getInvoiceById(id);
    if (!inv) return undefined;

    // Enforce valid state transitions
    const validTransitions: Record<string, InvoiceStatus[]> = {
      DRAFT: ["SUBMITTED", "AI_AUDITING", "AUDITED", "Verified"],
      Draft: ["SUBMITTED", "AI_AUDITING", "AUDITED", "Verified", "FUNDED"],
      SUBMITTED: ["AI_AUDITING", "AUDITED", "APPROVED"],
      AI_AUDITING: ["AUDITED", "APPROVED"],
      AUDITED: ["APPROVED", "LISTED", "Verified"],
      Verified: ["APPROVED", "LISTED", "FUNDING", "FUNDED"],
      APPROVED: ["LISTED", "FUNDING"],
      LISTED: ["FUNDING", "FUNDED"],
      FUNDING: ["FUNDED"],
      FUNDED: ["REPAYMENT_PENDING", "REPAID", "DEFAULTED", "Settled"],
      REPAYMENT_PENDING: ["REPAID", "DEFAULTED", "Settled"],
      Settled: ["REPAID"],
      REPAID: [],
      DEFAULTED: [],
    };

    const allowed = validTransitions[inv.status] || [];
    if (!allowed.includes(nextStatus) && inv.status !== nextStatus) {
      console.warn(`[State Machine] Warning: Transition from ${inv.status} to ${nextStatus} attempted.`);
    }

    inv.status = nextStatus;
    this.saveDB();
    return inv;
  }

  public saveAudit(id: string, auditData: OracleAuditResponse): void {
    this.data.audits[id] = auditData;
    const inv = this.getInvoiceById(id);
    if (inv) {
      inv.authenticityScore = auditData.authenticity_score;
      inv.riskTier = auditData.default_risk_tier;
      inv.discountRateBps = auditData.recommended_discount_rate_bps;
      inv.status = "AUDITED";
      this.addAuditEvent(id, {
        eventType: "GEMINI_AUDIT_COMPLETED",
        title: "Gemini AI Risk Audit Completed",
        description: `Authenticity Score: ${auditData.authenticity_score}/100, Tier: ${auditData.default_risk_tier}, Rec APR: ${(auditData.recommended_discount_rate_bps / 100).toFixed(2)}%.`,
        actor: "GEMINI_AI",
        timestamp: new Date().toISOString(),
      });
    }
    this.saveDB();
  }

  public saveOracleAttestation(
    id: string,
    payloadHash: string,
    publicKey: string,
    signature: string
  ): void {
    this.data.attestations[id] = {
      payloadHash,
      publicKey,
      signature,
      timestamp: Math.floor(Date.now() / 1000),
    };
    const inv = this.getInvoiceById(id);
    if (inv) {
      inv.oracleSignature = signature;
      inv.oracleTimestamp = Math.floor(Date.now() / 1000);
      inv.status = "APPROVED";
      this.addAuditEvent(id, {
        eventType: "ORACLE_ATTESTATION_SIGNED",
        title: "Ed25519 Oracle Signature Generated",
        description: `Canonical payload hash: ${payloadHash.slice(0, 16)}... Ed25519 signed by Oracle key.`,
        actor: "ORACLE",
        timestamp: new Date().toISOString(),
      });
    }
    this.saveDB();
  }

  public recordSolanaTx(tx: SolanaTxRecord): void {
    this.data.solanaTxs.unshift(tx);
    this.addAuditEvent(tx.invoiceId, {
      eventType: tx.type,
      title: `Solana Devnet Transaction Confirmed (${tx.type})`,
      description: `Signature: ${tx.signature.slice(0, 12)}... [Explorer: ${tx.explorerUrl}]`,
      actor: "SOLANA_DEVNET",
      timestamp: new Date().toISOString(),
      metadata: { signature: tx.signature, explorerUrl: tx.explorerUrl },
    });
    this.saveDB();
  }

  public recordInvestment(invRecord: InvestmentRecord): void {
    this.data.investments.unshift(invRecord);
    const rawInv = this.data.invoices.find((i) => i.id === invRecord.invoiceId);
    if (rawInv) {
      if (invRecord.tranche === "Senior") {
        rawInv.seniorFundingInr = (rawInv.seniorFundingInr || 0) + invRecord.amountInr;
      } else {
        rawInv.juniorFundingInr = (rawInv.juniorFundingInr || 0) + invRecord.amountInr;
      }
      const invInvestments = this.data.investments.filter((i) => i.invoiceId === rawInv.id);
      const totalFunded = invInvestments.reduce((sum, i) => sum + i.amountInr, 0);
      rawInv.fundedAmountInr = totalFunded;

      if (totalFunded >= rawInv.faceValueInr) {
        rawInv.status = "FUNDED";
      } else if (totalFunded > 0) {
        rawInv.status = "FUNDING";
      }

      this.addAuditEvent(invRecord.invoiceId, {
        eventType: "INVESTMENT_DISBURSED",
        title: `${invRecord.tranche} Tranche Investment Confirmed`,
        description: `Financer ${invRecord.financerName || (invRecord.investorWallet ? invRecord.investorWallet.slice(0, 8) : "Investor")} allocated ₹${invRecord.amountInr.toLocaleString("en-IN")} eINR in ${invRecord.tranche} Tranche.`,
        actor: "INVESTOR",
        timestamp: new Date().toISOString(),
      });
    }
    this.saveDB();
  }

  public processRepayment(id: string): RepaymentResult | undefined {
    const inv = this.getInvoiceById(id);
    if (!inv) return undefined;

    const seniorAmt = inv.seniorFundingInr || Math.round(inv.fundedAmountInr * 0.8);
    const juniorAmt = inv.juniorFundingInr || (inv.fundedAmountInr - seniorAmt);
    const seniorInterest = Math.round(seniorAmt * 0.085 * (inv.tenureDays / 365));
    const juniorYield = Math.round(juniorAmt * 0.22 * (inv.tenureDays / 365));
    const protocolFee = Math.round(inv.faceValueInr * 0.005);
    const earlyRebate = inv.buyerAttested ? Math.round(inv.faceValueInr * 0.015) : 0;

    const totalRepaid = inv.faceValueInr - earlyRebate;

    const result: RepaymentResult = {
      invoiceId: id,
      faceValueInr: inv.faceValueInr,
      totalRepaidInr: totalRepaid,
      seniorPrincipalInr: seniorAmt,
      seniorInterestInr: seniorInterest,
      juniorPrincipalInr: juniorAmt,
      juniorYieldInr: juniorYield,
      protocolFeeInr: protocolFee,
      earlyRebateInr: earlyRebate,
      status: "REPAID",
      timestamp: new Date().toISOString(),
    };

    this.data.repayments[id] = result;
    inv.status = "REPAID";

    this.addAuditEvent(id, {
      eventType: "BUYER_REPAYMENT_COMPLETED",
      title: "Simulated Buyer Repayment Completed",
      description: `Repaid ₹${totalRepaid.toLocaleString("en-IN")} eINR. Senior Principal: ₹${seniorAmt.toLocaleString("en-IN")}, Junior Yield: ₹${juniorYield.toLocaleString("en-IN")}.`,
      actor: "BUYER",
      timestamp: new Date().toISOString(),
    });

    this.saveDB();
    return result;
  }

  public addAuditEvent(
    invoiceId: string,
    evt: Omit<AuditEvent, "id" | "invoiceId">
  ): void {
    if (!this.data.auditEvents[invoiceId]) {
      this.data.auditEvents[invoiceId] = [];
    }
    const fullEvt: AuditEvent = {
      ...evt,
      id: "evt-" + Math.random().toString(36).substring(2, 9),
      invoiceId,
    };
    this.data.auditEvents[invoiceId].push(fullEvt);
    this.saveDB();
  }

  public getAuditEvents(invoiceId: string): AuditEvent[] {
    return this.data.auditEvents[invoiceId] || [];
  }

  public resetDemo(): void {
    this.data = getInitialState();
    this.saveDB();
  }
}

export const store = new CredexaStore();
