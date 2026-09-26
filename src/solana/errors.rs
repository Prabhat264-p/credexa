use anchor_lang::prelude::*;

#[error_code]
pub enum CredexaError {
    #[msg("Invoice tenure must be between 15 and 180 days")]
    InvalidTenure,
    #[msg("Invoice face value must be greater than zero eINR")]
    InvalidFaceValue,
    #[msg("Caller is not authorized as the protocol Oracle")]
    UnauthorizedOracle,
    #[msg("Caller is not authorized as the registered enterprise buyer")]
    UnauthorizedBuyer,
    #[msg("Invoice status is not valid for this operation")]
    InvalidInvoiceStatus,
    #[msg("Invoice has not been verified by the Gemini credit oracle")]
    InvoiceNotVerified,
    #[msg("Total tranche funding exceeds max permissible advance rate")]
    ExceedsMaxAdvance,
    #[msg("15-day grace period is still active; default cannot be triggered yet")]
    GracePeriodActive,
    #[msg("Insufficient liquidity in the selected tranche vault")]
    InsufficientVaultLiquidity,
    #[msg("Math overflow during yield or fee calculation")]
    MathOverflow,
}
