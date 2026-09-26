import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { SignUpPage } from "./components/SignUpPage";
import { SignInPage } from "./components/SignInPage";
import { FinanceeDashboard } from "./components/FinanceeDashboard";
import { FinancerDashboard } from "./components/FinancerDashboard";
import { UserProfileView } from "./components/UserProfileView";
import { TransactionHistoryView } from "./components/TransactionHistoryView";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { OverviewView } from "./components/OverviewView";
import { InvoiceExchangeView } from "./components/InvoiceExchangeView";
import { OracleInspectorView } from "./components/OracleInspectorView";
import { TrancheVaultsView } from "./components/TrancheVaultsView";
import { BuyerAttestationView } from "./components/BuyerAttestationView";
import { ComplianceWebhooksView } from "./components/ComplianceWebhooksView";
import { ContractSpecView } from "./components/ContractSpecView";
import { InvoiceFraudVisionView } from "./components/InvoiceFraudVisionView";
import { MSMEDashboardView } from "./components/MSMEDashboardView";
import { InvestorDashboardView } from "./components/InvestorDashboardView";
import { CustodialWalletView } from "./components/CustodialWalletView";
import { FractionalFinancingView } from "./components/FractionalFinancingView";
import { mockInvoices } from "./data/mockInvoices";
import { InvoiceRecord, OracleAuditResult, User, Role } from "./types";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { safeFetch, apiLogin } from "./services/apiClient";

