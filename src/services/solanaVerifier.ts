import { Connection } from '@solana/web3.js';

const DEVNET_RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export interface VerificationResult {
  verified: boolean;
  signature: string;
  slot?: number;
  blockTime?: number | null;
  error?: string;
  explorerUrl: string;
  cluster: string;
}

export async function verifySolanaTransaction(signature: string): Promise<VerificationResult> {
  const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

  if (!signature || signature.length < 32) {
    return {
      verified: false,
      signature,
      error: 'Invalid Solana transaction signature format',
      explorerUrl,
      cluster: 'devnet'
    };
  }

  try {
    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const txInfo = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    }).catch(() => null);

    if (txInfo && (!txInfo.meta || !txInfo.meta.err)) {
      return {
        verified: true,
        signature,
        slot: txInfo.slot,
        blockTime: txInfo.blockTime,
        explorerUrl,
        cluster: 'devnet'
      };
    }

    return {
      verified: false,
      signature,
      error: 'Transaction not confirmed or not found on Solana Devnet ledger',
      explorerUrl,
      cluster: 'devnet'
    };
  } catch (err: any) {
    console.warn(`Solana RPC verification error for ${signature}:`, err?.message || err);
    return {
      verified: false,
      signature,
      error: `RPC verification query failed: ${err?.message || err}`,
      explorerUrl,
      cluster: 'devnet'
    };
  }
}
