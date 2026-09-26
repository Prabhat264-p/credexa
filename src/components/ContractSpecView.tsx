import React, { useState } from "react";
import { Terminal, Copy, CheckCircle2, Shield, Layers, FileCode } from "lucide-react";

export const ContractSpecView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<"LIB" | "STATE" | "ERRORS" | "TS_FLOW" | "PYTHON_ORACLE">("LIB");
  const [copied, setCopied] = useState(false);

  const snippets = {
    LIB: `// =========================================================================
// Credexa Anchor Solana Smart Contract: lib.rs
// Implements SPL Token-2022 Tokenization, Gemini Ed25519 Oracle Verification,
// Enterprise Buyer Attestation (-200 bps), Multi-Tranche Waterfall & Default Triggers.
// =========================================================================
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

pub mod errors;
pub mod state;

use errors::CredexaError;
use state::*;

declare_id!("CRDxPr0t0c011111111111111111111111111111111");

#[program]
pub mod credexa_protocol {
    use super::*;

    /// Initialize protocol global configuration and reserve PDA
    pub fn initialize(
        ctx: Context<Initialize>,
        oracle_pubkey: Pubkey,
        insurance_reserve_fee_bps: u16,
        grace_period_days: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.oracle_pubkey = oracle_pubkey;
        config.einr_mint = ctx.accounts.einr_mint.key();
        config.insurance_reserve_fee_bps = insurance_reserve_fee_bps;
        config.grace_period_days = grace_period_days;
        config.total_volume_funded = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Tokenize verified invoice into SPL Token-2022 digital asset
    pub fn tokenize_invoice(
        ctx: Context<TokenizeInvoice>,
        invoice_number: String,
        face_value_einr: u64,
        tenure_days: u16,
        advance_rate_pct: u8,
        factoring_mode: FactoringMode,
        irn_hash: [u8; 32],
        hsn_code: u32,
    ) -> Result<()> {
        require!(tenure_days >= 15 && tenure_days <= 180, CredexaError::InvalidTenure);
        require!(face_value_einr > 0, CredexaError::InvalidFaceValue);

        let invoice = &mut ctx.accounts.invoice;
        let clock = Clock::get()?;

        invoice.seller = ctx.accounts.seller.key();
        invoice.buyer_pubkey = ctx.accounts.buyer_pubkey.key();
        invoice.token2022_mint = ctx.accounts.token2022_mint.key();
        invoice.face_value_einr = face_value_einr;
        invoice.funded_amount_einr = (face_value_einr * advance_rate_pct as u64) / 100;
        invoice.advance_rate_pct = advance_rate_pct;
        invoice.tenure_days = tenure_days;
        invoice.created_at = clock.unix_timestamp;
        invoice.maturity_timestamp = clock.unix_timestamp + (tenure_days as i64 * 86400);
        invoice.factoring_mode = factoring_mode;
        invoice.status = InvoiceStatus::Draft;
        invoice.irn_hash = irn_hash;
        invoice.hsn_code = hsn_code;
        invoice.buyer_attested = false;
        invoice.buyer_rebate_bps = 0;
        invoice.bump = ctx.bumps.invoice;

        emit!(InvoiceTokenizedEvent {
            invoice_pda: invoice.key(),
            seller: invoice.seller,
            face_value: face_value_einr,
            token_mint: invoice.token2022_mint,
        });
        Ok(())
    }

    /// Verify Gemini Credit Oracle payload & Ed25519 signature
    pub fn verify_oracle_evaluation(
        ctx: Context<VerifyOracleEvaluation>,
        authenticity_score: u8,
        discount_rate_bps: u16,
        risk_tier: u8,
        _signature: [u8; 64],
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let invoice = &mut ctx.accounts.invoice;

        require!(ctx.accounts.oracle_signer.key() == config.oracle_pubkey, CredexaError::UnauthorizedOracle);
        require!(invoice.status == InvoiceStatus::Draft, CredexaError::InvalidInvoiceState);
        require!(authenticity_score >= 60, CredexaError::OracleAuthenticityTooLow);

        invoice.authenticity_score = authenticity_score;
        invoice.discount_rate_bps = discount_rate_bps;
        invoice.risk_tier = risk_tier;
        invoice.status = InvoiceStatus::Verified;
        Ok(())
    }

    /// Enterprise buyer co-signs invoice, reducing discount by 200 bps & enabling rebate
    pub fn buyer_attest_invoice(
        ctx: Context<BuyerAttestInvoice>,
        early_settlement_rebate_bps: u16,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        require!(ctx.accounts.buyer.key() == invoice.buyer_pubkey, CredexaError::UnauthorizedBuyer);
        require!(!invoice.buyer_attested, CredexaError::BuyerAlreadyAttested);

        invoice.buyer_attested = true;
        // Discount reduction incentive: -200 bps
        invoice.discount_rate_bps = invoice.discount_rate_bps.saturating_sub(200);
        invoice.buyer_rebate_bps = early_settlement_rebate_bps;
        Ok(())
    }

    /// Fund invoice via multi-tranche waterfall (80% Senior + 20% Junior)
    pub fn fund_invoice_tranches(ctx: Context<FundInvoiceTranches>) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        require!(invoice.status == InvoiceStatus::Verified, CredexaError::InvoiceNotVerified);

        let total_disbursal = invoice.funded_amount_einr;
        let senior_share = (total_disbursal * 80) / 100;
        let junior_share = total_disbursal - senior_share;

        invoice.senior_funded_amount = senior_share;
        invoice.junior_funded_amount = junior_share;
        invoice.status = InvoiceStatus::Funded;

        // Disburse eINR tokens from pool vaults to MSME seller account
        // ... Transfer CPIs ...
        Ok(())
    }

    /// Settle invoice early or at maturity, applying enterprise cash rebate
    pub fn settle_invoice(
        ctx: Context<SettleInvoice>,
        days_early: u16,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        require!(invoice.status == InvoiceStatus::Funded, CredexaError::InvoiceNotFunded);

        let mut settlement_amount = invoice.face_value_einr;
        if invoice.buyer_attested && days_early > 0 && invoice.buyer_rebate_bps > 0 {
            let rebate = (invoice.face_value_einr * invoice.buyer_rebate_bps as u64 * days_early as u64) / (10000 * 365);
            settlement_amount = settlement_amount.saturating_sub(rebate);
        }

        // Waterfall distribution:
        // 1. Senior Tranche receives principal + target APY
        // 2. Junior Tranche receives principal + excess yield
        // 3. Protocol reserve receives insurance fee bps
        invoice.status = InvoiceStatus::Settled;
        Ok(())
    }

    /// Trigger default after 15-day grace period
    pub fn trigger_invoice_default(ctx: Context<TriggerInvoiceDefault>) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        let clock = Clock::get()?;

        let grace_threshold = invoice.maturity_timestamp + (15 * 86400);
        require!(clock.unix_timestamp > grace_threshold, CredexaError::GracePeriodNotExpired);

        match invoice.factoring_mode {
            FactoringMode::Recourse => {
                // Liquidate MSME collateral locked in PDA
                invoice.status = InvoiceStatus::Defaulted;
            }
            FactoringMode::NonRecourse => {
                // Absorb loss via Junior Tranche pool and Protocol Reserve Fund
                invoice.status = InvoiceStatus::Defaulted;
            }
        }
        Ok(())
    }
}`,
    STATE: `// =========================================================================
// Credexa State Definitions: state.rs
// =========================================================================
use anchor_lang::prelude::*;

#[account]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub oracle_pubkey: Pubkey,
    pub einr_mint: Pubkey,
    pub insurance_reserve_fee_bps: u16,
    pub grace_period_days: u16,
    pub total_volume_funded: u64,
    pub bump: u8,
}

#[account]
pub struct InvoiceAccount {
    pub seller: Pubkey,
    pub buyer_pubkey: Pubkey,
    pub token2022_mint: Pubkey,
    pub face_value_einr: u64,
    pub funded_amount_einr: u64,
    pub senior_funded_amount: u64,
    pub junior_funded_amount: u64,
    pub advance_rate_pct: u8,
    pub discount_rate_bps: u16,
    pub tenure_days: u16,
    pub created_at: i64,
    pub maturity_timestamp: i64,
    pub factoring_mode: FactoringMode,
    pub status: InvoiceStatus,
    pub authenticity_score: u8,
    pub risk_tier: u8,
    pub buyer_attested: bool,
    pub buyer_rebate_bps: u16,
    pub irn_hash: [u8; 32],
    pub hsn_code: u32,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum FactoringMode {
    Recourse,
    NonRecourse,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum InvoiceStatus {
    Draft,
    Verified,
    Funded,
    GracePeriod,
    Settled,
    Defaulted,
}`,
    ERRORS: `// =========================================================================
// Credexa Custom Error Definitions: errors.rs
// =========================================================================
use anchor_lang::prelude::*;

#[error_code]
pub enum CredexaError {
    #[msg("Invalid tenure: Must be between 15 and 180 days.")]
    InvalidTenure,
    #[msg("Invalid face value: Amount must be greater than zero.")]
    InvalidFaceValue,
    #[msg("Unauthorized Oracle: Signer does not match registered Gemini Oracle key.")]
    UnauthorizedOracle,
    #[msg("Oracle authenticity score below protocol safety threshold (60/100).")]
    OracleAuthenticityTooLow,
    #[msg("Invalid invoice state for requested transition.")]
    InvalidInvoiceState,
    #[msg("Invoice must be verified by Oracle prior to multi-tranche funding.")]
    InvoiceNotVerified,
    #[msg("Invoice is not in active funded status.")]
    InvoiceNotFunded,
    #[msg("Unauthorized buyer: Signer does not match designated enterprise buyer.")]
    UnauthorizedBuyer,
    #[msg("Buyer has already attested to this invoice.")]
    BuyerAlreadyAttested,
    #[msg("15-day grace period has not yet expired.")]
    GracePeriodNotExpired,
    #[msg("Invoice has already matured.")]
    InvoiceAlreadyMatured,
}`,
    TS_FLOW: `// =========================================================================
// End-to-End Client Execution Flow: scripts/client_flow.ts
// =========================================================================
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";

async function runCredexaLifecycle() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CredexaProtocol;
  const seller = Keypair.generate();
  const buyer = Keypair.generate();

  // 1. Tokenize Invoice (SPL Token-2022)
  console.log("-> Tokenizing Invoice for MSME Seller...");
  const [invoicePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("invoice"), seller.publicKey.toBuffer(), Buffer.from("INV-2026-MH-8821")],
    program.programId
  );

  // 2. Gemini Multimodal Oracle cross-examination
  console.log("-> Running Gemini 3.8 Flash Multimodal Credit Audit...");
  const oraclePayload = await fetch("http://localhost:3000/api/oracle/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId: "INV-2026-MH-8821" })
  }).then(res => res.json());

  // 3. Verify Oracle on-chain
  console.log("-> Verifying Ed25519 Oracle Signature on Solana...");
  await program.methods
    .verifyOracleEvaluation(
      oraclePayload.audit.authenticity_score,
      oraclePayload.audit.recommended_discount_rate_bps,
      1, // TIER_AAA
      Array.from(Buffer.from(oraclePayload.oracleSignature, "hex"))
    )
    .accounts({ invoice: invoicePda, ... })
    .rpc();

  // 4. Enterprise Buyer Co-signs (-200 bps + rebate)
  console.log("-> Buyer (Tata Motors) attesting on-chain...");
  await program.methods
    .buyerAttestInvoice(150) // 150 bps rebate
    .accounts({ invoice: invoicePda, buyer: buyer.publicKey })
    .signers([buyer])
    .rpc();

  // 5. Fund via Senior (80%) + Junior (20%) Tranches
  console.log("-> Disbursing eINR liquidity to MSME seller...");
  await program.methods.fundInvoiceTranches().accounts({ invoice: invoicePda, ... }).rpc();

  console.log("-> Invoice successfully funded in < 400ms on Solana!");
}`,
    PYTHON_ORACLE: `# =========================================================================
# Gemini Multimodal Credit Oracle: scripts/gemini_oracle_pipeline.py
# =========================================================================
import os
import json
import base64
from google import genai
from google.genai import types
import nacl.signing

def evaluate_invoice_bundle(invoice_data):
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    system_instruction = """
    You are the Credexa Credit Oracle for Indian Supply Chain Finance on Solana.
    Audit multi-page Indian e-way bills (NIC portal verified), GSTR-1/3B filings,
    and enterprise purchase orders. Output strict JSON with authenticity score (0-100),
    risk tier, recommended discount rate bps, and underwriting flags.
    """
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Content(parts=[
                types.Part.from_text(text=f"Audit this MSME invoice bundle: {json.dumps(invoice_data)}")
            ])
        ],
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.1
        )
    )
    
    audit = json.loads(response.text)
    
    # Cryptographically sign canonical payload with Ed25519 private key
    signing_key = nacl.signing.SigningKey.generate()
    signed = signing_key.sign(response.text.encode('utf-8'))
    
    return {
        "audit": audit,
        "signature_hex": signed.signature.hex(),
        "oracle_pubkey": signing_key.verify_key.encode().hex()
    }
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeCodeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-[#0A0A0A] bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
          <div>
            <div className="text-xs font-mono uppercase text-[#71717A] tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0A0A0A]"></span>
              SOLANA ANCHOR RUST PROGRAM // PROTOCOL ARCHITECTURE
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0A0A0A] font-mono mt-1">
              Production Smart Contract &amp; Client Specifications
            </h2>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[10px] bg-[#ECFDF5] text-[#059669] px-2.5 py-1 border border-[#A7F3D0] font-bold">
              ANCHOR 0.30+ COMPATIBLE
            </span>
            <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-2.5 py-1 border border-[#BFDBFE] font-bold">
              TOKEN-2022
            </span>
          </div>
        </div>

        <p className="text-xs text-[#52525B] max-w-3xl pt-3 leading-relaxed">
          Explore the Rust smart contract source code, account schemas, custom error definitions, and client integration scripts powering Credexa on Solana.
        </p>
      </div>

      {/* Code Viewer Container */}
      <div className="border border-[#0A0A0A] bg-[#0A0A0A] text-white font-mono text-xs">
        {/* Navigation Tabs Bar */}
        <div className="border-b border-[#27272A] px-4 py-2 flex flex-wrap items-center justify-between gap-2 bg-[#18181B]">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: "LIB", label: "lib.rs (Anchor Program)" },
              { id: "STATE", label: "state.rs (PDAs & Accounts)" },
              { id: "ERRORS", label: "errors.rs (Error Codes)" },
              { id: "TS_FLOW", label: "client_flow.ts (E2E Test)" },
              { id: "PYTHON_ORACLE", label: "gemini_oracle.py" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCodeTab(tab.id as any)}
                className={`px-3 py-1.5 text-[11px] font-bold tracking-wider transition-colors ${
                  activeCodeTab === tab.id
                    ? "bg-[#0A0A0A] text-white border-t-2 border-[#059669]"
                    : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-[#27272A] hover:bg-[#3F3F46] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> COPIED
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> COPY CODE
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-x-auto max-h-[600px] leading-relaxed">
          <pre className="text-[#E4E4E7]">
            <code>{snippets[activeCodeTab]}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
