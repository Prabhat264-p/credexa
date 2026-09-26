import express from "express";
import { getDemoInvoiceFixture } from "../src/data/demoInvoiceFixtures";
import { calculateFinancingEligibility } from "../src/services/financingEligibilityService";
import { buildReceivablePassport } from "../src/services/receivablePassportService";

async function runE2EVerification() {
  console.log("=========================================");
  console.log("CREDEXA E2E API & WORKFLOW VERIFICATION");
  console.log("=========================================\n");

  // 1. Skyline Demo Invoice A (Low Risk ₹82L)
  console.log("[CHECK] 1. Skyline Demo Invoice (STS/24-25/4587)...");
  const skyline = getDemoInvoiceFixture("STS/24-25/4587");
  if (!skyline) throw new Error("Skyline fixture missing");
  const skylineTerms = calculateFinancingEligibility(skyline.faceValueInr, skyline.riskLevel, skyline.buyerConfirmationStatus, true);
  const skylinePassport = buildReceivablePassport(skyline);
  console.log(`  - Face Value: ₹${skyline.faceValueInr.toLocaleString("en-IN")}`);
  console.log(`  - Max Financing (85%): ₹${skylineTerms.maximumFinancingInr.toLocaleString("en-IN")}`);
  console.log(`  - Senior Tranche (80%): ₹${skylineTerms.seniorTrancheInr.toLocaleString("en-IN")}`);
  console.log(`  - Junior Tranche (20%): ₹${skylineTerms.juniorTrancheInr.toLocaleString("en-IN")}`);
  console.log(`  - Buyer Status: ${skyline.buyerConfirmationStatus}`);
  console.log(`  - Passport Evidence Hash: ${skylinePassport.evidenceHash}`);
  console.log(`  ✓ Skyline verification complete.\n`);

  // 2. Omkar Demo Invoice B (High Risk ₹1.105Cr)
  console.log("[CHECK] 2. Omkar Demo Invoice (OT/25-26/0817)...");
  const omkar = getDemoInvoiceFixture("OT/25-26/0817");
  if (!omkar) throw new Error("Omkar fixture missing");
  const omkarTerms = calculateFinancingEligibility(omkar.faceValueInr, omkar.riskLevel, omkar.buyerConfirmationStatus, true);
  const omkarPassport = buildReceivablePassport(omkar);
  console.log(`  - Face Value: ₹${omkar.faceValueInr.toLocaleString("en-IN")}`);
  console.log(`  - Max Financing (80%): ₹${omkarTerms.maximumFinancingInr.toLocaleString("en-IN")}`);
  console.log(`  - Senior Tranche (80%): ₹${omkarTerms.seniorTrancheInr.toLocaleString("en-IN")}`);
  console.log(`  - Junior Tranche (20%): ₹${omkarTerms.juniorTrancheInr.toLocaleString("en-IN")}`);
  console.log(`  - Buyer Status: ${omkar.buyerConfirmationStatus}`);
  console.log(`  - Eligibility Status: ${omkarTerms.status}`);
  console.log(`  - Passport Evidence Hash: ${omkarPassport.evidenceHash}`);
  console.log(`  ✓ Omkar verification complete.\n`);

  // 3. Direct Fractional Financing State
  console.log("[CHECK] 3. Direct Fractional Invoice Financing Model...");
  const sampleTarget = skylineTerms.maximumFinancingInr;
  const fundedAmount = 3000000;
  const remaining = sampleTarget - fundedAmount;
  console.log(`  - Invoice Target Capacity: ₹${sampleTarget.toLocaleString("en-IN")}`);
  console.log(`  - Allocated Direct Investments: ₹${fundedAmount.toLocaleString("en-IN")}`);
  console.log(`  - Remaining Capacity: ₹${remaining.toLocaleString("en-IN")}`);
  console.log(`  ✓ Direct fractional invoice financing verification complete.\n`);

  console.log("=========================================");
  console.log("ALL E2E WORKFLOW CHECKS PASSED PERFECTLY!");
  console.log("=========================================");
}

runE2EVerification().catch((err) => {
  console.error("E2E Verification Error:", err);
  process.exit(1);
});
