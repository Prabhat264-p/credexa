import React, { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Building, Wallet, Mail, Phone, ShieldCheck, CheckCircle2, Edit3, Save } from 'lucide-react';
import { safeFetch } from '../services/apiClient';

interface UserProfileViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ user, onUpdateUser }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    organizationName: user.organizationName || '',
    gstin: user.gstin || '',
    walletAddress: user.walletAddress || '',
    phone: user.phone || user.phoneNumber || '',
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await safeFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (!res.ok || !res.data.success) {
        throw new Error(res.data.error || 'Failed to update profile');
      }

      onUpdateUser(res.data.user);
      setEditing(false);
      setMsg('Profile updated successfully!');
    } catch (err: any) {
      setMsg(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] py-6 sm:py-8 font-sans">
      <div className="app-container space-y-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-[#E5E5E5]">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#2563EB] mb-1">
              ACCOUNT MANAGEMENT
            </div>
            <h1 className="text-3xl font-black text-[#111111] font-mono tracking-tight">USER PROFILE</h1>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 rounded-[6px] border border-[#E5E5E5] hover:bg-[#FAFAFA] text-xs font-mono font-semibold transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4 text-[#2563EB]" />
            <span>{editing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>

        {msg && (
          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[4px] text-xs font-mono text-[#16A34A] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-4 font-mono text-xs">
            <h2 className="text-sm font-bold text-[#111111] pb-2 border-b border-[#E5E5E5]">EDIT ACCOUNT INFORMATION</h2>
            
            <div>
              <label className="text-[#333333] block mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#333333] block mb-1">Organization Name</label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[#333333] block mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#333333] block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[#333333] block mb-1">Solana Devnet Wallet Address</label>
              <input
                type="text"
                value={formData.walletAddress}
                onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[4px] text-[#111111] focus:border-[#2563EB] focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-[4px] flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Settings'}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-6 font-mono text-xs">
            {/* 1. ACCOUNT INFORMATION */}
            <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-4">
              <h2 className="text-sm font-bold text-[#111111] pb-2 border-b border-[#E5E5E5] flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#2563EB]" />
                <span>ACCOUNT INFORMATION</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#888888] block text-[10px]">Full Name:</span>
                  <span className="font-bold text-[#111111]">{user.name}</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">Email Address:</span>
                  <span className="font-bold text-[#111111]">{user.email}</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">Assigned Role:</span>
                  <span className="font-bold text-[#2563EB]">{user.role}</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">Phone Number:</span>
                  <span className="font-bold text-[#111111]">{user.phone || user.phoneNumber || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* 2. ORGANIZATION */}
            <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-4">
              <h2 className="text-sm font-bold text-[#111111] pb-2 border-b border-[#E5E5E5] flex items-center gap-2">
                <Building className="w-4 h-4 text-[#16A34A]" />
                <span>ORGANIZATION & TAX DATA</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#888888] block text-[10px]">Registered Entity Name:</span>
                  <span className="font-bold text-[#111111]">{user.organizationName || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">GSTIN Registration:</span>
                  <span className="font-bold text-[#16A34A]">{user.gstin || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* 3. BLOCKCHAIN */}
            <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-4">
              <h2 className="text-sm font-bold text-[#111111] pb-2 border-b border-[#E5E5E5] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#2563EB]" />
                <span>BLOCKCHAIN & WALLET SPECIFICATION</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#888888] block text-[10px]">Solana Devnet Wallet:</span>
                  <span className="font-bold text-[#2563EB] break-all">{user.walletAddress || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">Cluster Environment:</span>
                  <span className="font-bold text-[#111111]">Solana Devnet (SPL eINR)</span>
                </div>
              </div>
            </div>

            {/* 4. SECURITY */}
            <div className="p-6 border border-[#E5E5E5] rounded-[6px] bg-white space-y-4">
              <h2 className="text-sm font-bold text-[#111111] pb-2 border-b border-[#E5E5E5] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <span>SECURITY & AUDIT STATE</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#888888] block text-[10px]">Authentication Method:</span>
                  <span className="font-bold text-[#111111]">JWT Bearer Token + bcrypt Passwords</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">KYC & Verification Status:</span>
                  <span className="font-bold text-[#16A34A]">VERIFIED PROTOCOL PARTICIPANT</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
