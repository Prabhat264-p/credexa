import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";
export const MEMO_PROGRAM_ID = new PublicKey("MemoSsq6gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcY");

export interface WalletConnectionState {
  connected: boolean;
  publicKey: string | null;
  balanceSol: number;
  network: "Solana Devnet";
  error: string | null;
}

export function getSolanaExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function getSolscanExplorerUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}

/**
 * Detect Phantom / Solflare or Web3 wallet in window.solana
 */
export function getPhantomProvider(): any {
  if ("solana" in window) {
    const provider = (window as any).solana;
    if (provider?.isPhantom || provider?.isSolflare || provider) {
      return provider;
    }
  }
  return null;
}

/**
 * Fetch SOL balance on Solana Devnet
 */
export async function getDevnetSolBalance(pubKeyStr: string): Promise<number> {
  try {
    const connection = new Connection(SOLANA_DEVNET_RPC, "confirmed");
    const pubKey = new PublicKey(pubKeyStr);
    const balanceLamports = await connection.getBalance(pubKey);
    return balanceLamports / LAMPORTS_PER_SOL;
  } catch (err) {
    console.warn("[Solana Devnet] Error fetching balance:", err);
    return 0;
  }
}

/**
 * Connect Phantom Wallet to Solana Devnet
 */
export async function connectPhantomWallet(): Promise<WalletConnectionState> {
  const provider = getPhantomProvider();

  if (!provider) {
    return {
      connected: false,
      publicKey: null,
      balanceSol: 0,
      network: "Solana Devnet",
      error: "Phantom Wallet extension not found in browser. Please install Phantom from https://phantom.app",
    };
  }

  try {
    const response = await provider.connect();
    const pubKey = response.publicKey.toString();
    const balance = await getDevnetSolBalance(pubKey);

    return {
      connected: true,
      publicKey: pubKey,
      balanceSol: balance,
      network: "Solana Devnet",
      error: null,
    };
  } catch (err: any) {
    return {
      connected: false,
      publicKey: null,
      balanceSol: 0,
      network: "Solana Devnet",
      error: err.message || "User rejected wallet connection request.",
    };
  }
}

/**
 * Build & Send REAL Solana Devnet Anchor Memo Transaction
 */
export async function executeSolanaDevnetAnchorTx(
  invoiceId: string,
  canonicalPayloadHash: string,
  amountInr: number,
  actionType: "ANCHOR" | "FUND" | "REPAY" = "ANCHOR"
): Promise<{ signature: string; slot: number; explorerUrl: string }> {
  const provider = getPhantomProvider();

  if (!provider || !provider.publicKey) {
    throw new Error("Solana wallet is not connected. Please connect Phantom first.");
  }

  const connection = new Connection(SOLANA_DEVNET_RPC, "confirmed");

  // Check Devnet SOL balance
  const balance = await connection.getBalance(provider.publicKey);
  if (balance < 5000) {
    throw new Error(
      "Insufficient Devnet SOL to pay transaction fee. Please request free Devnet SOL from https://faucet.solana.com"
    );
  }

  // 1. Get Latest Devnet Blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  // 2. Build Memo Transaction Instruction
  const memoString = `Credexa Protocol v1.4 | Action:${actionType} | Invoice:${invoiceId} | Value:₹${amountInr.toLocaleString(
    "en-IN"
  )} | Hash:${canonicalPayloadHash.slice(0, 32)}`;

  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: provider.publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoString, "utf-8"),
  });

  const transaction = new Transaction({
    feePayer: provider.publicKey,
    recentBlockhash: blockhash,
  }).add(memoInstruction);

  // 3. Request Wallet Signature & Submit to Solana Devnet RPC
  const { signature } = await provider.signAndSendTransaction(transaction);

  // 4. Confirm Transaction on Solana Devnet
  const confirmation = await connection.confirmTransaction(signature, "confirmed");

  return {
    signature,
    slot: confirmation.context.slot || 0,
    explorerUrl: getSolanaExplorerUrl(signature),
  };
}
