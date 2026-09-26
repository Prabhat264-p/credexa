import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Zap } from 'lucide-react';
import { apiLogin } from '../services/apiClient';

interface SignInPageProps {
  onSignInSuccess: (user: User, token: string) => void;
  onNavigateToSignUp: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignInSuccess, onNavigateToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user, token } = await apiLogin(email, password);
      onSignInSuccess(user, token);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
    setLoading(true);

    try {
      const { user, token } = await apiLogin(demoEmail, 'password123');
      onSignInSuccess(user, token);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md border border-[#E5E5E5] rounded-[8px] bg-white p-8 space-y-6 shadow-sm">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#2563EB]">Credential Access</span>
          <h2 className="text-3xl font-black text-[#111111] font-mono tracking-tight">WELCOME BACK.</h2>
          <p className="text-xs text-[#555555]">Sign in to your Credexa protocol workspace</p>
        </div>

        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[4px] text-xs font-mono text-[#E53935] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-[#333333] mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo.financee@credexa.io"
                className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#333333] mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-9 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#888888] hover:text-[#111111]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[6px] space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#888888] flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Hackathon Quick Logins</span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('demo.financee@credexa.io')}
              className="p-2 bg-white border border-[#E5E5E5] hover:border-[#2563EB] rounded-[4px] text-left text-xs transition-colors"
            >
              <div className="font-bold text-[#111111]">Financee Demo</div>
              <div className="text-[10px] text-[#888888]">MSME Borrower</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('demo.financer@credexa.io')}
              className="p-2 bg-white border border-[#E5E5E5] hover:border-[#16A34A] rounded-[4px] text-left text-xs transition-colors"
            >
              <div className="font-bold text-[#111111]">Financer Demo</div>
              <div className="text-[10px] text-[#888888]">Liquidity Provider</div>
            </button>
          </div>
        </div>

        {/* Link to Sign Up */}
        <div className="text-center text-xs font-mono text-[#666666] pt-2 border-t border-[#E5E5E5]">
          Don't have an account yet?{' '}
          <button onClick={onNavigateToSignUp} className="text-[#2563EB] font-bold hover:underline">
            Create account
          </button>
        </div>
      </div>
    </div>
  );
};
