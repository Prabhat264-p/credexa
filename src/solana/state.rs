use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[account]
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub einr_mint: Pubkey,
    pub oracle_pubkey: Pubkey,
    pub protocol_fee_bps: u16,
    pub reserve_allocation_bps: u16,
    pub total_invoices_tokenized: u64,
    pub total_volume_einr: u64,
    pub active_funded_volume_einr: u64,
    pub insurance_reserve_balance: u64,
    pub bump: u8,
    pub reserve_bump: u8,
}

impl ProtocolConfig {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 2 + 2 + 8 + 8 + 8 + 8 + 1 + 1;
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
    Settled,
    GracePeriod,
    Defaulted,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum RiskTier {
    TierAAA,
    TierAA,
    TierA,
    TierBBB,
    TierHighRisk,
}

#[account]
pub struct InvoiceAccount {
    pub invoice_mint: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub face_value_einr: u64,
    pub advance_rate_bps: u16,
    pub discount_rate_bps: u16,
    pub tenure_days: u16,
    pub created_at: i64,
    pub maturity_timestamp: i64,
    pub funded_at: i64,
    pub settled_at: i64,
    pub defaulted_at: i64,
    pub factoring_mode: FactoringMode,
    pub status: InvoiceStatus,
    pub irn_hash: [u8; 32],
    pub hsn_code: [u8; 8],
    pub seller_gstin: [u8; 15],
    pub buyer_gstin: [u8; 15],
    pub authenticity_score: u8,
    pub risk_tier: RiskTier,
    pub oracle_evaluated_at: i64,
    pub buyer_attested: bool,
    pub buyer_rebate_bps: u16,
    pub senior_funded_einr: u64,
    pub junior_funded_einr: u64,
    pub collateral_locked_einr: u64,
    pub bump: u8,
}

impl InvoiceAccount {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 2 + 2 + 2 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 32 + 8 + 15 + 15 + 1 + 1 + 8 + 1 + 2 + 8 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TokenizeInvoiceParams {
    pub buyer_pubkey: Pubkey,
    pub face_value_einr: u64,
    pub advance_rate_bps: u16,
    pub discount_rate_bps: u16,
    pub tenure_days: u16,
    pub factoring_mode: FactoringMode,
    pub collateral_amount_einr: u64,
    pub irn_hash: [u8; 32],
    pub hsn_code: [u8; 8],
    pub seller_gstin: [u8; 15],
    pub buyer_gstin: [u8; 15],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OraclePayload {
    pub invoice_id: String,
    pub authenticity_score: u8,
    pub default_risk_tier: RiskTier,
    pub recommended_discount_rate_bps: u16,
    pub max_advance_rate_pct: u8,
    pub junior_tranche_buffer_pct: u8,
    pub timestamp: i64,
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = admin,
        space = ProtocolConfig::LEN,
        seeds = [b"credexa_config"],
        bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub einr_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = admin,
        seeds = [b"insurance_reserve"],
        bump,
        token::mint = einr_mint,
        token::authority = insurance_reserve,
    )]
    pub insurance_reserve: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TokenizeInvoice<'info> {
    #[account(
        mut,
        seeds = [b"credexa_config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(
        init,
        payer = seller,
        space = InvoiceAccount::LEN,
        seeds = [b"invoice", invoice_mint.key().as_ref()],
        bump
    )]
    pub invoice: Account<'info, InvoiceAccount>,
    /// Token-2022 Mint for the tokenized invoice asset
    pub invoice_mint: InterfaceAccount<'info, Mint>,
    pub einr_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub seller_einr_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = seller,
        seeds = [b"collateral", invoice_mint.key().as_ref()],
        bump,
        token::mint = einr_mint,
        token::authority = collateral_vault,
    )]
    pub collateral_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VerifyOracleEvaluation<'info> {
    #[account(seeds = [b"credexa_config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, seeds = [b"invoice", invoice.invoice_mint.as_ref()], bump = invoice.bump)]
    pub invoice: Account<'info, InvoiceAccount>,
    pub oracle_signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct BuyerAttestInvoice<'info> {
    #[account(mut, seeds = [b"invoice", invoice.invoice_mint.as_ref()], bump = invoice.bump)]
    pub invoice: Account<'info, InvoiceAccount>,
    pub buyer: Signer<'info>,
}

#[derive(Accounts)]
pub struct FundInvoiceTranches<'info> {
    #[account(mut, seeds = [b"credexa_config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, seeds = [b"invoice", invoice.invoice_mint.as_ref()], bump = invoice.bump)]
    pub invoice: Account<'info, InvoiceAccount>,
    pub einr_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [b"senior_vault"],
        bump
    )]
    pub senior_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"junior_vault"],
        bump
    )]
    pub junior_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"insurance_reserve"],
        bump = config.reserve_bump
    )]
    pub insurance_reserve_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub seller_einr_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct SettleInvoice<'info> {
    #[account(mut, seeds = [b"credexa_config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, seeds = [b"invoice", invoice.invoice_mint.as_ref()], bump = invoice.bump)]
    pub invoice: Account<'info, InvoiceAccount>,
    pub einr_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub payer_einr_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, seeds = [b"senior_vault"], bump)]
    pub senior_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, seeds = [b"junior_vault"], bump)]
    pub junior_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, seeds = [b"collateral", invoice.invoice_mint.as_ref()], bump = invoice.bump)]
    pub collateral_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub seller_einr_account: InterfaceAccount<'info, TokenAccount>,
    pub payer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct TriggerInvoiceDefault<'info> {
    #[account(mut, seeds = [b"credexa_config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, seeds = [b"invoice", invoice.invoice_mint.as_ref()], bump = invoice.bump)]
    pub invoice: Account<'info, InvoiceAccount>,
    pub einr_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds = [b"collateral", invoice.invoice_mint.as_ref()], bump = invoice.bump)]
    pub collateral_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, seeds = [b"senior_vault"], bump)]
    pub senior_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, seeds = [b"insurance_reserve"], bump = config.reserve_bump)]
    pub insurance_reserve_vault: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

// Protocol Events
#[event]
pub struct ProtocolInitializedEvent {
    pub admin: Pubkey,
    pub einr_mint: Pubkey,
    pub oracle_pubkey: Pubkey,
    pub protocol_fee_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct InvoiceTokenizedEvent {
    pub invoice: Pubkey,
    pub invoice_mint: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub face_value_einr: u64,
    pub factoring_mode: FactoringMode,
    pub tenure_days: u16,
    pub timestamp: i64,
}

#[event]
pub struct OracleVerifiedEvent {
    pub invoice: Pubkey,
    pub authenticity_score: u8,
    pub risk_tier: RiskTier,
    pub discount_rate_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct BuyerAttestedEvent {
    pub invoice: Pubkey,
    pub buyer: Pubkey,
    pub rebate_bps: u16,
    pub discount_reduction_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct InvoiceFundedEvent {
    pub invoice: Pubkey,
    pub senior_funded: u64,
    pub junior_funded: u64,
    pub protocol_fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct InvoiceSettledEvent {
    pub invoice: Pubkey,
    pub repaid_einr: u64,
    pub early_rebate_applied: u64,
    pub timestamp: i64,
}

#[event]
pub struct InvoiceDefaultedEvent {
    pub invoice: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub factoring_mode: FactoringMode,
    pub unpaid_einr: u64,
    pub timestamp: i64,
}