interface ToastNotification {
  id: string;
  type: "success" | "info" | "warning";
  title: string;
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("credexa_jwt_token"));
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [insuranceReserveBalance, setInsuranceReserveBalance] = useState<number>(14850000);
  const [selectedFraudInvoice, setSelectedFraudInvoice] = useState<InvoiceRecord | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [oracleStatus, setOracleStatus] = useState({
    status: "operational",
    protocol: "Credexa Solana Credit Oracle",
    hasGeminiKey: false,
    oraclePubKey: "CRDx0rac1eEd25519PubKey...SPL2022",
  });

  const fetchInvoices = () => {
    safeFetch("/api/invoices")
      .then((res) => {
        if (res.ok && res.data.invoices && Array.isArray(res.data.invoices)) {
          setInvoices(res.data.invoices);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch invoices:", err);
      });
  };

  // Restore User Session on mount
  useEffect(() => {
    setIsAuthLoading(true);
    if (token) {
      safeFetch("/api/auth/me")
        .then((res) => {
          if (res.ok && res.data.user) {
            setUser(res.data.user);
            if (activeTab === "landing") {
              if (res.data.user.role === "FINANCEE") setActiveTab("financee");
              else if (res.data.user.role === "FINANCER") setActiveTab("financer");
              else setActiveTab("overview");
            }
          } else {
            localStorage.removeItem("credexa_jwt_token");
            setToken(null);
            setUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("credexa_jwt_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsAuthLoading(false);
          fetchInvoices();
        });
    } else {
      setIsAuthLoading(false);
      fetchInvoices();
    }

    safeFetch("/api/oracle/status")
      .then((res) => {
        if (res.ok) {
          setOracleStatus({
            status: res.data.status || "operational",
            protocol: res.data.protocol || "Credexa Solana Credit Oracle",
            hasGeminiKey: !!res.data.hasGeminiKey,
            oraclePubKey: res.data.oraclePubKey || "CRDx0rac1eEd25519PubKey...SPL2022",
          });
        }
      })
      .catch((err) => console.warn("Could not fetch oracle status:", err));
  }, [token]);

  // Auto-redirect authenticated user away from public landing page to role dashboard
  useEffect(() => {
    if (!isAuthLoading && user && activeTab === "landing") {
      if (user.role === "FINANCEE") {
        setActiveTab("financee");
      } else if (user.role === "FINANCER") {
        setActiveTab("financer");
      } else {
        setActiveTab("overview");
      }
    }
  }, [user, isAuthLoading, activeTab]);

  const addToast = (type: "success" | "info" | "warning", title: string, message: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAuthSuccess = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem("credexa_jwt_token", authToken);
    addToast("success", "AUTHENTICATED", `Signed in as ${authUser.name} (${authUser.role})`);

    if (authUser.role === "FINANCEE") {
      setActiveTab("financee");
    } else if (authUser.role === "FINANCER") {
      setActiveTab("financer");
    } else {
      setActiveTab("overview");
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("credexa_jwt_token");
    setActiveTab("landing");
    addToast("info", "SIGNED OUT", "Logged out of Credexa session.");
  };

  const handleQuickLogin = async (role: "FINANCEE" | "FINANCER") => {
    const demoEmail = role === "FINANCEE" ? "demo.financee@credexa.io" : "demo.financer@credexa.io";
    try {
      const { user, token } = await apiLogin(demoEmail, "password123");
      handleAuthSuccess(user, token);
    } catch (err: any) {
      console.warn("Quick login error:", err);
      addToast("warning", "AUTH FAILURE", err.message || "Quick login failed");
    }
  };

  const handleLoadDemoData = () => {
    safeFetch("/api/demo/load", { method: "POST" })
      .then((res) => {
        if (res.ok && res.data.invoices) setInvoices(res.data.invoices);
        addToast("success", "DEMO DATA LOADED", "Loaded sample Indian MSME invoice bundles with verified Ed25519 signatures.");
      })
      .catch((err) => console.warn("Load demo error:", err));
  };

  const handleResetDemoData = () => {
    safeFetch("/api/demo/reset", { method: "POST" })
      .then((res) => {
        if (res.ok && res.data.invoices) setInvoices(res.data.invoices);
        addToast("info", "DEMO STATE RESET", "Reset demo invoices and audit logs to initial seed state.");
      })
      .catch((err) => console.warn("Reset demo error:", err));
  };

  const handleTokenize = async (newInv: Partial<InvoiceRecord>) => {
    try {
      const res = await safeFetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify(newInv),
      });
      if (res.ok && res.data.invoice) {
        setInvoices((prev) => [res.data.invoice, ...prev]);
        addToast(
          "success",
          "INVOICE TOKENIZED // PRISMA DB",
          `Created SPL Token-2022 digital asset for ${res.data.invoice.sellerName} (₹${Number(res.data.invoice.faceValueInr).toLocaleString("en-IN")})`
        );
      }
    } catch (e) {
      fetchInvoices();
    }
  };

  const handleAuditInvoice = (invoiceId: string) => {
    setActiveTab("oracle");
  };

  const handleAttestInvoice = async (invoiceId: string) => {
    try {
      const res = await safeFetch(`/api/invoices/${invoiceId}/oracle-attestation`, { method: "POST" });
      if (res.ok && res.data.success) {
        addToast("success", "ORACLE ATTESTATION SIGNED", `Signed Ed25519 payload for invoice ${invoiceId}`);
        fetchInvoices();
      }
    } catch (e) {
      console.warn("Attestation error:", e);
    }
  };

  const handleFundTranche = async (invoiceId: string, tranche: "Senior" | "Junior", amountInr: number, solanaTxSig: string) => {
    try {
      const res = await safeFetch(`/api/invoices/${invoiceId}/fund`, {
        method: "POST",
        body: JSON.stringify({
          tranche,
          amountInr,
          solanaTxSignature: solanaTxSig,
          status: "FUNDED",
        }),
      });
      if (res.ok && res.data.success) {
        addToast(
          "success",
          "TRANCHE FUNDED // SOLANA DEVNET",
          `Deposited ₹${amountInr.toLocaleString("en-IN")} into ${tranche} Tranche Vault. Signature: ${solanaTxSig.slice(0, 16)}...`
        );
        fetchInvoices();
      }
    } catch (e) {
      console.warn("Funding error:", e);
    }
  };

  const handleSimulateRepayment = async (invoiceId: string) => {
    try {
      const res = await safeFetch(`/api/invoices/${invoiceId}/repay`, {
        method: "POST",
      });
      if (res.ok && res.data.success) {
        addToast(
          "success",
          "REPAYMENT SETTLED",
          `Invoice ${invoiceId} settled in full via automated yield payout waterfall.`
        );
        fetchInvoices();
      }
    } catch (e) {
      console.warn("Repayment error:", e);
    }
  };

  const handleAuditComplete = (invoiceId: string, result: OracleAuditResult) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: "Verified",
            authenticityScore: result.audit.authenticity_score,
            riskTier: result.audit.default_risk_tier,
            discountRateBps: result.audit.recommended_discount_rate_bps,
            oracleSignature: result.oracleSignature,
          };
        }
        return inv;
      })
    );

    addToast(
      "success",
      "GEMINI ORACLE VERIFICATION COMPLETED",
      `Invoice ${invoiceId} verified! Score: ${result.audit.authenticity_score}/100, Tier: ${result.audit.default_risk_tier}`
    );
  };

  const handleNavigate = (route: string) => {
    if (route === "/") {
      if (user) {
        if (user.role === "FINANCEE") setActiveTab("financee");
        else if (user.role === "FINANCER") setActiveTab("financer");
        else setActiveTab("overview");
      } else {
        setActiveTab("landing");
      }
    }
    else if (route === "/signup") setActiveTab("signup");
    else if (route === "/signin") setActiveTab("signin");
    else if (route === "/financee") setActiveTab("financee");
    else if (route === "/financer") setActiveTab("financer");
    else if (route === "/profile") setActiveTab("profile");
    else if (route === "/txs") setActiveTab("txs");
    else if (route === "/exchange") setActiveTab("exchange");
    else if (route === "/vision") setActiveTab("vision");
    else if (route === "/oracle") setActiveTab("oracle");
    else if (route === "/tranches") setActiveTab("tranches");
    else if (route === "/wallet") setActiveTab("wallet");
    else if (route === "/fractional") setActiveTab("fractional");
    else setActiveTab(route);
  };

  const handleRedirectToSignIn = () => {
    setActiveTab("signin");
  };

  const handleRedirectToDashboard = (userRole: Role) => {
    if (userRole === "FINANCEE") setActiveTab("financee");
    else if (userRole === "FINANCER") setActiveTab("financer");
    else setActiveTab("overview");
  };

  if (isAuthLoading && token) {
    return (
      <div className="min-h-screen bg-white text-[#111111] flex flex-col items-center justify-center p-6 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#2563EB] rounded-full animate-spin mb-4" />
        <div className="font-bold text-[#111111] tracking-wider uppercase">Authenticating Credexa Session...</div>
        <div className="text-[#888888] mt-1 text-[11px]">Verifying cryptographic session signature</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Swiss Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        oracleStatus={oracleStatus}
        user={user}
        onSignOut={handleSignOut}
        onNavigate={handleNavigate}
        onLoadDemoData={handleLoadDemoData}
        onResetDemoData={handleResetDemoData}
      />

      {/* Main View Router with Protected Route Auth Guards */}
      <main className="flex-1 w-full">
        {/* PUBLIC UNAUTHENTICATED ROUTES */}
        {activeTab === "landing" && (
          <LandingPage onNavigate={handleNavigate} onQuickLogin={handleQuickLogin} />
        )}

        {activeTab === "signup" && (
          <SignUpPage
            onRegisterSuccess={handleAuthSuccess}
            onNavigateToSignIn={() => setActiveTab("signin")}
          />
        )}

        {activeTab === "signin" && (
          <SignInPage
            onSignInSuccess={handleAuthSuccess}
            onNavigateToSignUp={() => setActiveTab("signup")}
          />
        )}

        {/* PROTECTED AUTHENTICATED ROUTES */}
        {activeTab === "financee" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            requiredRole="FINANCEE"
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            {user && (
              <FinanceeDashboard
                user={user}
                invoices={invoices}
                onAuditInvoice={(id) => handleAuditInvoice(id)}
                onAttestInvoice={(id) => handleAttestInvoice(id)}
                onAnchorSolana={(id) => handleAttestInvoice(id)}
                onSimulateRepayment={(id) => handleSimulateRepayment(id)}
                onCreateInvoice={(newInv) => handleTokenize(newInv)}
                onOpenFraudVision={(inv) => {
                  setSelectedFraudInvoice(inv);
                  setActiveTab("vision");
                }}
              />
            )}
          </ProtectedRoute>
        )}

        {activeTab === "financer" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            requiredRole="FINANCER"
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            {user && (
              <FinancerDashboard
                user={user}
                invoices={invoices}
                onFundTranche={(id, tranche, amt, sig) => handleFundTranche(id, tranche, amt, sig)}
                onSimulateRepayment={(id) => handleSimulateRepayment(id)}
                onOpenFraudVision={(inv) => {
                  setSelectedFraudInvoice(inv);
                  setActiveTab("vision");
                }}
              />
            )}
          </ProtectedRoute>
        )}

        {activeTab === "profile" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            {user && <UserProfileView user={user} onUpdateUser={(updated) => setUser(updated)} />}
          </ProtectedRoute>
        )}

        {activeTab === "txs" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <TransactionHistoryView />
          </ProtectedRoute>
        )}

        {activeTab === "wallet" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <CustodialWalletView />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "fractional" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <FractionalFinancingView onNavigateTab={setActiveTab} />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "exchange" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <InvoiceExchangeView
                invoices={invoices}
                onTokenize={handleTokenize}
                onAuditInvoice={(inv) => handleAuditInvoice(inv.id)}
                onFundInvoice={(inv) => handleFundTranche(inv.id, "Senior", Math.round(inv.faceValueInr * 0.8), "devnet_tx")}
                onBuyerAttest={(inv) => handleAttestInvoice(inv.id)}
                onSettleInvoice={(inv) => handleSimulateRepayment(inv.id)}
                onTriggerDefault={() => {}}
              />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "vision" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <InvoiceFraudVisionView
                onNavigateTab={setActiveTab}
                onProceedToFinancing={(invData) => {
                  handleTokenize({
                    invoiceNumber: invData.invoiceNumber,
                    faceValueInr: invData.faceValueInr,
                    sellerName: invData.sellerName,
                    sellerGstin: invData.sellerGstin,
                    buyerName: invData.buyerName,
                    buyerGstin: invData.buyerGstin,
                    ewayBillNumber: invData.ewayBillNumber,
                    poNumber: invData.poNumber,
                  });
                }}
              />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "oracle" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <OracleInspectorView
                invoices={invoices}
                onAuditComplete={handleAuditComplete}
              />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "tranches" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <TrancheVaultsView />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "buyer" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <BuyerAttestationView
                invoices={invoices}
                onAttestInvoice={(inv) => handleAttestInvoice(inv.id)}
                onSettleWithRebate={(inv) => handleSimulateRepayment(inv.id)}
              />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "compliance" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <ComplianceWebhooksView invoices={invoices} />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "contracts" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <ContractSpecView />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "overview" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <OverviewView invoices={invoices} onNavigate={setActiveTab} />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "msme" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <MSMEDashboardView
                invoices={invoices}
                onRefreshData={fetchInvoices}
                onNavigateTab={setActiveTab}
              />
            </div>
          </ProtectedRoute>
        )}

        {activeTab === "investor" && (
          <ProtectedRoute
            user={user}
            isLoading={isAuthLoading}
            onRedirectToSignIn={handleRedirectToSignIn}
            onRedirectToDashboard={handleRedirectToDashboard}
          >
            <div className="app-container py-6 sm:py-8">
              <InvestorDashboardView
                invoices={invoices}
                onRefreshData={fetchInvoices}
                onNavigateTab={setActiveTab}
              />
            </div>
          </ProtectedRoute>
        )}
      </main>

      {/* Swiss Footer */}
      <footer className="border-t border-[#E5E5E5] bg-[#FAFAFA] py-6 font-mono text-xs text-[#666666]">
        <div className="app-container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#111111]">CREDEXA // PROTOCOL V2.0</span>
            <span>•</span>
            <span>PRISMA DB &amp; SQLITE</span>
            <span>•</span>
            <span>SOLANA DEVNET</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>ORACLE PUBKEY: {oracleStatus.oraclePubKey.slice(0, 10)}...</span>
            <span className="text-[#16A34A] font-medium">SESSION AUTH PROTECTED</span>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-md w-full font-mono text-xs pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-[6px] p-4 shadow-lg transition-all flex items-start justify-between gap-3 ${
              toast.type === "success"
                ? "bg-[#111111] text-white border-[#16A34A]"
                : toast.type === "warning"
                ? "bg-[#111111] text-white border-[#E53935]"
                : "bg-[#111111] text-white border-[#2563EB]"
            }`}
          >
            <div className="space-y-1">
              <div className="font-bold tracking-wider flex items-center gap-1.5 text-[11px]">
                {toast.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />}
                {toast.type === "warning" && <AlertCircle className="w-3.5 h-3.5 text-[#E53935]" />}
                {toast.type === "info" && <Info className="w-3.5 h-3.5 text-[#2563EB]" />}
                <span>{toast.title}</span>
              </div>
              <div className="text-[11px] text-[#D4D4D8] font-sans leading-relaxed">{toast.message}</div>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-[#888888] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
