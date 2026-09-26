use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use anchor_spl::token_2022::spl_token_2022::extension::metadata_pointer::instruction::initialize as init_metadata_pointer;
use anchor_spl::token_2022::Token2022;

declare_id!("CRDXa9Vw8XqZ7YpD4b1sL3K9v2M7uT5h8R1eW0qNxYz");

pub mod errors;
pub mod state;

use errors::*;
use state::*;

#[program]
pub mod credexa_core {
    use super::*;

    /// Initialize the Global Protocol Configuration PDA
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_fee_bps: u16,
        reserve_allocation_bps: u16,
        oracle_pubkey: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.einr_mint = ctx.accounts.einr_mint.key();
        config.oracle_pubkey = oracle_pubkey;
        config.protocol_fee_bps = protocol_fee_bps;
        config.reserve_allocation_bps = reserve_allocation_bps;
        config.total_invoices_tokenized = 0;
        config.total_volume_einr = 0;
        config.active_funded_volume_einr = 0;
        config.insurance_reserve_balance = 0;
        config.bump = ctx.bumps.config;
        config.reserve_bump = ctx.bumps.insurance_reserve;

        emit!(ProtocolInitializedEvent {
            admin: config.admin,
            einr_mint: config.einr_mint,
            oracle_pubkey,
            protocol_fee_bps,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Tokenize an MSME Invoice using SPL Token-2022 with Metadata Extension
    /// Embeds legal debt assignment, IRN, GSTINs, and face value.
    pub fn tokenize_invoice(
        ctx: Context<TokenizeInvoice>,
        params: TokenizeInvoiceParams,
    ) -> Result<()> {
        require!(params.tenure_days >= 15 && params.tenure_days <= 180, CredexaError::InvalidTenure);
        require!(params.face_value_einr > 0, CredexaError::InvalidFaceValue);

        let invoice = &mut ctx.accounts.invoice;
        let clock = Clock::get()?;

        invoice.invoice_mint = ctx.accounts.invoice_mint.key();
        invoice.seller = ctx.accounts.seller.key();
        invoice.buyer = params.buyer_pubkey;
        invoice.face_value_einr = params.face_value_einr;
        invoice.advance_rate_bps = params.advance_rate_bps;
        invoice.discount_rate_bps = params.discount_rate_bps;
        invoice.tenure_days = params.tenure_days;
        invoice.created_at = clock.unix_timestamp;
        invoice.maturity_timestamp = clock.unix_timestamp + (params.tenure_days as i64 * 86_400);
        invoice.factoring_mode = params.factoring_mode;
        invoice.status = InvoiceStatus::Draft;
        invoice.irn_hash = params.irn_hash;
        invoice.hsn_code = params.hsn_code;
        invoice.seller_gstin = params.seller_gstin;
        invoice.buyer_gstin = params.buyer_gstin;
        invoice.buyer_attested = false;
        invoice.buyer_rebate_bps = 0;
        invoice.senior_funded_einr = 0;
        invoice.junior_funded_einr = 0;
        invoice.collateral_locked_einr = 0;
        invoice.bump = ctx.bumps.invoice;

        // If Recourse Factoring, seller locks collateral buffer (e.g. 10% of face value)
        if params.factoring_mode == FactoringMode::Recourse && params.collateral_amount_einr > 0 {
            let cpi_accounts = TransferChecked {
                from: ctx.accounts.seller_einr_account.to_account_info(),
                mint: ctx.accounts.einr_mint.to_account_info(),
                to: ctx.accounts.collateral_vault.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
            token_interface::transfer_checked(cpi_ctx, params.collateral_amount_einr, 6)?;
            invoice.collateral_locked_einr = params.collateral_amount_einr;
        }

        let config = &mut ctx.accounts.config;
        config.total_invoices_tokenized = config.total_invoices_tokenized.checked_add(1).unwrap();

        emit!(InvoiceTokenizedEvent {
            invoice: invoice.key(),
            invoice_mint: invoice.invoice_mint,
            seller: invoice.seller,
            buyer: invoice.buyer,
            face_value_einr: invoice.face_value_einr,
            factoring_mode: invoice.factoring_mode,
            tenure_days: invoice.tenure_days,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Verify Oracle Credit Signature & Update Risk Tier
    pub fn verify_oracle_evaluation(
        ctx: Context<VerifyOracleEvaluation>,
        payload: OraclePayload,
        signature: [u8; 64],
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let invoice = &mut ctx.accounts.invoice;

        // Ensure caller or oracle is authorized
        require!(
            ctx.accounts.oracle_signer.key() == config.oracle_pubkey,
            CredexaError::UnauthorizedOracle
        );
        require!(invoice.status == InvoiceStatus::Draft, CredexaError::InvalidInvoiceStatus);

        invoice.authenticity_score = payload.authenticity_score;
        invoice.risk_tier = payload.default_risk_tier;
        invoice.discount_rate_bps = payload.recommended_discount_rate_bps;
        invoice.status = InvoiceStatus::Verified;
        invoice.oracle_evaluated_at = Clock::get()?.unix_timestamp;

        emit!(OracleVerifiedEvent {
            invoice: invoice.key(),
            authenticity_score: invoice.authenticity_score,
            risk_tier: invoice.risk_tier,
            discount_rate_bps: invoice.discount_rate_bps,
            timestamp: invoice.oracle_evaluated_at,
        });

        Ok(())
    }

    /// Enterprise Buyer Co-Sign & Attestation
    /// Lowers discount rate by agreed bps and registers early settlement rebate eligibility
    pub fn buyer_attest_invoice(
        ctx: Context<BuyerAttestInvoice>,
        agreed_rebate_bps: u16,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        require!(
            ctx.accounts.buyer.key() == invoice.buyer,
            CredexaError::UnauthorizedBuyer
        );
        require!(
            invoice.status == InvoiceStatus::Draft || invoice.status == InvoiceStatus::Verified,
            CredexaError::InvalidInvoiceStatus
        );

        invoice.buyer_attested = true;
        invoice.buyer_rebate_bps = agreed_rebate_bps;
        // 200 bps discount reduction for enterprise co-signature
        invoice.discount_rate_bps = invoice.discount_rate_bps.saturating_sub(200);

        emit!(BuyerAttestedEvent {
            invoice: invoice.key(),
            buyer: invoice.buyer,
            rebate_bps: agreed_rebate_bps,
            discount_reduction_bps: 200,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Fund Invoice via Multi-Tranche Liquidity Pools (Junior first-loss + Senior senior-risk)
    pub fn fund_invoice_tranches(
        ctx: Context<FundInvoiceTranches>,
        senior_allocation_einr: u64,
        junior_allocation_einr: u64,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;

        require!(invoice.status == InvoiceStatus::Verified, CredexaError::InvoiceNotVerified);

        let total_funding = senior_allocation_einr.checked_add(junior_allocation_einr).unwrap();
        let max_advance = (invoice.face_value_einr as u128)
            .checked_mul(invoice.advance_rate_bps as u128).unwrap()
            .checked_div(10_000).unwrap() as u64;

        require!(total_funding <= max_advance, CredexaError::ExceedsMaxAdvance);

        // Protocol reserve deduction (e.g. 0.5% buffer)
        let protocol_fee = (total_funding as u128)
            .checked_mul(config.protocol_fee_bps as u128).unwrap()
            .checked_div(10_000).unwrap() as u64;
        let net_disbursement = total_funding.checked_sub(protocol_fee).unwrap();

        // 1. Transfer Senior Tranche eINR
        let senior_pool_seeds = &[
            b"senior_vault".as_ref(),
            &[ctx.bumps.senior_vault],
        ];
        let senior_signer = &[&senior_pool_seeds[..]];

        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.senior_vault.to_account_info(),
                    mint: ctx.accounts.einr_mint.to_account_info(),
                    to: ctx.accounts.seller_einr_account.to_account_info(),
                    authority: ctx.accounts.senior_vault.to_account_info(),
                },
                senior_signer,
            ),
            senior_allocation_einr,
            6,
        )?;

        // 2. Transfer Junior Tranche eINR
        let junior_pool_seeds = &[
            b"junior_vault".as_ref(),
            &[ctx.bumps.junior_vault],
        ];
        let junior_signer = &[&junior_pool_seeds[..]];

        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.junior_vault.to_account_info(),
                    mint: ctx.accounts.einr_mint.to_account_info(),
                    to: ctx.accounts.seller_einr_account.to_account_info(),
                    authority: ctx.accounts.junior_vault.to_account_info(),
                },
                junior_signer,
            ),
            junior_allocation_einr.saturating_sub(protocol_fee),
            6,
        )?;

        // 3. Deposit protocol fee into Insurance Reserve PDA
        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.junior_vault.to_account_info(),
                    mint: ctx.accounts.einr_mint.to_account_info(),
                    to: ctx.accounts.insurance_reserve_vault.to_account_info(),
                    authority: ctx.accounts.junior_vault.to_account_info(),
                },
                junior_signer,
            ),
            protocol_fee,
            6,
        )?;

        invoice.senior_funded_einr = senior_allocation_einr;
        invoice.junior_funded_einr = junior_allocation_einr;
        invoice.status = InvoiceStatus::Funded;
        invoice.funded_at = clock.unix_timestamp;

        config.active_funded_volume_einr = config.active_funded_volume_einr.checked_add(total_funding).unwrap();
        config.total_volume_einr = config.total_volume_einr.checked_add(total_funding).unwrap();
        config.insurance_reserve_balance = config.insurance_reserve_balance.checked_add(protocol_fee).unwrap();

        emit!(InvoiceFundedEvent {
            invoice: invoice.key(),
            senior_funded: senior_allocation_einr,
            junior_funded: junior_allocation_einr,
            protocol_fee,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Full Repayment & Early Rebate Settlement by Buyer or Seller
    pub fn settle_invoice(
        ctx: Context<SettleInvoice>,
        repayment_amount_einr: u64,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        let clock = Clock::get()?;

        require!(invoice.status == InvoiceStatus::Funded, CredexaError::InvalidInvoiceStatus);

        let is_early = clock.unix_timestamp < invoice.maturity_timestamp;
        let mut early_rebate_amount = 0u64;

        // If settled early and buyer is attested, calculate dynamic rebate
        if is_early && invoice.buyer_attested && invoice.buyer_rebate_bps > 0 {
            let days_early = ((invoice.maturity_timestamp - clock.unix_timestamp) / 86_400).max(1) as u64;
            early_rebate_amount = (invoice.face_value_einr as u128)
                .checked_mul(invoice.buyer_rebate_bps as u128).unwrap()
                .checked_mul(days_early as u128).unwrap()
                .checked_div(365 * 10_000).unwrap() as u64;
        }

        let effective_repayment = repayment_amount_einr.saturating_sub(early_rebate_amount);

        // Transfer funds from payer to tranche pools
        // Senior tranche principal + interest returned first
        let senior_due = invoice.senior_funded_einr;
        let junior_due = effective_repayment.saturating_sub(senior_due);

        token_interface::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.payer_einr_account.to_account_info(),
                    mint: ctx.accounts.einr_mint.to_account_info(),
                    to: ctx.accounts.senior_vault.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            senior_due,
            6,
        )?;

        if junior_due > 0 {
            token_interface::transfer_checked(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    TransferChecked {
                        from: ctx.accounts.payer_einr_account.to_account_info(),
                        mint: ctx.accounts.einr_mint.to_account_info(),
                        to: ctx.accounts.junior_vault.to_account_info(),
                        authority: ctx.accounts.payer.to_account_info(),
                    },
                ),
                junior_due,
                6,
            )?;
        }

        // Release collateral to seller if Recourse Factoring
        if invoice.factoring_mode == FactoringMode::Recourse && invoice.collateral_locked_einr > 0 {
            let invoice_key = invoice.key();
            let collateral_seeds = &[
                b"collateral".as_ref(),
                invoice_key.as_ref(),
                &[invoice.bump],
            ];
            let signer = &[&collateral_seeds[..]];

            token_interface::transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    TransferChecked {
                        from: ctx.accounts.collateral_vault.to_account_info(),
                        mint: ctx.accounts.einr_mint.to_account_info(),
                        to: ctx.accounts.seller_einr_account.to_account_info(),
                        authority: ctx.accounts.collateral_vault.to_account_info(),
                    },
                    signer,
                ),
                invoice.collateral_locked_einr,
                6,
            )?;
            invoice.collateral_locked_einr = 0;
        }

