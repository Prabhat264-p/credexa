import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const prisma = new PrismaClient();

/**
 * Seed initial database records if empty (Demo Financee, Demo Financer, Admin, Demo Invoices)
 */
export async function seedInitialDatabase() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("[Database] Seeding initial users and demo invoice data...");

      const defaultPasswordHash = await bcrypt.hash("password123", 10);

      // 1. Demo Financee
      const financee = await prisma.user.create({
        data: {
          name: "Precision Geartech (MSME Borrower)",
          email: "demo.financee@credexa.io",
          phone: "+91 98200 11223",
          passwordHash: defaultPasswordHash,
          role: "FINANCEE",
          organizationName: "Precision Geartech Auto Ancillaries Pvt Ltd",
          organizationType: "Auto Ancillary MSME Manufacturer",
          gstin: "27AAACP1842Q1Z9",
          walletAddress: "7eT4vQ9...pK3m",
          isVerified: true,
          isDemo: true,
        },
      });

      // 2. Demo Financer
      const financer = await prisma.user.create({
        data: {
          name: "Apex Capital Liquidity Partner",
          email: "demo.financer@credexa.io",
          phone: "+91 98222 44556",
          passwordHash: defaultPasswordHash,
          role: "FINANCER",
          organizationName: "Apex Capital Institutional Vault & LPs",
          organizationType: "Institutional Credit Investor",
          walletAddress: "CRDxJnrLP88zR4...SPL",
          isVerified: true,
          isDemo: true,
        },
      });

      // 3. Admin User
      await prisma.user.create({
        data: {
          name: "Credexa Protocol Admin",
          email: "admin@credexa.io",
          passwordHash: defaultPasswordHash,
          role: "ADMIN",
          organizationName: "Credexa Protocol Governance",
          isVerified: true,
          isDemo: true,
        },
      });

      // 4. Seed Initial Invoices (Including Demo Fixtures STS/24-25/4587 & OT/25-26/0817)
      const invSkyline = await prisma.invoice.create({
        data: {
          invoiceNumber: "STS/24-25/4587",
          financeeId: financee.id,
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
          faceValueInr: 8200000,
          advanceRatePct: 85,
          fundedAmountInr: 0,
          factoringMode: "Recourse",
          status: "APPROVED",
          buyerConfirmationStatus: "CONFIRMED",
          discountRateBps: 850,
          maturityDate: "2025-08-29",
          authenticityScore: 96,
          riskTier: "TIER_AAA",
          oracleSignature: "4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c",
          oracleTimestamp: 1755168000,
          collateralLockedInr: 0,
          isDemo: true,
        },
      });

      const invOmkar = await prisma.invoice.create({
        data: {
          invoiceNumber: "OT/25-26/0817",
          financeeId: financee.id,
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
          faceValueInr: 11050000,
          advanceRatePct: 80,
          fundedAmountInr: 0,
          factoringMode: "Recourse",
          status: "AI_AUDITING",
          buyerConfirmationStatus: "PENDING",
          discountRateBps: 1050,
          maturityDate: "2025-09-12",
          authenticityScore: 68,
          riskTier: "TIER_HIGH_RISK",
          oracleSignature: "7e9f0a1b2c3d4e5f6a7b8c4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c7d",
          oracleTimestamp: 1754995200,
          collateralLockedInr: 0,
          isDemo: true,
        },
      });

      // 5. Seed Audit Logs
      await prisma.auditEvent.createMany({
        data: [
          {
            invoiceId: invSkyline.id,
            userId: financee.id,
            eventType: "INVOICE_SUBMITTED",
            title: "Invoice Draft Created",
            description: `Submitted by ${financee.organizationName} for ₹45,00,000.`,
            actor: "MSME",
          },
          {
            invoiceId: invSkyline.id,
            userId: financee.id,
            eventType: "GEMINI_AUDIT_COMPLETED",
            title: "Gemini AI Audit Completed",
            description: "Authenticity Score: 96/100, Risk Tier: TIER_AAA.",
            actor: "GEMINI_AI",
          },
          {
            invoiceId: invSkyline.id,
            userId: financee.id,
            eventType: "ORACLE_ATTESTATION_SIGNED",
            title: "Ed25519 Oracle Signature Signed",
            description: "Signed by Credexa Credit Oracle private key.",
            actor: "ORACLE",
          },
        ],
      });

      console.log("[Database] Initial seeding completed successfully.");
    }
  } catch (err) {
    console.warn("[Database] Error seeding database:", err);
  }
}

seedInitialDatabase();
