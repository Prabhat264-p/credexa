import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as new (props: ErrorBoundaryProps) => any) {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled React runtime error:", error, errorInfo);
  }

  private handleRetry = () => {
    (this as any).setState({ hasError: false, error: null });
    if ((this as any).props.onReset) {
      (this as any).props.onReset();
    }
  };

  public render() {
    const props = (this as any).props as ErrorBoundaryProps;
    const state = (this as any).state as ErrorBoundaryState;

    if (state.hasError) {
      return (
        <div className="border-2 border-[#0A0A0A] bg-white p-6 md:p-8 space-y-4 font-mono text-xs shadow-xl my-4">
          <div className="flex items-center gap-3 border-b border-[#E4E4E7] pb-4">
            <AlertTriangle className="w-6 h-6 text-[#DC2626] shrink-0" />
            <div>
              <div className="text-base font-extrabold text-[#0A0A0A] uppercase tracking-wider">
                {props.fallbackTitle || "VISION RESULT ERROR"}
              </div>
              <div className="text-xs text-[#52525B] font-sans mt-0.5">
                Unable to render the investigation report due to a component state issue.
              </div>
            </div>
          </div>

          <div className="bg-[#F8F9FA] p-3 border border-[#E4E4E7] text-[#71717A] text-[11px] font-mono overflow-x-auto">
            <strong>Error Exception:</strong> {state.error?.message || "Unknown runtime render failure"}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="py-2.5 px-4 bg-[#0A0A0A] text-white hover:bg-[#27272A] font-bold text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> RETRY / RESET
            </button>
            {props.onReset && (
              <button
                onClick={() => {
                  (this as any).setState({ hasError: false, error: null });
                  props.onReset!();
                }}
                className="py-2.5 px-4 border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#F4F4F5] font-bold text-xs uppercase tracking-wider flex items-center gap-2"
              >
                <X className="w-4 h-4" /> CLEAR ANALYSIS
              </button>
            )}
          </div>
        </div>
      );
    }

    return props.children;
  }
}
