import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import crypto from "crypto";

const PRIMARY_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const FALLBACK_RPCS = [
  PRIMARY_RPC,
  "https://api.devnet.solana.com",
  "https://rpc.ankr.com/solana_devnet",
];

const MEMO_PROGRAM_ID = new PublicKey("MemoSsq6gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcY");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const RENT_SYSVAR_ID = new PublicKey("SysvarRent111111111111111111111111111111111");

export function getSolanaConnection(rpcUrl?: string): Connection {
  return new Connection(rpcUrl || PRIMARY_RPC, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 30000,
  });
}

export function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function getMintExplorerUrl(mintAddress: string): string {
  return `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`;
}

/**
 * Fetches real Devnet SOL balance for a given public address
 */
export async function getCustodialBalanceSol(publicAddress: string): Promise<number> {
  try {
    const connection = getSolanaConnection();
    const pubKey = new PublicKey(publicAddress);
    const lamports = await connection.getBalance(pubKey);
    return lamports / LAMPORTS_PER_SOL;
  } catch (err: any) {
    console.warn(`[Solana RPC Error] Failed to fetch balance for ${publicAddress}:`, err.message);
    return 0;
  }
}

/**
 * Requests Devnet SOL airdrop for testing
 */
export async function requestCustodialAirdrop(publicAddress: string, amountSol: number = 1.0): Promise<string> {
  try {
    const connection = getSolanaConnection();
    const pubKey = new PublicKey(publicAddress);
    const lamports = Math.round(Math.min(amountSol, 2.0) * LAMPORTS_PER_SOL);
    
    const signature = await connection.requestAirdrop(pubKey, lamports);
    await connection.confirmTransaction(signature, "confirmed");
    return signature;
  } catch (err: any) {
    throw new Error(`Solana Devnet airdrop failed: ${err.message || err}`);
  }
}

let masterKeypairCache: Keypair | null = null;
export function getProtocolMasterKeypair(): Keypair {
  if (!masterKeypairCache) {
    const seed = crypto.createHash("sha256").update("credexa-solana-devnet-master-protocol-payer-v3").digest();
    masterKeypairCache = Keypair.fromSeed(seed);
  }
  return masterKeypairCache;
}

/**
 * Executes a REAL Solana Devnet transaction signed by a Custodial Keypair
 * returns REAL transaction signature, slot, blockTime, and explorerUrl
 */
export async function executeCustodialDevnetAnchor(
  signerKeypair: Keypair,
  memoText: string
): Promise<{ signature: string; slot: number; blockTime: number | null; explorerUrl: string }> {
  const connection = getSolanaConnection();
  const masterKeypair = getProtocolMasterKeypair();

  let feePayer = signerKeypair;
  let additionalSigner: Keypair | null = null;

  try {
    const signerBal = await connection.getBalance(signerKeypair.publicKey).catch(() => 0);
    if (signerBal < 5000) {
      try {
        const sig = await connection.requestAirdrop(signerKeypair.publicKey, 0.05 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(sig, "confirmed");
      } catch {
        // If user airdrop is rate limited, fallback to master payer
        const masterBal = await connection.getBalance(masterKeypair.publicKey).catch(() => 0);
        if (masterBal < 5000) {
          try {
            const msig = await connection.requestAirdrop(masterKeypair.publicKey, 0.2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(msig, "confirmed");
          } catch (e: any) {
            console.warn("[Solana Devnet] Master fee payer airdrop warning:", e.message || e);
          }
        }
        feePayer = masterKeypair;
        additionalSigner = signerKeypair;
      }
    }

    const { blockhash } = await connection.getLatestBlockhash("confirmed");

    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: signerKeypair.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, "utf-8"),
    });

    const transaction = new Transaction({
      feePayer: feePayer.publicKey,
      recentBlockhash: blockhash,
    }).add(memoInstruction);

    const signers = additionalSigner ? [feePayer, additionalSigner] : [feePayer];

    const signature = await sendAndConfirmTransaction(connection, transaction, signers, {
      commitment: "confirmed",
    });

    let slot = 0;
    let blockTime: number | null = null;
    try {
      const txInfo = await connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (txInfo) {
        slot = txInfo.slot;
        blockTime = txInfo.blockTime;
      }
    } catch {
      // Secondary info lookup logging
    }

    return {
      signature,
      slot,
      blockTime,
      explorerUrl: getExplorerUrl(signature),
    };
  } catch (err: any) {
    console.error("[Solana Devnet Anchor Error]", err.message || err);
    throw err;
  }
}

/**
 * Creates a REAL Token-2022 Mint on Solana Devnet linked to Invoice Payload Hash
 */
