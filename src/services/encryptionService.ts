import crypto from "crypto";
import { Keypair } from "@solana/web3.js";

const ALGORITHM = "aes-256-gcm";

function getSecretKey(): Buffer {
  const envKey = process.env.WALLET_ENCRYPTION_KEY || "credexa-custodial-wallet-secret-32b!";
  return crypto.createHash("sha256").update(envKey).digest();
}

/**
 * Encrypts a Solana Keypair secret key (64-byte Uint8Array) into a secure hex string (iv:tag:ciphertext)
 */
export function encryptPrivateKey(secretKey: Uint8Array): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const buffer = Buffer.from(secretKey);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts an encrypted hex string back into a Solana Keypair object
 */
export function decryptPrivateKey(encryptedString: string): Keypair {
  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format");
  }

  const [ivHex, authTagHex, cipherTextHex] = parts;
  const key = getSecretKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const cipherText = Buffer.from(cipherTextHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return Keypair.fromSecretKey(new Uint8Array(decrypted));
}
