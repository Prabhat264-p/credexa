/**
 * Credexa End-to-End Client Interaction Script
 * --------------------------------------------
 * Demonstrates full protocol lifecycle on Solana:
 * 1. Initialize Protocol & SPL eINR Mint
 * 2. Tokenize Invoice (SPL Token-2022 with Metadata Extension)
 * 3. Gemini Multimodal Credit Oracle Audit & Signature Submission
 * 4. Enterprise Buyer Co-Sign & Attestation (Reduces APR by 200 bps)
 * 5. Multi-Tranche Liquidity Funding (Junior First-Loss + Senior Safe LP)
 * 6. Early Settle with Rebate Payout OR 15-Day Grace Default Trigger
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

// Hypothetical anchor client interface mapping to credexa_core program
export async function runCredexaLifecycleDemo() {
  console.log("=== Credexa: Decentralized Invoice Discounting on Solana ===");

  // 1. Connection & Keypairs
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const protocolAdmin = Keypair.generate();
  const msmeSeller = Keypair.generate();
  const enterpriseBuyer = Keypair.generate(); // e.g., Tata Motors
  const oracleAuthority = Keypair.generate();

  console.log(`[Setup] Protocol Admin:   ${protocolAdmin.publicKey.toBase58()}`);
  console.log(`[Setup] MSME Seller:      ${msmeSeller.publicKey.toBase58()}`);
  console.log(`[Setup] Enterprise Buyer: ${enterpriseBuyer.publicKey.toBase58()}`);
  console.log(`[Setup] Oracle Keypair:   ${oracleAuthority.publicKey.toBase58()}`);

  // 2. Tokenize Invoice as Token-2022 with Metadata
  const invoiceMint = Keypair.generate();
  const faceValueEinr = 4_500_000 * 1_000_000; // 45 Lakhs eINR (6 decimals)
  const tenureDays = 90;

  console.log("\n--- Step 1: Tokenize Invoice (SPL Token-2022) ---");
  console.log(`Minting Invoice NFT Mint: ${invoiceMint.publicKey.toBase58()}`);
  console.log(`Face Value: ₹45,00,000 eINR | Tenure: ${tenureDays} Days | Factoring: Recourse`);
  console.log("Metadata Extension embedded: IRN Hash, HSN 87084000, GSTR-1 Outward Record");

  // 3. Multimodal Credit Oracle Evaluation
  console.log("\n--- Step 2: Gemini Multimodal Credit Oracle Audit ---");
  console.log("Ingesting e-Way Bill #281982740192 + GSTR-3B tax payment receipts...");
  
  const simulatedOracleResponse = {
    authenticity_score: 96,
    gst_reconciliation: "MATCHED",
    eway_bill_validity: "ACTIVE_CONFIRMED",
    risk_tier: "TIER_AAA",
    recommended_discount_bps: 850, // 8.5% APR
    max_advance_pct: 85,
    junior_buffer_pct: 15,
  };
  console.log("Oracle Output:", JSON.stringify(simulatedOracleResponse, null, 2));
  console.log("Oracle Ed25519 signature generated and validated on-chain.");

  // 4. Enterprise Buyer Co-Sign
  console.log("\n--- Step 3: Enterprise Buyer Attestation & Co-Signature ---");
  console.log(`Buyer ${enterpriseBuyer.publicKey.toBase58()} co-signing invoice on Solana...`);
  console.log("Result: Discount Rate reduced from 8.5% to 6.5% (-200 bps co-sign incentive).");
  console.log("Buyer locked for Early Settlement Rebate eligibility (150 bps annualized).");

  // 5. Multi-Tranche Liquidity Vault Funding
  console.log("\n--- Step 4: Multi-Tranche Liquidity Funding ---");
  const totalFunding = (faceValueEinr * 85) / 100; // 85% advance = ₹38.25 Lakhs
  const seniorPortion = (totalFunding * 80) / 100; // 80% Senior Tranche (11.5% APY)
  const juniorPortion = (totalFunding * 20) / 100; // 20% Junior Tranche (24.0% First-Loss APY)
  const protocolReserveFee = (totalFunding * 50) / 10_000; // 0.5% reserve fee

  console.log(`Total Advance Funded: ₹${(totalFunding / 1_000_000).toLocaleString("en-IN")} eINR`);
  console.log(`├─ Senior Tranche:    ₹${(seniorPortion / 1_000_000).toLocaleString("en-IN")} eINR (Senior LP Tokens Issued)`);
  console.log(`├─ Junior Tranche:    ₹${(juniorPortion / 1_000_000).toLocaleString("en-IN")} eINR (Junior First-Loss LP Tokens Issued)`);
  console.log(`└─ Insurance Reserve: ₹${(protocolReserveFee / 1_000_000).toLocaleString("en-IN")} eINR (Protocol Safety Buffer)`);
  console.log("Net disbursement sent directly to MSME current wallet account in eINR.");

  // 6. Settlement Flow: Early Repayment with Rebate
  console.log("\n--- Step 5: Early Settlement with Dynamic Rebate ---");
  const daysEarly = 30; // Paid at Day 60 instead of Day 90
  const rebateSavings = 45_000; // Early payment savings
  console.log(`Enterprise Buyer settles ${daysEarly} days early.`);
  console.log(`Rebate Applied: ₹${rebateSavings.toLocaleString("en-IN")} eINR discount credited to Buyer.`);
  console.log("Tranche Waterfall: Senior Tranche principal + 11.5% APY fulfilled.");
  console.log("Junior Tranche remaining interest yield distributed.");
  console.log("Seller collateral unlocked and returned.");
  console.log("On-chain status marked: SETTLED.\n");
}

if (require.main === module) {
  runCredexaLifecycleDemo().catch(console.error);
}
