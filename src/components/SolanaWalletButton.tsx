import React, { useState, useEffect } from "react";
import { Wallet, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import {
  connectPhantomWallet,
  getPhantomProvider,
  getDevnetSolBalance,
  WalletConnectionState,
} from "../utils/solana";

interface SolanaWalletButtonProps {
  onWalletStateChange?: (state: WalletConnectionState) => void;
}

export const SolanaWalletButton: React.FC<SolanaWalletButtonProps> = ({
  onWalletStateChange,
}) => {
  const [walletState, setWalletState] = useState<WalletConnectionState>({
    connected: false,
    publicKey: null,
    balanceSol: 0,
    network: "Solana Devnet",
    error: null,
  });
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Auto-detect existing wallet session on mount
  useEffect(() => {
    const provider = getPhantomProvider();
    if (provider && provider.publicKey) {
      const pubKey = provider.publicKey.toString();
      getDevnetSolBalance(pubKey).then((bal) => {
        const state: WalletConnectionState = {
          connected: true,
          publicKey: pubKey,
          balanceSol: bal,
          network: "Solana Devnet",
          error: null,
        };
        setWalletState(state);
        if (onWalletStateChange) onWalletStateChange(state);
      });
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    const result = await connectPhantomWallet();
    setWalletState(result);
    setIsConnecting(false);
    if (onWalletStateChange) onWalletStateChange(result);
  };

  const handleRefreshBalance = async () => {
    if (walletState.publicKey) {
      const bal = await getDevnetSolBalance(walletState.publicKey);
      const updated = { ...walletState, balanceSol: bal };
      setWalletState(updated);
      if (onWalletStateChange) onWalletStateChange(updated);
    }
  };

  const handleDisconnect = () => {
    const provider = getPhantomProvider();
    if (provider) {
      try {
        provider.disconnect();
      } catch (e) {}
    }
    const resetState: WalletConnectionState = {
      connected: false,
      publicKey: null,
      balanceSol: 0,
      network: "Solana Devnet",
      error: null,
    };
    setWalletState(resetState);
    if (onWalletStateChange) onWalletStateChange(resetState);
  };

  return (
    <div className="font-mono text-xs">
      {!walletState.connected ? (
        <div className="space-y-2">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#27272A] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border border-[#0A0A0A]"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#059669]" /> CONNECTING PHANTOM...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 text-[#059669]" /> CONNECT SOLANA WALLET
              </>
            )}
          </button>

          {walletState.error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Wallet Connection Error
              </div>
              <div>{walletState.error}</div>
              <div className="pt-1">
                <a
                  href="https://faucet.solana.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-[#2563EB] flex items-center gap-1"
                >
                  Get Free Solana Devnet SOL <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-[#0A0A0A] bg-white p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
            <span className="flex items-center gap-1.5 font-bold text-[#059669]">
              <CheckCircle2 className="w-4 h-4" /> PHANTOM WALLET CONNECTED
            </span>
            <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-bold text-[9px] uppercase tracking-widest">
              SOLANA DEVNET
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#71717A] text-[10px]">ADDRESS: </span>
              <strong className="text-[#0A0A0A]">
                {walletState.publicKey?.slice(0, 6)}...{walletState.publicKey?.slice(-6)}
              </strong>
            </div>
            <div>
              <span className="text-[#71717A] text-[10px]">DEVNET SOL: </span>
              <strong className="text-[#059669]">{walletState.balanceSol.toFixed(4)} SOL</strong>
              <button
                onClick={handleRefreshBalance}
                className="ml-1 text-[#71717A] hover:text-[#0A0A0A]"
                title="Refresh Balance"
              >
                <RefreshCw className="w-3 h-3 inline" />
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[10px] border-t border-[#E4E4E7]">
            <a
              href="https://faucet.solana.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#2563EB] font-bold hover:underline flex items-center gap-1"
            >
              Request Free Devnet SOL Faucet <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleDisconnect}
              className="text-[#DC2626] font-bold hover:underline"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
