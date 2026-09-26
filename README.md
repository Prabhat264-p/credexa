<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Credexa // Decentralized MSME Supply Chain Finance on Solana

Credexa is a full-stack decentralized MSME invoice discounting and supply-chain financing platform built with **Prisma ORM & SQLite/PostgreSQL**, **JWT Authentication & bcrypt**, **Solana Devnet (Token-2022 + SPL eINR settlements)**, **Dual-Tranche Liquidity Vaults**, and a **Gemini-powered Credit Oracle & Fraud Vision AI**.

---

## 🏗️ Production System Architecture

* **Database & Relational Model:** Uses **Prisma ORM** with an instant zero-setup SQLite database (`file:./dev.db`) or production PostgreSQL (`DATABASE_URL`). Schema includes `User`, `Invoice`, `InvoiceDocument`, `AIAudit`, `OracleAttestation`, `FinancingOffer`, `Investment`, `SolanaTransaction`, `Repayment`, `AuditEvent`, and `Notification`.
* **User Authentication & Roles:** Secure `bcryptjs` password hashing, JWT bearer tokens, server-side role authorization middleware (`requireAuth`, `requireRole`). Roles: `FINANCEE` (MSME Borrower) and `FINANCER` (Liquidity Provider / Investor).
* **Solana Devnet Verification:** Server-side verification of transaction signatures against `https://api.devnet.solana.com` using `@solana/web3.js` before marking records `VERIFIED`.
* **Gemini 2.5 Flash Credit Oracle & Vision AI:** Multimodal credit score report generation, visual document forgery inspection, mathematical calculation checks, e-Way bill corroboration, and Ed25519 cryptographic oracle signatures.
* **Dual-Tranche Risk Architecture:** Senior Capital Vault (80% allocation, first-loss protection buffer) & Junior Yield Vault (20% allocation, high yield cushion).

---

## 🔍 Core Features

### 1. User Registration & Auth Portals
* Role selection (`MSME Borrower` vs `Liquidity Provider`).
* Password strength calculator (Weak/Medium/Strong).
* Quick 1-click Hackathon demo login shortcuts (`demo.financee@credexa.io` & `demo.financer@credexa.io`).

### 2. Financee Dashboard (MSME Borrower)
* Invoice creation & SPL Token-2022 tokenization.
* Trigger Gemini AI credit score evaluation.
* Sign Ed25519 Credit Oracle attestations.
* Anchor invoice hash permanently on Solana Devnet.
* Simulate buyer repayment with automated tranche yield payouts.

### 3. Financer Dashboard (Liquidity Provider)
* Browse available opportunities filtered by Risk Tier (`TIER_AAA` to `TIER_BBB`).
* Senior vs Junior tranche selector with target APR calculations.
* Connect Phantom wallet to execute real Solana Devnet transactions.
* Direct links to Solana Devnet Explorer for signature verification.

### 4. Invoice Fraud Vision AI
* Multimodal OCR & visual forensics for font inconsistencies, digital text overwriting, and tax calculation mismatches.
* Interactive "Ask Gemini Why?" explainability modal & contextual Q&A chat.

---

## 🚀 Quickstart

### 1. Install & Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Push database schema & seed initial users
npx prisma db push

# 3. Configure Gemini API Key (Optional for live Gemini Vision)
echo "GEMINI_API_KEY=your_key_here" > .env

# 4. Build & Run
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is in use) in your browser.

### 2. Quick Demo Credentials

* **MSME Borrower (Financee):**
  * Email: `demo.financee@credexa.io`
  * Password: `password123`
* **Liquidity Provider (Financer):**
  * Email: `demo.financer@credexa.io`
  * Password: `password123`

---

## ⚠️ Prototype Disclaimer

This application is an AI-assisted hackathon prototype. Solana transactions operate strictly on **Solana Devnet**. Financial disbursements and buyer repayments are application-level eINR simulations ("Demo Financing — No Real Money").