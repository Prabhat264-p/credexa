import nacl from "tweetnacl";

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/i, "").trim();
  const bytes = new Uint8Array(Math.floor(cleanHex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface Ed25519VerificationResult {
  verified: boolean;
  message: string;
  payloadHash: string;
  signatureLength: number;
  publicKeyLength: number;
}

/**
 * Client-Side Independent Ed25519 Signature Verification
 * Evaluates digital signature against canonical JSON payload & Oracle Ed25519 Public Key in the browser.
 */
export async function verifyOracleEd25519Signature(
  canonicalPayload: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<Ed25519VerificationResult> {
  try {
    const msgBytes = new TextEncoder().encode(canonicalPayload);
    const sigBytes = hexToBytes(signatureHex);
    const pubKeyBytes = hexToBytes(publicKeyHex);

    // Generate SHA-256 Hash of canonical payload for display & integrity verification
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBytes);
    const payloadHash = bytesToHex(new Uint8Array(hashBuffer));

    if (sigBytes.length !== 64) {
      return {
        verified: false,
        message: `Signature length invalid (${sigBytes.length} bytes, expected 64 bytes for Ed25519).`,
        payloadHash,
        signatureLength: sigBytes.length,
        publicKeyLength: pubKeyBytes.length,
      };
    }

    if (pubKeyBytes.length !== 32) {
      return {
        verified: false,
        message: `Public key length invalid (${pubKeyBytes.length} bytes, expected 32 bytes for Ed25519).`,
        payloadHash,
        signatureLength: sigBytes.length,
        publicKeyLength: pubKeyBytes.length,
      };
    }

    const isValid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);

    return {
      verified: isValid,
      message: isValid
        ? "✓ Ed25519 cryptographic signature independently verified in browser!"
        : "❌ Signature verification failed: Signature does not match public key and payload.",
      payloadHash,
      signatureLength: sigBytes.length,
      publicKeyLength: pubKeyBytes.length,
    };
  } catch (err: any) {
    return {
      verified: false,
      message: "Verification error: " + (err?.message || "Invalid signature formats"),
      payloadHash: "",
      signatureLength: 0,
      publicKeyLength: 0,
    };
  }
}
