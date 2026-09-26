export type Role = "FINANCEE" | "FINANCER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationName?: string | null;
  gstin?: string | null;
  walletAddress?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  isVerified?: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  read: boolean;
  createdAt: string;
}

export type FactoringMode = "Recourse" | "NonRecourse";

export type InvoiceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "AI_AUDITING"
  | "AUDITED"
  | "APPROVED"
  | "LISTED"
  | "FUNDING"
  | "FUNDED"
  | "REPAYMENT_PENDING"
  | "REPAID"
  | "DEFAULTED"
  | "Draft"
  | "Verified"
  | "Funded"
  | "Settled"
  | "GracePeriod"
  | "Defaulted";

export type RiskTier =
  | "TIER_AAA"
  | "TIER_AA"
  | "TIER_A"
  | "TIER_BBB"
  | "TIER_HIGH_RISK";

export interface InvoiceRecord {
  id: string;
  token2022Mint: string;
  invoiceNumber: string;
  invoiceDate: string;
  tenureDays: number;
  faceValueInr: number;
  advanceRatePct: number;
  fundedAmountInr: number;
  sellerName: string;
  sellerGstin: string;
  sellerLocation: string;
  sellerWallet: string;
  sellerAddress?: string;
  buyerName: string;
  buyerGstin: string;
  buyerWallet: string;
  buyerAddress?: string;
  dueDate?: string;
  cgstInr?: number;
  sgstInr?: number;
  igstInr?: number;
  totalTaxInr?: number;
  discountInr?: number;
  paymentTerms?: string;
  bankDetails?: string;
  itemDescription: string;
  hsnCode: string;
  ewayBillNumber: string;
  poNumber: string;
  irn: string;
  factoringMode: FactoringMode;
  status: InvoiceStatus;
  discountRateBps: number;
  seniorFundingInr: number;
  juniorFundingInr: number;
  buyerAttested: boolean;
  buyerRebateBps: number;
  attestationTimestamp?: number;
  buyerConfirmationStatus?: "CONFIRMED" | "PENDING" | "DISPUTED";
  buyerConfirmedAt?: string;
  buyerConfirmedBy?: string;
  disputeReason?: string;
  disputeComment?: string;
  token2022MintAddress?: string;
  token2022TxSignature?: string;
  canonicalHash?: string;
  maturityDate: string;
  daysOverdue: number;
  authenticityScore: number;
  riskTier: RiskTier;
  oracleSignature?: string;
  oracleTimestamp?: number;
  collateralLockedInr?: number;
  userId?: string;
  investments?: InvestmentRecord[];
  financers?: Array<{
    id: string;
    financerName: string;
    amountInr: number;
    tranche: string;
    fundedAt: string;
    sharePct: number;
  }>;
}

export interface OracleAuditResponse {
  authenticity_score: number;
  gst_reconciliation_status: "MATCHED" | "DISCREPANCY" | "UNVERIFIED";
  eway_bill_validity: "ACTIVE_CONFIRMED" | "EXPIRED" | "MISMATCH";
  default_risk_tier: RiskTier;
  recommended_discount_rate_bps: number;
  max_advance_rate_pct: number;
  junior_tranche_buffer_pct: number;
  underwriting_flags: string[];
  reasoning_summary: string;
}

export interface OracleAuditResult {
  success: boolean;
  oraclePubKey: string;
  oracleSignature: string;
  canonicalPayload: string;
  timestamp: number;
  audit: OracleAuditResponse;
}

export interface TranchePool {
  id: string;
  name: string;
  type: "Junior" | "Senior";
  targetApy: number;
  totalDepositsInr: number;
  activeAllocationsInr: number;
  availableLiquidityInr: number;
  lpTokenMint: string;
  lpPriceInr: number;
  firstLossCoveragePct: number;
  description: string;
}

export interface WebhookLog {
  id: string;
  eventType: string;
  invoiceId: string;
  timestamp: string;
  recipientPhone: string;
  recipientRole: string;
  message: string;
  status: "DELIVERED" | "FAILED";
}

export interface LineItemData {
  description: string;
  quantity?: number;
  unit_price?: number;
  tax_rate?: number;
  subtotal?: number;
}

