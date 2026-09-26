import React, { useState } from 'react';
import { ArrowRight, Lock, CheckCircle2, ShieldCheck, Cpu, Database, Wallet, FileText, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: string) => void;
  onQuickLogin: (role: 'FINANCEE' | 'FINANCER') => Promise<void>;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onQuickLogin }) => {
  const [loadingRole, setLoadingRole] = useState<'FINANCEE' | 'FINANCER' | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleDemoClick = async (role: 'FINANCEE' | 'FINANCER') => {
    if (loadingRole) return;
    setDemoError(null);
    setLoadingRole(role);
    try {
      await onQuickLogin(role);
    } catch (err: any) {
      setDemoError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#2563EB] selection:text-white">
      {/* SECTION 1: HERO */}
      <section className="relative border-b border-[#E5E5E5] py-12 sm:py-16 app-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-xs font-mono text-[#555555]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span>CREDEXA PROTOCOL V2.0 • SOLANA DEVNET & PRISMA DB</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#111111] leading-[1.05]">
              VERIFIED INVOICES.<br />
              <span className="text-[#2563EB]">TRANSPARENT</span> FINANCING.
            </h1>

            <p className="text-lg sm:text-xl text-[#555555] max-w-2xl font-normal leading-relaxed">
              AI-powered invoice intelligence, cryptographic verification, and transparent blockchain anchoring for MSME financing.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => onNavigate('/signup')}
                className="px-8 py-3.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/signin')}
                className="px-8 py-3.5 rounded-[6px] bg-white border border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#111111] font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#2563EB]" />
                <span>Sign In</span>
              </button>
            </div>

            {/* Quick Hackathon Demo Logins */}
            <div className="pt-6 border-t border-[#E5E5E5] max-w-xl">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#888888] mb-2 flex items-center justify-between">
                <span>Hackathon Demo Quick Access:</span>
                {loadingRole && (
                  <span className="text-[#2563EB] font-bold flex items-center gap-1 text-[10px]">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Authenticating...
                  </span>
                )}
              </div>

              {demoError && (
                <div className="mb-3 p-2 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[4px] text-[11px] font-mono text-[#E53935] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{demoError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoClick('FINANCEE')}
                  disabled={loadingRole !== null}
                  className={`p-3 text-left rounded-[6px] border transition-all cursor-pointer flex items-center gap-3 w-full font-mono ${
                    loadingRole === 'FINANCEE'
                      ? 'bg-[#EFF6FF] border-[#2563EB] opacity-90'
                      : 'bg-[#FAFAFA] border-[#E5E5E5] hover:border-[#2563EB] hover:bg-[#F5F5F5]'
                  } ${loadingRole !== null ? 'cursor-not-allowed' : ''}`}
                  aria-label="Log in as Demo MSME Borrower"
                >
                  {loadingRole === 'FINANCEE' ? (
                    <RefreshCw className="w-4 h-4 text-[#2563EB] shrink-0 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                  )}
                  <div className="w-full">
                    <div className="text-xs font-mono font-bold text-[#111111] flex items-center justify-between">
                      <span>MSME Borrower</span>
                      {loadingRole === 'FINANCEE' && (
                        <span className="text-[9px] text-[#2563EB] font-mono font-normal">Signing in...</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-[#888888]">demo.financee@credexa.io</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoClick('FINANCER')}
                  disabled={loadingRole !== null}
                  className={`p-3 text-left rounded-[6px] border transition-all cursor-pointer flex items-center gap-3 w-full font-mono ${
                    loadingRole === 'FINANCER'
                      ? 'bg-[#F0FDF4] border-[#16A34A] opacity-90'
                      : 'bg-[#FAFAFA] border-[#E5E5E5] hover:border-[#16A34A] hover:bg-[#F5F5F5]'
                  } ${loadingRole !== null ? 'cursor-not-allowed' : ''}`}
                  aria-label="Log in as Demo Liquidity Financer"
                >
                  {loadingRole === 'FINANCER' ? (
                    <RefreshCw className="w-4 h-4 text-[#16A34A] shrink-0 animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4 text-[#16A34A] shrink-0" />
                  )}
                  <div className="w-full">
                    <div className="text-xs font-mono font-bold text-[#111111] flex items-center justify-between">
                      <span>Liquidity Financer</span>
                      {loadingRole === 'FINANCER' && (
                        <span className="text-[9px] text-[#16A34A] font-mono font-normal">Signing in...</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-[#888888]">demo.financer@credexa.io</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Matrix */}
          <div className="lg:col-span-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[8px] p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <span className="font-bold text-[#111111]">PROTOCOL SPEC</span>
              <span className="text-[10px] font-bold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] px-1.5 py-0.5 rounded-[2px]">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2 text-[#555555]">
              <div className="flex justify-between">
                <span>Credit Oracle:</span>
                <span className="text-[#111111] font-bold">Ed25519 Signed</span>
              </div>
              <div className="flex justify-between">
                <span>AI Vision Engine:</span>
                <span className="text-[#2563EB] font-bold">Gemini 2.5 Flash</span>
              </div>
              <div className="flex justify-between">
                <span>Settlement Asset:</span>
                <span className="text-[#111111] font-bold">SPL eINR (1:1)</span>
              </div>
              <div className="flex justify-between">
                <span>Ledger Network:</span>
                <span className="text-[#111111] font-bold">Solana Devnet</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#E5E5E5] rounded-[4px] space-y-1">
              <div className="text-[10px] text-[#888888] uppercase">Canonical Hash Sample</div>
              <div className="text-[10px] text-[#2563EB] font-mono truncate">
                4c7a8b9e1f2d3c4b5a6e7f8a9b0c1d2e3f4a5b6c
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS (TIMELINE) */}
      <section className="py-20 app-container border-b border-[#E5E5E5]">
        <div className="mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#2563EB]">Protocol Architecture</span>
          <h2 className="text-3xl font-extrabold text-[#111111] mt-1">HOW IT WORKS</h2>
        </div>

        {/* Horizontal Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'INVOICE', desc: 'MSME submits invoice image/PDF & purchase order details.' },
            { step: '02', title: 'AI AUDIT', desc: 'Gemini Vision checks forgery, math consistency & tax GSTIN.' },
            { step: '03', title: 'ORACLE', desc: 'Credexa Oracle signs Ed25519 cryptographic payload.' },
            { step: '04', title: 'SOLANA', desc: 'Permanent anchor transaction confirmed on Solana Devnet.' },
            { step: '05', title: 'FINANCING', desc: 'Liquidity vaults fund Senior (80%) & Junior (20%) tranches.' },
          ].map((item, idx) => (
            <div key={idx} className="p-5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[6px] space-y-3">
              <div className="text-xs font-mono font-bold text-[#2563EB]">{item.step}</div>
              <div className="text-sm font-bold font-mono text-[#111111]">{item.title}</div>
              <p className="text-xs text-[#555555] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: WHY CREDEXA */}
      <section className="py-20 app-container border-b border-[#E5E5E5]">
        <div className="mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#2563EB]">Core Pillars</span>
          <h2 className="text-3xl font-extrabold text-[#111111] mt-1">WHY CREDEXA</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-3">
            <Cpu className="w-6 h-6 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#111111]">AI Intelligence</h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              Automated multimodal OCR, mathematical validation, and fraud risk analysis powered by Gemini 2.5 Flash.
            </p>
          </div>

          <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#16A34A]" />
            <h3 className="text-base font-bold text-[#111111]">Cryptographic Trust</h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              Deterministic Ed25519 credit oracle signatures guaranteeing canonical invoice payload integrity.
            </p>
          </div>

          <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-3">
            <Database className="w-6 h-6 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#111111]">Blockchain Transparency</h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              Immutable ledger anchoring on Solana Devnet preventing double-discounting and double-factoring.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 & 5: FOR FINANCEES & FOR FINANCERS */}
      <section className="py-20 app-container border-b border-[#E5E5E5]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Financees */}
          <div className="p-8 border border-[#E5E5E5] rounded-[8px] bg-[#FAFAFA] space-y-4">
            <div className="text-xs font-mono uppercase font-bold text-[#2563EB]">FOR MSME BORROWERS</div>
            <h3 className="text-2xl font-bold text-[#111111]">FOR FINANCEES</h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              Unlock instant working capital trapped in 30-120 day enterprise invoices.
            </p>
            <ul className="space-y-2 text-xs font-mono text-[#333333]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Submit invoices & receive instant credit evaluation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Understand AI fraud risk scores & underwriting metrics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Track eINR liquidity disbursement & repayment state</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="mt-4 px-6 py-2.5 rounded-[6px] bg-[#111111] hover:bg-[#333333] text-white font-semibold text-xs cursor-pointer"
            >
              Get Started as Financee
            </button>
          </div>

          {/* Financers */}
          <div className="p-8 border border-[#E5E5E5] rounded-[8px] bg-[#FAFAFA] space-y-4">
            <div className="text-xs font-mono uppercase font-bold text-[#16A34A]">FOR LIQUIDITY PROVIDERS</div>
            <h3 className="text-2xl font-bold text-[#111111]">FOR FINANCERS</h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              Deploy capital into institutional-grade Indian B2B invoice tranches with first-loss protection.
            </p>
            <ul className="space-y-2 text-xs font-mono text-[#333333]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Discover verified opportunities filtered by Risk Tier</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Review Gemini scorecards & Ed25519 attestations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Select Senior (80%) vs Junior (20%) risk tranches</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="mt-4 px-6 py-2.5 rounded-[6px] bg-[#111111] hover:bg-[#333333] text-white font-semibold text-xs cursor-pointer"
            >
              Get Started as Financer
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6: TRANSPARENCY */}
      <section className="py-20 app-container border-b border-[#E5E5E5]">
        <div className="mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#2563EB]">Verification Standards</span>
          <h2 className="text-3xl font-extrabold text-[#111111] mt-1">TRANSPARENCY</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-2 font-mono">
            <span className="px-2.5 py-1 text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-[4px] inline-block mb-2">
              AI AUDITED
            </span>
            <div className="text-sm font-bold text-[#111111]">Multimodal Scorecard</div>
            <p className="text-xs text-[#555555]">Gemini AI visual OCR, subtotal tax math & GSTIN checks.</p>
          </div>

          <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-2 font-mono">
            <span className="px-2.5 py-1 text-xs font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded-[4px] inline-block mb-2">
              ORACLE VERIFIED
            </span>
            <div className="text-sm font-bold text-[#111111]">Ed25519 Cryptography</div>
            <p className="text-xs text-[#555555]">Signed canonical underwriting payload hash.</p>
          </div>

          <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-2 font-mono">
            <span className="px-2.5 py-1 text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-[4px] inline-block mb-2">
              SOLANA ANCHORED
            </span>
            <div className="text-sm font-bold text-[#111111]">Devnet Permanence</div>
            <p className="text-xs text-[#555555]">On-chain memo hash preventing double-factoring.</p>
          </div>
        </div>
      </section>

      {/* SECTION 7: DEMO DISCLAIMER */}
      <section className="py-12 app-container border-b border-[#E5E5E5]">
        <div className="p-5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[6px] flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="text-xs text-[#555555] space-y-1">
            <span className="font-bold text-[#111111] uppercase font-mono block">DEMO DISCLAIMER & PROTOTYPE NOTICE</span>
            <p>
              Credexa is a hackathon prototype for decentralized invoice discounting. All financing and repayment amounts operate as application-level eINR simulations. No real fiat money is transferred. Solana operations are executed strictly on <strong className="text-[#111111]">Solana Devnet</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8: FINAL CTA */}
      <section className="py-20 app-container text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-[#111111]">Ready to explore Credexa?</h2>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('/signup')}
            className="px-8 py-3.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/signin')}
            className="px-8 py-3.5 rounded-[6px] bg-white border border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#111111] font-semibold text-sm transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] bg-[#FAFAFA] py-8 px-6 text-center text-xs font-mono text-[#888888]">
        <p>CREDEXA PROTOCOL V2.0 • BUILT WITH PRISMA, SOLANA DEVNET & GEMINI AI</p>
      </footer>
    </div>
  );
};
