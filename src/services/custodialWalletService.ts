import { Keypair } from "@solana/web3.js";
import { prisma } from "./db";
import { encryptPrivateKey, decryptPrivateKey } from "./encryptionService";
import { getCustodialBalanceSol, requestCustodialAirdrop } from "./solanaService";

export interface CustodialWalletResponse {
  id: string;
  userId: string;
  publicAddress: string;
  network: string;
  balanceSol: number;
  status: string;
  createdAt: string;
}

/**
 * Retrieves existing custodial wallet for user or creates a new Solana Devnet keypair
 */
export async function getOrCreateCustodialWallet(userId: string): Promise<CustodialWalletResponse> {
  let wallet = await prisma.custodialWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    const keypair = Keypair.generate();
    const publicAddress = keypair.publicKey.toBase58();
    const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey);

    wallet = await prisma.custodialWallet.create({
      data: {
        userId,
        publicAddress,
        encryptedPrivateKey,
        network: "devnet",
        status: "ACTIVE",
      },
    });

    // Update user walletAddress if missing
    await prisma.user.update({
      where: { id: userId },
      data: { walletAddress: publicAddress },
    });

    // Request initial Devnet SOL airdrop for transaction fees
    try {
      await requestCustodialAirdrop(publicAddress, 0.5);
    } catch (airdropErr) {
      console.warn("[Custodial Wallet] Initial Devnet SOL airdrop warning:", airdropErr);
    }
  }

  const balanceSol = await getCustodialBalanceSol(wallet.publicAddress);

  return {
    id: wallet.id,
    userId: wallet.userId,
    publicAddress: wallet.publicAddress,
    network: wallet.network,
    balanceSol,
    status: wallet.status,
    createdAt: wallet.createdAt.toISOString(),
  };
}

/**
 * Decrypts and returns the Solana Keypair object for backend Devnet transaction signing
 * PRIVATE KEY IS NEVER EXPOSED TO FRONTEND
 */
export async function getCustodialKeypair(userId: string): Promise<Keypair> {
  const wallet = await prisma.custodialWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    // Automatically create wallet if missing
    await getOrCreateCustodialWallet(userId);
    const newWallet = await prisma.custodialWallet.findUniqueOrThrow({ where: { userId } });
    return decryptPrivateKey(newWallet.encryptedPrivateKey);
  }

  return decryptPrivateKey(wallet.encryptedPrivateKey);
}
