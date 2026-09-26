export interface UnderwritingResult {
  faceValueInr: number;
  advanceRatePct: number;
  maximumFinancingInr: number;
  seniorTrancheInr: number;
  juniorTrancheInr: number;
  status: "ELIGIBLE" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_ELIGIBLE";
  reasoning: string;
}

/**
 * Deterministic Credexa Underwriting & Financing Eligibility Service
 * Rules:
 * - LOW Risk: 85% recommended advance
 * - MEDIUM Risk: 82.5% recommended advance
 * - HIGH Risk: 80% recommended advance
 * - CRITICAL Risk / DISPUTED: 0% / Blocked
 */
export function calculateFinancingEligibility(
  faceValueInr: number,
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string,
  buyerConfirmationStatus: "CONFIRMED" | "PENDING" | "DISPUTED" | string,
  oracleAttested: boolean = true
): UnderwritingResult {
  const normRisk = (riskLevel || "").toUpperCase();
  const normBuyer = (buyerConfirmationStatus || "PENDING").toUpperCase();

  let advanceRatePct = 0;
  if (normRisk.includes("LOW") || normRisk.includes("AAA") || normRisk.includes("AA")) {
    advanceRatePct = 85;
  } else if (normRisk.includes("MEDIUM") || normRisk.includes("BBB") || normRisk.includes("MODERATE")) {
    advanceRatePct = 82.5;
  } else if (normRisk.includes("HIGH") || normRisk.includes("ELEVATED")) {
    advanceRatePct = 80;
  } else {
    advanceRatePct = 0;
  }

  // Calculate maximum financing integer-safe
  const maximumFinancingInr = Math.round(faceValueInr * (advanceRatePct / 100));
  const seniorTrancheInr = Math.round(maximumFinancingInr * 0.80);
  const juniorTrancheInr = maximumFinancingInr - seniorTrancheInr;

  let status: "ELIGIBLE" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_ELIGIBLE" = "ELIGIBLE";
  let reasoning = "";

  if (normBuyer === "DISPUTED") {
    status = "BLOCKED";
    advanceRatePct = 0;
    reasoning = "Invoice is currently disputed by buyer. Funding is blocked.";
  } else if (normBuyer === "PENDING") {
    status = "REVIEW_REQUIRED";
    reasoning = "Buyer confirmation is pending. Underwriting review required before liquidity disbursement.";
  } else if (normRisk.includes("HIGH")) {
    status = "REVIEW_REQUIRED";
    reasoning = "High risk tier detected. Manual risk officer review required.";
  } else if (!oracleAttested) {
    status = "REVIEW_REQUIRED";
    reasoning = "Cryptographic Oracle attestation pending.";
  } else {
    status = "ELIGIBLE";
    reasoning = "Receivable fully verified and buyer confirmed. Eligible for instant fractional financing.";
  }

  return {
    faceValueInr,
    advanceRatePct,
    maximumFinancingInr,
    seniorTrancheInr,
    juniorTrancheInr,
    status,
    reasoning,
  };
}