export async function executeCustodialToken2022Mint(
  payerKeypair: Keypair,
  invoiceData: {
    invoiceNumber: string;
    faceValueInr: number;
    sellerName: string;
    buyerName: string;
    payloadHash?: string;
  }
): Promise<{
  mintAddress: string;
  signature: string;
  slot: number;
  blockTime: number | null;
  explorerUrl: string;
  mintExplorerUrl: string;
}> {
  const connection = getSolanaConnection();

  // Check Devnet SOL balance for rent exemption (82 bytes) & transaction fees
  const mintRent = await connection.getMinimumBalanceForRentExemption(82);
  const balance = await connection.getBalance(payerKeypair.publicKey);

  if (balance < mintRent + 10000) {
    try {
      const airdropSig = await connection.requestAirdrop(payerKeypair.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(airdropSig, "confirmed");
    } catch {
      if (balance < mintRent + 5000) {
        throw new Error(
          "Insufficient Devnet SOL in custodial wallet for Token-2022 transaction fees. Please request test SOL from faucet.solana.com or use the Wallet tab."
        );
      }
    }
  }

  const mintKeypair = Keypair.generate();
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  // Instruction 1: Create Account for Mint under Token-2022 Program
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: payerKeypair.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    space: 82,
    lamports: mintRent,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  // Instruction 2: InitializeMint (Decimals = 0)
  const initMintData = Buffer.alloc(36);
  initMintData.writeUInt8(0, 0); // 0 = InitializeMint
  initMintData.writeUInt8(0, 1); // 0 decimals
  initMintData.writeUInt8(1, 2); // Option::Some(mintAuthority)
  payerKeypair.publicKey.toBuffer().copy(initMintData, 3);
  initMintData.writeUInt8(0, 35); // Option::None(freezeAuthority)

  const initMintIx = new TransactionInstruction({
    keys: [
      { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: RENT_SYSVAR_ID, isSigner: false, isWritable: false },
    ],
    programId: TOKEN_2022_PROGRAM_ID,
    data: initMintData,
  });

  // Instruction 3: Memo Instruction with SHA-256 Invoice Payload Hash
  const hashStr =
    invoiceData.payloadHash ||
    crypto.createHash("sha256").update(JSON.stringify(invoiceData)).digest("hex");
  const memoText = `Credexa Token-2022 Mint | INV#${invoiceData.invoiceNumber} | INR:${invoiceData.faceValueInr} | Hash:${hashStr.slice(0, 16)}`;

  const memoIx = new TransactionInstruction({
    keys: [{ pubkey: payerKeypair.publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoText, "utf-8"),
  });

  const transaction = new Transaction({
    feePayer: payerKeypair.publicKey,
    recentBlockhash: blockhash,
  }).add(createAccountIx, initMintIx, memoIx);

  // Send & Confirm Transaction on Solana Devnet
  const signature = await sendAndConfirmTransaction(connection, transaction, [payerKeypair, mintKeypair], {
    commitment: "confirmed",
  });

  // Verify transaction with getTransaction()
  let slot = 0;
  let blockTime: number | null = null;
  const txInfo = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  }).catch(() => null);

  if (txInfo) {
    slot = txInfo.slot;
    blockTime = txInfo.blockTime;
  }

  const mintAddress = mintKeypair.publicKey.toBase58();

  return {
    mintAddress,
    signature,
    slot,
    blockTime,
    explorerUrl: getExplorerUrl(signature),
    mintExplorerUrl: getMintExplorerUrl(mintAddress),
  };
}

/**
 * Validates a Base58 transaction signature format and verifies its on-chain status on Devnet RPC
 */
export async function verifyOnChainTransaction(signature: string): Promise<{
  verified: boolean;
  status: "VERIFIED" | "FAILED" | "PENDING";
  slot?: number;
  blockTime?: number;
  explorerUrl: string;
  error?: string;
}> {
  const explorerUrl = getExplorerUrl(signature);

  // Base58 regex format check for Solana transaction signature (80 to 90 characters)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;
  if (!signature || !base58Regex.test(signature)) {
    return {
      verified: false,
      status: "FAILED",
      explorerUrl,
      error: "Invalid Base58 Solana transaction signature format",
    };
  }

  try {
    const connection = getSolanaConnection();
    const txInfo = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    }).catch(() => null);

    if (!txInfo) {
      return {
        verified: false,
        status: "FAILED",
        explorerUrl,
        error: "Transaction not confirmed or not found on Solana Devnet ledger",
      };
    }

    if (txInfo.meta && txInfo.meta.err) {
      return {
        verified: false,
        status: "FAILED",
        slot: txInfo.slot,
        blockTime: txInfo.blockTime || undefined,
        explorerUrl,
        error: `Transaction execution failed: ${JSON.stringify(txInfo.meta.err)}`,
      };
    }

    return {
      verified: true,
      status: "VERIFIED",
      slot: txInfo.slot,
      blockTime: txInfo.blockTime || undefined,
      explorerUrl,
    };
  } catch (err: any) {
    return {
      verified: false,
      status: "FAILED",
      explorerUrl,
      error: `RPC verification query failed: ${err.message || err}`,
    };
  }
}
