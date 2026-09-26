import http from "http";

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runVerification() {
  console.log("=== CREDExA Automated E2E Verification Suite ===");
  let passedCount = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  try {
    // 1. Health check
    const health = await request({ host: "localhost", port: 3000, path: "/health", method: "GET" });
    assert(health.status === 200, "Server Health Check");

    // 2. Create Invoice for Fractional Financing Test
    const invRes = await request(
      {
        host: "localhost",
        port: 3000,
        path: "/api/invoices",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        invoiceNumber: `TEST-FRAC-${Date.now()}`,
        faceValueInr: 1000000,
        advanceRatePct: 85,
        sellerName: "Test Supplier Alpha",
        buyerName: "Test Buyer Corp",
      }
    );

    assert(invRes.status === 200 && invRes.body.success, "Create Invoice for Fractional Financing");
    const invId = invRes.body.invoice.id;
    assert(invRes.body.invoice.faceValueInr === 1000000, "Invoice Face Value is ₹10,00,000");
    assert(invRes.body.invoice.fundedAmountInr === 0, "Invoice Initial Funded Amount is ₹0");

    // 3. Financer A contributes ₹4,00,000
    const fundARes = await request(
      {
        host: "localhost",
        port: 3000,
        path: `/api/invoices/${invId}/fund`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        action: "FUND",
        tranche: "Senior",
        amountInr: 400000,
        financerName: "Financer A",
      }
    );

    assert(fundARes.status === 200 && fundARes.body.success, "Financer A funds ₹4,00,000");
    assert(fundARes.body.fundedAmount === 400000, "Funded Amount after A is ₹4,00,000");
    assert(fundARes.body.remainingAmount === 600000, "Remaining Amount after A is ₹6,00,000");
    assert(fundARes.body.fundingPercentage === 40, "Funding Progress after A is 40%");

    // 4. Financer B contributes ₹3,00,000
    const fundBRes = await request(
      {
        host: "localhost",
        port: 3000,
        path: `/api/invoices/${invId}/fund`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        action: "FUND",
        tranche: "Junior",
        amountInr: 300000,
        financerName: "Financer B",
      }
    );

    assert(fundBRes.status === 200 && fundBRes.body.success, "Financer B funds ₹3,00,000");
    assert(fundBRes.body.fundedAmount === 700000, "Funded Amount after B is ₹7,00,000");
    assert(fundBRes.body.remainingAmount === 300000, "Remaining Amount after B is ₹3,00,000");
    assert(fundBRes.body.fundingPercentage === 70, "Funding Progress after B is 70%");

    // 5. Overfunding Prevention Test: Financer D attempts ₹4,00,000 (Remaining is ₹3,00,000)
    const overfundRes = await request(
      {
        host: "localhost",
        port: 3000,
        path: `/api/invoices/${invId}/fund`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        action: "FUND",
        tranche: "Junior",
        amountInr: 400000,
        financerName: "Financer D",
      }
    );

    assert(overfundRes.status === 400, "Overfunding Rejection HTTP Status is 400");
    assert(
      overfundRes.body.error && overfundRes.body.error.includes("Overfunding prevented"),
      "Overfunding Rejection Message"
    );

    // 6. Financer C contributes ₹3,00,000 (Completing 100%)
    const fundCRes = await request(
      {
        host: "localhost",
        port: 3000,
        path: `/api/invoices/${invId}/fund`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        action: "FUND",
        tranche: "Junior",
        amountInr: 300000,
        financerName: "Financer C",
      }
    );

    assert(fundCRes.status === 200 && fundCRes.body.success, "Financer C funds ₹3,00,000 (Final)");
    assert(fundCRes.body.fundedAmount === 1000000, "Funded Amount after C is ₹10,00,000");
    assert(fundCRes.body.remainingAmount === 0, "Remaining Amount after C is ₹0");
    assert(fundCRes.body.fundingPercentage === 100, "Funding Progress after C is 100%");

    // 7. Duplicate Financing Prevention Test
    const duplicateRes = await request(
      {
        host: "localhost",
        port: 3000,
        path: `/api/invoices/${invId}/fund`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        action: "FUND",
        tranche: "Senior",
        amountInr: 100000,
        financerName: "Financer D",
      }
    );

    assert(duplicateRes.status === 400, "Duplicate Financing Rejection HTTP Status is 400");
    assert(
      duplicateRes.body.error && duplicateRes.body.error.includes("Duplicate invoice financing prevented"),
      "Duplicate Financing Rejection Message"
    );

    // 8. Verify Financers Breakdown List
    const getInvRes = await request({
      host: "localhost",
      port: 3000,
      path: `/api/invoices/${invId}`,
      method: "GET",
    });

    assert(getInvRes.status === 200, "Fetch Detailed Invoice");
    const financers = getInvRes.body.invoice.financers || [];
    assert(financers.length === 3, "Financers List Contains Exactly 3 Financers");

    const financerA = financers.find((f) => f.financerName === "Financer A");
    const financerB = financers.find((f) => f.financerName === "Financer B");
    const financerC = financers.find((f) => f.financerName === "Financer C");

    assert(financerA && financerA.amountInr === 400000 && financerA.sharePct === 40, "Financer A Contribution Recorded (₹4,00,000 / 40%)");
    assert(financerB && financerB.amountInr === 300000 && financerB.sharePct === 30, "Financer B Contribution Recorded (₹3,00,000 / 30%)");
    assert(financerC && financerC.amountInr === 300000 && financerC.sharePct === 30, "Financer C Contribution Recorded (₹3,00,000 / 30%)");

    // 9. Gemini OCR Failure Fallback Rule Test
    const failedOcrRes = await request(
      {
        host: "localhost",
        port: 3000,
        path: "/api/oracle/investigate-fraud",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        fileData: "invalid_base64_garbage_corrupt_file_data_stream_12345",
        mimeType: "application/pdf",
        prompt: "Analyze this invalid document",
      }
    );

    assert(failedOcrRes.status === 200, "OCR Failure Rule API Returns 200 with UNDETERMINED payload");
    const resObj = failedOcrRes.body.result || failedOcrRes.body;
    assert(resObj.risk_assessment?.risk_score === null, "OCR Failure Rule: risk_score is null");
    assert(resObj.risk_assessment?.risk_level === "UNDETERMINED", "OCR Failure Rule: risk_level is 'UNDETERMINED'");
    assert(resObj.document_status === "UNREADABLE", "OCR Failure Rule: document_status is 'UNREADABLE'");
    assert(resObj.analysis_status === "FAILED", "OCR Failure Rule: analysis_status is 'FAILED'");

  } catch (err) {
    console.error("❌ Exception during verification:", err);
  }

  console.log(`\n=== Final Test Results: ${passedCount}/${totalTests} Passed ===`);
  if (passedCount === totalTests) {
    console.log("🎉 ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("⚠️ SOME VERIFICATION TESTS FAILED!");
    process.exit(1);
  }
}

runVerification();