        invoice.status = InvoiceStatus::Settled;
        invoice.settled_at = clock.unix_timestamp;

        let config = &mut ctx.accounts.config;
        config.active_funded_volume_einr = config.active_funded_volume_einr.saturating_sub(invoice.senior_funded_einr + invoice.junior_funded_einr);

        emit!(InvoiceSettledEvent {
            invoice: invoice.key(),
            repaid_einr: effective_repayment,
            early_rebate_applied: early_rebate_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// 15-Day Grace Period Expiration & Default Trigger
    /// Recourse: Liquidates seller collateral & intercepts future protocol distributions.
    /// Non-recourse: Protocol-absorbed default, junior tranche absorbs first loss, insurance reserve covers shortfall.
    pub fn trigger_invoice_default(
        ctx: Context<TriggerInvoiceDefault>,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        let clock = Clock::get()?;

        require!(invoice.status == InvoiceStatus::Funded, CredexaError::InvalidInvoiceStatus);

        let grace_deadline = invoice.maturity_timestamp + (15 * 86_400);
        require!(clock.unix_timestamp >= grace_deadline, CredexaError::GracePeriodActive);

        invoice.status = InvoiceStatus::Defaulted;
        invoice.defaulted_at = clock.unix_timestamp;

        if invoice.factoring_mode == FactoringMode::Recourse && invoice.collateral_locked_einr > 0 {
            // Recourse clawback: liquidate collateral to Senior Tranche first
            let invoice_key = invoice.key();
            let collateral_seeds = &[
                b"collateral".as_ref(),
                invoice_key.as_ref(),
                &[invoice.bump],
            ];
            let signer = &[&collateral_seeds[..]];

            token_interface::transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    TransferChecked {
                        from: ctx.accounts.collateral_vault.to_account_info(),
                        mint: ctx.accounts.einr_mint.to_account_info(),
                        to: ctx.accounts.senior_vault.to_account_info(),
                        authority: ctx.accounts.collateral_vault.to_account_info(),
                    },
                    signer,
                ),
                invoice.collateral_locked_einr,
                6,
            )?;
        } else {
            // Non-recourse: Insurance reserve fund buffers senior tranche deficit
            let reserve_seeds = &[
                b"insurance_reserve".as_ref(),
                &[ctx.accounts.config.reserve_bump],
            ];
            let reserve_signer = &[&reserve_seeds[..]];

            let recovery_amount = ctx.accounts.insurance_reserve_vault.amount.min(invoice.senior_funded_einr);
            if recovery_amount > 0 {
                token_interface::transfer_checked(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        TransferChecked {
                            from: ctx.accounts.insurance_reserve_vault.to_account_info(),
                            mint: ctx.accounts.einr_mint.to_account_info(),
                            to: ctx.accounts.senior_vault.to_account_info(),
                            authority: ctx.accounts.insurance_reserve_vault.to_account_info(),
                        },
                        reserve_signer,
                    ),
                    recovery_amount,
                    6,
                )?;
            }
        }

        emit!(InvoiceDefaultedEvent {
            invoice: invoice.key(),
            seller: invoice.seller,
            buyer: invoice.buyer,
            factoring_mode: invoice.factoring_mode,
            unpaid_einr: invoice.face_value_einr,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}
