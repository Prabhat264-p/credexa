import React from 'react';
import { User, Role } from '../types';

interface ProtectedRouteProps {
  user: User | null;
  isLoading: boolean;
  requiredRole?: Role;
  children: React.ReactNode;
  onRedirectToSignIn: () => void;
  onRedirectToDashboard: (userRole: Role) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  isLoading,
  requiredRole,
  children,
  onRedirectToSignIn,
  onRedirectToDashboard,
}) => {
  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        onRedirectToSignIn();
      } else if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
        onRedirectToDashboard(user.role);
      }
    }
  }, [user, isLoading, requiredRole, onRedirectToSignIn, onRedirectToDashboard]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-white text-[#111111] flex flex-col items-center justify-center p-6 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#2563EB] rounded-full animate-spin mb-4" />
        <div className="font-semibold text-slate-700 uppercase tracking-wider">Authenticating Credexa Session...</div>
        <div className="text-slate-400 mt-1 text-[11px]">Verifying cryptographic session signature</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
};
