import React, { useState, useRef, useEffect } from "react";
import {
  ShieldCheck,
  Cpu,
  Lock,
  LogOut,
  User as UserIcon,
  Activity,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Settings
} from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  oracleStatus: {
    status: string;
    protocol: string;
    hasGeminiKey: boolean;
    oraclePubKey: string;
  };
  user: User | null;
  onSignOut: () => void;
  onNavigate: (route: string) => void;
  onLoadDemoData?: () => void;
  onResetDemoData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  oracleStatus,
  user,
  onSignOut,
  onNavigate,
  onLoadDemoData,
  onResetDemoData,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Complete Role-Based Navigation Links (ALL VISIBLE HORIZONTALLY ON DESKTOP)
  const getNavItems = () => {
    if (!user) {
      return [];
    }

    if (user.role === "FINANCEE") {
      return [
        { id: "financee", label: "Dashboard", route: "/financee" },
        { id: "fractional", label: "Invest Marketplace 💎", route: "/fractional" },
        { id: "exchange", label: "Invoices", route: "/exchange" },
        { id: "wallet", label: "Custodial Wallet ⚡", route: "/wallet" },
        { id: "vision", label: "Fraud Vision AI 🔍", route: "/vision" },
        { id: "txs", label: "Transactions", route: "/txs" },
      ];
    }

    if (user.role === "FINANCER") {
      return [
        { id: "financer", label: "Dashboard", route: "/financer" },
        { id: "fractional", label: "Invest in Invoices 💎", route: "/fractional" },
        { id: "investor", label: "My Portfolio 📈", route: "/investor" },
        { id: "exchange", label: "Opportunities", route: "/exchange" },
        { id: "wallet", label: "Custodial Wallet ⚡", route: "/wallet" },
        { id: "vision", label: "Fraud Vision AI 🔍", route: "/vision" },
        { id: "txs", label: "Transactions", route: "/txs" },
      ];
    }

    // General / Admin
    return [
      { id: "overview", label: "Overview", route: "/" },
      { id: "financee", label: "Financee", route: "/financee" },
      { id: "financer", label: "Financer", route: "/financer" },
      { id: "fractional", label: "Invest Marketplace 💎", route: "/fractional" },
      { id: "investor", label: "My Portfolio", route: "/investor" },
      { id: "exchange", label: "Invoices", route: "/exchange" },
      { id: "wallet", label: "Custodial Wallet ⚡", route: "/wallet" },
      { id: "vision", label: "Vision AI", route: "/vision" },
      { id: "txs", label: "Transactions", route: "/txs" },
    ];
  };

  const navItems = getNavItems();

  const handleNavClick = (route: string) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="w-full bg-white border-b border-[#E5E5E5] sticky top-0 z-40">
      {/* Micro Status Bar */}
      <div className="w-full border-b border-[#E5E5E5] bg-[#FAFAFA] px-4 py-1 flex items-center justify-between text-[11px] font-mono text-[#555555]">
        <div className="flex items-center gap-2 truncate">
          <span className="flex items-center gap-1.5 font-medium text-[#111111] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
            SOLANA DEVNET
          </span>
          <span className="hidden sm:inline text-[#D4D4D8]">|</span>
          <span className="hidden sm:inline truncate">eINR PEGGED SETTLEMENT</span>
          <span className="hidden md:inline text-[#D4D4D8]">|</span>
          <span className="hidden md:inline font-mono">ORACLE: {oracleStatus.oraclePubKey.slice(0, 10)}...</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded border ${
            oracleStatus.hasGeminiKey 
              ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]" 
              : "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]"
          }`}>
            <Cpu className="w-3 h-3" />
            <span className="hidden xs:inline">{oracleStatus.hasGeminiKey ? "GEMINI ACTIVE" : "GEMINI ENGINE"}</span>
          </span>
          <span className="text-[#888888] hidden md:inline">PRISMA DB</span>
        </div>
      </div>

      {/* Main Header Inner Container: 3 Regions (LOGO | NAVIGATION | ACCOUNT) */}
      <div className="w-full px-4 h-16 flex items-center justify-between min-w-0 box-border">
        {/* REGION 1: LOGO (flex: 0 0 auto) */}
        <div className="flex-none flex items-center gap-2 mr-3">
          <button 
            onClick={() => onNavigate('/')}
            className="flex items-baseline gap-1 text-left focus:outline-none"
          >
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#111111] font-mono">CRED<span className="text-[#2563EB]">Ex</span>A</span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-1 py-0.5 bg-[#111111] text-white rounded-[4px] ml-1 hidden lg:inline">
              PROT-V2
            </span>
          </button>
        </div>

        {/* REGION 2: NAVIGATION (flex: 1 1 auto; min-width: 0; gap: 6px) */}
        <div className="hidden md:flex flex-1 items-center justify-start min-w-0 mr-3">
          <nav className="flex items-center gap-[6px] min-w-0">
            {navItems.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.route)}
                  className={`px-[8px] py-1.5 text-[12px] font-mono font-medium rounded-[4px] transition-colors whitespace-nowrap flex-none ${
                    isActive
                      ? "bg-[#111111] text-white"
                      : "text-[#555555] hover:text-[#111111] hover:bg-[#F5F5F5]"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* REGION 3: USER ACCOUNT / PUBLIC ACTIONS (flex: 0 0 auto) */}
        <div className="hidden md:flex flex-none items-center gap-2 border-l border-[#E5E5E5] pl-3">
          {user ? (
            <div className="flex items-center gap-2">
              {/* User Dropdown Button */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`px-2 py-1.5 rounded-[4px] border transition-colors text-[12px] font-mono font-medium flex items-center gap-1.5 whitespace-nowrap max-w-[180px] ${
                    activeTab === "profile" || userDropdownOpen
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-[#FAFAFA] border-[#E5E5E5] hover:border-[#D4D4D8] text-[#111111]"
                  }`}
                  aria-label="User Account Menu"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span className="truncate max-w-[95px]">{user.name}</span>
                  <span className="text-[9px] font-bold uppercase px-1 py-0.2 bg-[#E5E5E5] text-[#333333] rounded-[2px] shrink-0">
                    {user.role}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Account Dropdown Panel */}
                {userDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-64 bg-white border border-[#111111] rounded-[6px] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 font-mono text-xs space-y-1">
                    {/* Identity Header */}
                    <div className="px-3 py-1.5 border-b border-[#E5E5E5] space-y-0.5">
                      <div className="font-bold text-[#111111] text-xs truncate">{user.name}</div>
                      <div className="text-[11px] text-[#666666] truncate">{user.email}</div>
                      <div className="text-[9px] font-bold uppercase text-[#2563EB] tracking-wider pt-0.5">
                        Role: {user.role}
                      </div>
                    </div>

                    {/* Profile & Account Settings Link */}
                    <button
                      onClick={() => handleNavClick('/profile')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAFAFA] transition-colors ${
                        activeTab === "profile" ? "font-bold text-[#2563EB] bg-[#EFF6FF]" : "text-[#111111]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-[#2563EB]" />
                        Profile &amp; Account Details
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#888888]" />
                    </button>

                    {/* Logout in Dropdown */}
                    <div className="border-t border-[#E5E5E5] pt-1">
                      <button
                        onClick={() => { onSignOut(); setUserDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#FEF2F2] text-[#E53935] font-semibold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick('/')}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[4px] transition-colors whitespace-nowrap ${
                  activeTab === "landing" || activeTab === "overview"
                    ? "bg-[#111111] text-white"
                    : "text-[#555555] hover:text-[#111111] hover:bg-[#FAFAFA]"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onNavigate('/signin')}
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded-[4px] border border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#111111]"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('/signup')}
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded-[4px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Mobile Header Icons (< 768px): CREDexa | 👤 User | ☰ Menu */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {user && (
            <button
              onClick={() => onNavigate('/profile')}
              className="p-1.5 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-mono font-medium text-[#111111] flex items-center gap-1"
              title="User Profile"
            >
              <UserIcon className="w-4 h-4 text-[#2563EB]" />
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-[4px] border border-[#E5E5E5] text-[#111111] hover:bg-[#FAFAFA] focus:outline-none flex items-center gap-1"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer (< 768px) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E5E5] bg-white px-4 py-3 space-y-3 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="text-[10px] font-mono uppercase font-bold text-[#888888] tracking-wider">
            ALL NAVIGATION FEATURES
          </div>
          <nav className="flex flex-col gap-1">
            {!user && (
              <button
                onClick={() => handleNavClick('/')}
                className={`w-full text-left px-3 py-2 text-xs font-mono font-medium rounded-[4px] transition-colors flex items-center justify-between ${
                  activeTab === "landing" || activeTab === "overview"
                    ? "bg-[#111111] text-white"
                    : "text-[#555555] hover:text-[#111111] hover:bg-[#F5F5F5]"
                }`}
              >
                <span>Overview</span>
                {(activeTab === "landing" || activeTab === "overview") && <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />}
              </button>
            )}
            {navItems.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.route)}
                  className={`w-full text-left px-3 py-2 text-xs font-mono font-medium rounded-[4px] transition-colors flex items-center justify-between ${
                    isActive
                      ? "bg-[#111111] text-white"
                      : "text-[#555555] hover:text-[#111111] hover:bg-[#F5F5F5]"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#E5E5E5] space-y-2">
            {user ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick('/profile')}
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] hover:border-[#D4D4D8] rounded-[4px] text-xs font-mono flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-bold text-[#111111]">{user.name}</div>
                    <div className="text-[10px] text-[#666666]">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold uppercase px-1 py-0.2 bg-[#E5E5E5] text-[#333333] rounded-[2px]">
                      {user.role}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#888888]" />
                  </div>
                </button>

                <button
                  onClick={() => { onSignOut(); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 rounded-[4px] border border-[#E53935] bg-[#FEF2F2] text-xs font-mono font-bold text-[#E53935] flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout ({user.email})</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={() => handleNavClick('/signin')}
                  className="py-2.5 text-center text-xs font-mono font-semibold rounded-[4px] border border-[#E5E5E5] text-[#111111]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('/signup')}
                  className="py-2.5 text-center text-xs font-mono font-semibold rounded-[4px] bg-[#2563EB] text-white"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
