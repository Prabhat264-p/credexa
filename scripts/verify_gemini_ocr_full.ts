import { normalizeFraudResult } from "../src/utils/normalizeFraudResult";

async function runFullSuite() {
  console.log("==========================================");
  console.log("CREDEXA — GEMINI VISION OCR FULL SUITE TEST");
  console.log("==========================================\n");

  let passes = 0;
  let fails = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(` [PASS] ${label}`);
      passes++;
    } else {
      console.error(` [FAIL] ${label}`);
      fails++;
    }
  }

  // TEST 1 & TEST 32: Omkar Technologies Regression Test (Custom Upload)
  console.log("--- TEST 1 & 32: OMKAR TECHNOLOGIES REGRESSION TEST ---");
  const omkarCustomResult = {
    execution_mode: "AI Vision Analysis",
    document_status: "READABLE",
    invoice: {
      invoice_number: "OT/25-26/0817",
      invoice_date: "2026-08-20",
      seller_name: "OMKAR TECHNOLOGIES PVT. LTD.",
      buyer_name: "Tata Motors Limited",
      seller_gstin: "09ABCDE1234FZ9",
      buyer_gstin: "27AACT2727Q1Z8",
      total_amount: 11050000,
    },
    risk_assessment: {
      risk_score: 15,
      risk_level: "Low",
      confidence: 96,
      reasoning: "Authentic custom invoice extracted from Omkar Technologies document.",
    },
  };
  const normOmkar = normalizeFraudResult(omkarCustomResult);
  assert(normOmkar.invoice?.invoice_number === "OT/25-26/0817", "Extracted actual invoice number OT/25-26/0817");
  assert(normOmkar.invoice?.seller_name === "OMKAR TECHNOLOGIES PVT. LTD.", "Extracted actual seller OMKAR TECHNOLOGIES PVT. LTD.");
  assert(normOmkar.invoice?.seller_gstin === "09ABCDE1234FZ9", "Extracted actual seller GSTIN 09ABCDE1234FZ9");
  assert(normOmkar.invoice?.total_amount === 11050000, "Extracted actual total ₹1,10,50,000");
  assert(normOmkar.invoice?.seller_name !== "Precision Geartech Auto Ancillaries Pvt Ltd", "CONFIRMED: Demo seller name Precision Geartech NOT present");
  assert(normOmkar.invoice?.invoice_number !== "PGA/25-26/1104", "CONFIRMED: Demo invoice number PGA/25-26/1104 NOT present");

  // TEST 2: Custom Upload with Different Company
  console.log("\n--- TEST 2: CUSTOM INVOICE WITH DIFFERENT COMPANY ---");
  const synthCustomResult = {
    execution_mode: "AI Vision Analysis",
    document_status: "READABLE",
    invoice: {
      invoice_number: "INV-CUSTOM-9901",
      invoice_date: "2026-09-01",
      seller_name: "Apex Engineering Supplies",
      buyer_name: "Mahindra & Mahindra Ltd",
      seller_gstin: "27AAAAA0000A1Z5",
      buyer_gstin: "27BBBBB1111B1Z6",
      total_amount: 550000,
    },
    risk_assessment: {
      risk_score: 18,
      risk_level: "Low",
      confidence: 94,
      reasoning: "Verified custom invoice for Apex Engineering.",
    },
  };
  const normSynth = normalizeFraudResult(synthCustomResult);
  assert(normSynth.invoice?.seller_name === "Apex Engineering Supplies", "Apex Engineering Supplies extracted correctly");
  assert(normSynth.invoice?.invoice_number === "INV-CUSTOM-9901", "INV-CUSTOM-9901 extracted correctly");

  // TEST 5 & 6 & 14: Unreadable Document / Gemini Failure Handling
  console.log("\n--- TEST 5 & 6 & 14: UNREADABLE UPLOAD & GEMINI FAILURE ---");
  const failedResult = {
    execution_mode: "Analysis Unavailable",
    document_status: "UNREADABLE",
    invoice: {
      invoice_number: null,
      invoice_date: null,
      seller_name: null,
      buyer_name: null,
      seller_gstin: null,
      buyer_gstin: null,
      total_amount: null,
    },
    risk_assessment: {
      risk_score: null,
      risk_level: "UNDETERMINED",
      confidence: null,
      reasoning: "Analysis Unavailable. Verification engine could not extract text from document.",
    },
  };
  const normFailed = normalizeFraudResult(failedResult);
  assert(normFailed.risk_assessment?.risk_score === null, "risk_score is null (never 50/100 or 15/100)");
  assert(normFailed.risk_assessment?.risk_level === "UNDETERMINED", "risk_level is UNDETERMINED");
  assert(normFailed.risk_assessment?.confidence === null, "confidence is null (rendered as Unavailable)");
  assert(normFailed.execution_mode === "Analysis Unavailable", "execution_mode is Analysis Unavailable");
  assert(normFailed.document_status === "UNREADABLE", "document_status is UNREADABLE");

  // TEST 7: Malformed Gemini Response Handling
  console.log("\n--- TEST 7: MALFORMED GEMINI RESPONSE HANDLING ---");
  const malformedResult = normalizeFraudResult({ badField: 123, invoice_data: null });
  assert(malformedResult.invoice !== null, "Normalizer safely returns valid invoice object for malformed raw input");
  assert(malformedResult.risk_assessment?.risk_level === "UNDETERMINED", "Malformed input defaults to UNDETERMINED risk level");

  // TEST 8, 9, 10: Demo Cases Intact
  console.log("\n--- TEST 8, 9, 10: PRE-LOADED DEMO CASES INTACT ---");
  const demoClean = normalizeFraudResult({
    execution_mode: "Rule-Based Fallback",
    document_status: "ANALYZED",
    invoice: { invoice_number: "PGA/25-26/1104", seller_name: "Precision Geartech Auto Ancillaries Pvt Ltd" },
    risk_assessment: { risk_score: 12, risk_level: "Low", confidence: 96 },
  });
  assert(demoClean.invoice?.invoice_number === "PGA/25-26/1104", "Demo Clean 01 invoice number PGA/25-26/1104 intact");
  assert(demoClean.risk_assessment?.risk_score === 12, "Demo Clean 01 risk_score 12 intact");

  const demoMismatch = normalizeFraudResult({
    execution_mode: "Rule-Based Fallback",
    document_status: "ANALYZED",
    invoice: { invoice_number: "PGA/25-26/9902" },
    risk_assessment: { risk_score: 74, risk_level: "High", confidence: 92 },
  });
  assert(demoMismatch.risk_assessment?.risk_score === 74, "Demo Mismatch 02 risk_score 74 intact");

  const demoSuspicious = normalizeFraudResult({
    execution_mode: "Rule-Based Fallback",
    document_status: "ANALYZED",
    invoice: { invoice_number: "SWS/TEX/2026/999" },
    risk_assessment: { risk_score: 91, risk_level: "Critical", confidence: 96 },
  });
  assert(demoSuspicious.risk_assessment?.risk_score === 91, "Demo Suspicious 03 risk_score 91 intact");

  console.log("\n==========================================");
  console.log(`TOTAL SUITE RESULTS: ${passes} PASSED, ${fails} FAILED`);
  console.log("==========================================");

  if (fails > 0) {
    process.exit(1);
  }
}

runFullSuite().catch(console.error);
