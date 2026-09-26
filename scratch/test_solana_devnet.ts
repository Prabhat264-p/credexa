import { Keypair } from "@solana/web3.js";
import { executeCustodialDevnetAnchor, verifyOnChainTransaction, getCustodialBalanceSol, requestCustodialAirdrop } from "../src/services/solanaService";

async function testSolanaDevnet() {
  console.log("==========================================");
  console.log("CREDEXA — REAL SOLANA DEVNET TEST");
  console.log("==========================================\n");

  const testKeypair = Keypair.generate();
  const address = testKeypair.publicKey.toBase58();
  console.log("1. Generated Keypair Public Address:", address);

  console.log("2. Requesting 0.1 SOL Devnet Airdrop...");
  let successAirdrop = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`   Attempt ${attempt} to request 0.1 SOL airdrop...`);
      const airdropSig = await requestCustodialAirdrop(address, 0.1);
      console.log("   ✅ Airdrop Signature:", airdropSig);
      successAirdrop = true;
      break;
    } catch (err: any) {
      console.warn(`   ⚠️ Attempt ${attempt} warning:`, err.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const balance = await getCustodialBalanceSol(address);
  console.log("3. Devnet SOL Balance:", balance, "SOL");

  if (balance > 0) {
    console.log("4. Executing REAL Solana Devnet Anchor Transaction...");
    const memoText = `Credexa Real Devnet Test | Timestamp:${Date.now()}`;
    const txResult = await executeCustodialDevnetAnchor(testKeypair, memoText);
    console.log("   ✅ REAL Transaction Signature:", txResult.signature);
    console.log("   ✅ Slot:", txResult.slot);
    console.log("   ✅ Explorer URL:", txResult.explorerUrl);

    console.log("\n5. Verifying Transaction On-Chain via Devnet RPC...");
    const verification = await verifyOnChainTransaction(txResult.signature);
    console.log("   ✅ On-Chain Verification Status:", verification.status);
    console.log("   ✅ Verified:", verification.verified);
  } else {
    console.log("   ⚠️ Balance is 0 SOL.");
  }
}

testSolanaDevnet().catch(console.error);
