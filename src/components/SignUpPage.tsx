import React, { useState } from 'react';
import { User, Role } from '../types';
import { ArrowRight, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Building, Wallet, Mail, User as UserIcon, Phone } from 'lucide-react';
import { apiRegister } from '../services/apiClient';

interface SignUpPageProps {
  onRegisterSuccess: (user: User, token: string) => void;
  onNavigateToSignIn: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onRegisterSuccess, onNavigateToSignIn }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>('FINANCEE');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    gstin: '',
    walletAddress: '',
    phoneNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: 'None', score: 0, color: 'bg-slate-200' };
    if (pass.length < 6) return { label: 'Weak', score: 1, color: 'bg-[#E53935]' };
    if (pass.length < 10) return { label: 'Medium', score: 2, color: 'bg-[#D97706]' };
    return { label: 'Strong', score: 3, color: 'bg-[#16A34A]' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user, token } = await apiRegister({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role,
        organizationName: formData.organizationName || undefined,
        gstin: formData.gstin || undefined,
        walletAddress: formData.walletAddress || undefined,
        phoneNumber: formData.phoneNumber || undefined,
      });

      onRegisterSuccess(user, token);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl border border-[#E5E5E5] rounded-[8px] bg-white p-8 space-y-6 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#2563EB]">Step {step} of 2</span>
          <h2 className="text-2xl font-black text-[#111111] font-mono tracking-tight">CREATE YOUR CREDEXA ACCOUNT</h2>
          <p className="text-xs text-[#555555]">Join the decentralized MSME supply chain finance protocol</p>
        </div>

        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[4px] text-xs font-mono text-[#E53935] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Role Selection Cards */}
        {step === 1 ? (
          <div className="space-y-6">
            <label className="block text-xs uppercase tracking-wider font-mono text-[#555555] text-center">
              Select Account Role
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Financee Role Card */}
              <button
                type="button"
                onClick={() => setRole('FINANCEE')}
                className={`p-5 rounded-[6px] border text-left transition-all ${
                  role === 'FINANCEE'
                    ? 'border-[#2563EB] bg-[#EFF6FF]'
                    : 'border-[#E5E5E5] bg-[#FAFAFA] hover:border-[#D4D4D8]'
                }`}
              >
                <div className={`text-xs font-mono font-bold mb-2 ${role === 'FINANCEE' ? 'text-[#2563EB]' : 'text-[#555555]'}`}>
                  FINANCEE
                </div>
                <h3 className="font-bold text-[#111111] text-sm mb-1">MSME Borrower</h3>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Submit invoices and access instant eINR working capital financing.
                </p>
              </button>

              {/* Financer Role Card */}
              <button
                type="button"
                onClick={() => setRole('FINANCER')}
                className={`p-5 rounded-[6px] border text-left transition-all ${
                  role === 'FINANCER'
                    ? 'border-[#2563EB] bg-[#EFF6FF]'
                    : 'border-[#E5E5E5] bg-[#FAFAFA] hover:border-[#D4D4D8]'
                }`}
              >
                <div className={`text-xs font-mono font-bold mb-2 ${role === 'FINANCER' ? 'text-[#2563EB]' : 'text-[#555555]'}`}>
                  FINANCER
                </div>
                <h3 className="font-bold text-[#111111] text-sm mb-1">Liquidity Provider</h3>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Explore verified financing opportunities across Senior & Junior tranches.
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Continue Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* STEP 2: Registration Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-[#333333] mb-1 font-medium">Full Name *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#333333] mb-1 font-medium">Work Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rajesh@precisiongear.io"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#333333] mb-1 font-medium">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
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
              {formData.password.length > 0 && (
                <div className="mt-1 flex items-center gap-2 text-[10px]">
                  <div className="flex gap-1 h-1 flex-1">
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`} />
                  </div>
                  <span className="text-[#666666]">Strength: {strength.label}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#333333] mb-1 font-medium">Organization Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder={role === 'FINANCEE' ? 'Precision Geartech Pvt Ltd' : 'Apex Capital Vaults'}
                    className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#333333] mb-1 font-medium">GSTIN (Optional for MSME)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="27AAACP1842Q1Z9"
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#333333] mb-1 font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+91 98200 11223"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#333333] mb-1 font-medium">Solana Devnet Wallet Address</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.walletAddress}
                    onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                    placeholder="7x...PhantomDevnetPublicKey"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-[6px] bg-[#FAFAFA] border border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5] font-semibold text-xs"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-xs font-mono text-[#666666] pt-4 border-t border-[#E5E5E5]">
          Already have an account?{' '}
          <button onClick={onNavigateToSignIn} className="text-[#2563EB] font-bold hover:underline">
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
};
