import React from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle, ChevronRight } from "lucide-react";

export interface TimelineStep {
  id: string;
  title: string;
  status: "COMPLETED" | "PENDING" | "BLOCKED" | "DISPUTED";
  timestamp?: string;
  detail?: string;
  actor?: string;
  txSignature?: string;
}

interface VerificationTimelineProps {
  steps: TimelineStep[];
  activeStepId?: string;
  onStepClick?: (step: TimelineStep) => void;
}

export const VerificationTimeline: React.FC<VerificationTimelineProps> = ({
  steps,
  onStepClick,
}) => {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 font-sans space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#111111]">
          Receivable Lifecycle Verification Timeline
        </h3>
        <span className="text-[10px] font-mono text-[#888888]">CHRONOLOGICAL TRACE</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2 text-xs font-mono">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "COMPLETED";
          const isPending = step.status === "PENDING";
          const isBlocked = step.status === "BLOCKED";
          const isDisputed = step.status === "DISPUTED";

          return (
            <div
              key={step.id || idx}
              onClick={() => onStepClick && onStepClick(step)}
              className={`p-2.5 rounded-md border transition-colors flex flex-col justify-between cursor-pointer ${
                isCompleted
                  ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]"
                  : isPending
                  ? "bg-[#FAFAFA] border-[#E5E5E5] text-[#666666]"
                  : isBlocked
                  ? "bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]"
                  : "bg-[#FEF2F2] border-[#FECACA] text-[#E53935]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#888888]">Step {idx + 1}</span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />}
                {isPending && <Clock className="w-3.5 h-3.5 text-[#888888]" />}
                {isBlocked && <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />}
                {isDisputed && <XCircle className="w-3.5 h-3.5 text-[#E53935]" />}
              </div>

              <div className="font-bold text-[11px] leading-tight my-1 truncate text-[#111111]" title={step.title}>
                {step.title}
              </div>

              <div className="text-[9px] font-semibold tracking-wider uppercase">
                {isCompleted ? "✓ DONE" : isPending ? "○ PENDING" : isBlocked ? "⚠ BLOCKED" : "! DISPUTED"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
