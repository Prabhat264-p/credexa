export interface LendingRecommendation {
  eligible: boolean;
  recommendedPercentage: number | null;
  recommendedAmount: number | null;
  minimumRangeAmount: number | null;
  maximumRangeAmount: number | null;
  reasoning: string[];
}

/**
 * Deterministically calculates AI-based lending range and recommended advance amount
 * strictly enforcing the 80% to 85% rule based on risk tier and authenticity score.
 */
export function calculateLendingRecommendation(
  invoiceTotal: number | null,
  riskLevel: string = "UNDETERMINED",
  riskScore: number | null = null
): LendingRecommendation {
  // If invoice total is missing, invalid, <= 0, or risk level is UNDETERMINED/Critical/High
  if (
    invoiceTotal === null ||
    isNaN(invoiceTotal) ||
    invoiceTotal <= 0 ||
    riskLevel === "UNDETERMINED" ||
    riskLevel === "Critical" ||
    riskLevel === "High"
  ) {
    let reason = "Analysis unavailable — manual verification required.";
    if (riskLevel === "Critical") {
      reason = "Critical risk flags detected on invoice. Automatic financing restricted.";
    } else if (riskLevel === "High") {
      reason = "High risk level detected. Manual underwriting review required prior to financing.";
    } else if (invoiceTotal === null || invoiceTotal <= 0) {
      reason = "Invoice face value could not be determined from document OCR.";
    }

    return {
      eligible: false,
      recommendedPercentage: null,
      recommendedAmount: null,
      minimumRangeAmount: null,
      maximumRangeAmount: null,
      reasoning: [reason],
    };
  }

  // Base Rule: 80% minimum to 85% maximum advance rate
  const minPct = 80;
  const maxPct = 85;

  let recPct = 85;
  if (riskLevel === "Moderate" || riskLevel === "Elevated") {
    recPct = 80;
  } else if (riskLevel === "Low") {
    recPct = 85;
  }

  const minAmount = Math.round(invoiceTotal * (minPct / 100));
  const maxAmount = Math.round(invoiceTotal * (maxPct / 100));
  const recAmount = Math.round(invoiceTotal * (recPct / 100));

  // Enforce strict upper bound (never > 85%) and lower bound (never negative or > invoice total)
  const safeRecAmount = Math.min(maxAmount, Math.max(0, recAmount));

  return {
    eligible: true,
    recommendedPercentage: recPct,
    recommendedAmount: safeRecAmount,
    minimumRangeAmount: minAmount,
    maximumRangeAmount: maxAmount,
    reasoning: [
      `Invoice face value ₹${invoiceTotal.toLocaleString("en-IN")}`,
      `Risk tier assessment: ${riskLevel}`,
      `AI Recommended advance rate: ${recPct}% (₹${safeRecAmount.toLocaleString("en-IN")})`,
      `Financing range: ₹${minAmount.toLocaleString("en-IN")} (80%) – ₹${maxAmount.toLocaleString("en-IN")} (85%)`,
    ],
  };
}