export interface ExtractedInvoiceData {
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  seller_name: string | null;
  buyer_name: string | null;
  seller_gstin: string | null;
  buyer_gstin: string | null;
  seller_address?: string | null;
  buyer_address?: string | null;
  po_number: string | null;
  eway_bill_number: string | null;
  hsn_sac_codes?: string | null;
  currency: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  tax_rate?: number | null;
  subtotal: number | null;
  discount?: number | null;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  total_tax?: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  payment_terms?: string | null;
  bank_details?: string | null;
  line_items?: LineItemData[] | null;
}

export interface FinancialValidation {
  calculation_status: "PASS" | "WARNING" | "FAIL" | "UNKNOWN";
  expected_total: number | null;
  displayed_total: number | null;
  difference: number | null;
  findings: string[];
}

export interface VisualForensicFinding {
  finding: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: string;
  location: string;
  explanation: string;
}

export interface CrossDocumentCheck {
  field: string;
  invoice_value: string;
  reference_value: string;
  status: "MATCH" | "MISMATCH" | "UNKNOWN";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
}

export interface DuplicateCheck {
  status: "UNIQUE" | "POTENTIAL_DUPLICATE" | "UNCHECKED";
  explanation: string;
}

export interface FraudSignal {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: string;
  explanation: string;
}

export interface RiskAssessment {
  risk_score: number | null;
  risk_level: "Low" | "Moderate" | "Elevated" | "High" | "Critical" | "UNDETERMINED";
  confidence: number | null;
  reasoning: string;
}

export interface FraudInvestigationResult {
  execution_mode: "AI Vision Analysis" | "Rule-Based Fallback" | "Analysis Unavailable";
  document_status: "ANALYZED" | "UNREADABLE" | "ERROR" | "UNAVAILABLE" | "READABLE";
  analysis_status?: "COMPLETED" | "FAILED";
  invoice: ExtractedInvoiceData;
  financial_validation: FinancialValidation;
  visual_forensics: VisualForensicFinding[];
  cross_document_checks: CrossDocumentCheck[];
  duplicate_check: DuplicateCheck;
  fraud_signals: FraudSignal[];
  risk_assessment: RiskAssessment;
  recommended_actions: string[];
  investigation_summary: string;
  lending?: {
    eligible: boolean;
    recommendedPercentage: number | null;
    recommendedAmount: number | null;
    minimumRangeAmount: number | null;
    maximumRangeAmount: number | null;
    reasoning: string[];
  };
}

export interface FraudChatMessage {
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
}

export interface AuditEvent {
  id: string;
  invoiceId: string;
  eventType: string;
  title: string;
  description: string;
  actor: "MSME" | "GEMINI_AI" | "ORACLE" | "SOLANA_DEVNET" | "INVESTOR" | "BUYER" | "SYSTEM";
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SolanaTxRecord {
  signature: string;
  network: "Solana Devnet";
  type: "INVOICE_ANCHOR" | "TRANCHE_FUNDING" | "REPAYMENT_SETTLEMENT";
  invoiceId: string;
  slot?: number;
  blockTime?: number;
  explorerUrl: string;
  payloadHash: string;
  timestamp: string;
}

export type InvestmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED"
  | "REPAID"
  | "DEFAULTED";

export type FinancingStatus =
  | "NOT_REQUESTED"
  | "OPEN"
  | "PARTIALLY_FUNDED"
  | "FULLY_FUNDED"
  | "SETTLED"
  | "CANCELLED"
  | "DEFAULTED";

export interface InvestmentRecord {
  id: string;
  invoiceId: string;
  investorWallet: string;
  investorWalletAddress?: string;
  financerName?: string;
  financerId?: string;
  amountInr: number;
  currency?: string;
  tranche?: "Senior" | "Junior";
  solanaTxSignature?: string;
  explorerUrl?: string;
  status: InvestmentStatus;
  repaymentAmount?: number | null;
  repaidAt?: string | null;
  fundedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RepaymentResult {
  invoiceId: string;
  faceValueInr: number;
  totalRepaidInr: number;
  seniorPrincipalInr: number;
  seniorInterestInr: number;
  juniorPrincipalInr: number;
  juniorYieldInr: number;
  protocolFeeInr: number;
  earlyRebateInr: number;
  status: "REPAID";
  timestamp: string;
}
