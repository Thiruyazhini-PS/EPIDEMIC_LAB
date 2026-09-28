// src/components/WhyOutbreakChanged.tsx
import React from 'react';
import {
  Scissors,
  Split,
  Users2,
  ShieldCheck,
  GitCompare,
} from 'lucide-react';

interface WhyOutbreakChangedProps {
  baselineInfected: number;
  counterfactualInfected: number;
  interventionType?: 'bridge_removed' | 'isolated_hub' | 'contact_reduced' | 'custom';
}

export const WhyOutbreakChanged: React.FC<WhyOutbreakChangedProps> = ({
  baselineInfected,
  counterfactualInfected,
  interventionType = 'bridge_removed',
}) => {
  const casesSaved = Math.max(0, baselineInfected - counterfactualInfected);
  const percentReduction =
    baselineInfected > 0 ? Math.round((casesSaved / baselineInfected) * 100) : 0;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-[#9FA1FF]/30 shadow-lg select-none w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[rgba(159,161,255,0.2)]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#D9F9DF] text-[#427A54] border border-[#BDEEC8]">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#444766] uppercase tracking-wider">
              Why did the outbreak change?
            </h4>
            <p className="text-[10px] text-[#787B99]">Algorithmic Causal Chain of Evidence</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-extrabold text-[#427A54] font-mono block">
            -{percentReduction}% Infected
          </span>
          <span className="text-[9px] text-[#787B99]">
            {casesSaved} fewer transmissions
          </span>
        </div>
      </div>

      {/* Vertical Icon Chain with Mini-Graphics */}
      <div className="space-y-2 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-[#9192E8] via-[#AEE2FF] to-[#D9F9DF]">
        {/* Step 1: Structural Cut */}
        <div className="flex items-start space-x-3 relative">
          <div className="w-8 h-8 rounded-full bg-white border border-[#9192E8] shadow-sm flex items-center justify-center shrink-0 text-[#9192E8] z-10">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <div className="pt-0.5">
            <div className="text-xs font-bold text-[#444766]">
              {interventionType === 'isolated_hub' ? 'Superspreader Hub Isolated' : 'Inter-Cluster Bridge Severed'}
            </div>
            <p className="text-[11px] text-[#787B99] leading-tight">
              Network surgery cut the critical high-betweenness contact edge.
            </p>
          </div>
        </div>

        {/* Step 2: Network Split */}
        <div className="flex items-start space-x-3 relative">
          <div className="w-8 h-8 rounded-full bg-white border border-[#AEE2FF] shadow-sm flex items-center justify-center shrink-0 text-[#3B6A84] z-10">
            <Split className="w-3.5 h-3.5" />
          </div>
          <div className="pt-0.5">
            <div className="text-xs font-bold text-[#444766]">
              Connected Component Partitioned
            </div>
            <p className="text-[11px] text-[#787B99] leading-tight">
              Tarjan low-link condition broken; graph partitioned into disjoint subgraphs.
            </p>
          </div>
        </div>

        {/* Step 3: Path Blocked */}
        <div className="flex items-start space-x-3 relative">
          <div className="w-8 h-8 rounded-full bg-white border border-[#B5BAFF] shadow-sm flex items-center justify-center shrink-0 text-[#9192E8] z-10">
            <Users2 className="w-3.5 h-3.5" />
          </div>
          <div className="pt-0.5">
            <div className="text-xs font-bold text-[#444766]">
              Transmission Paths Blocked
            </div>
            <p className="text-[11px] text-[#787B99] leading-tight">
              Active pathogens in Cluster #0 cannot reach Susceptible nodes in Cluster #1.
            </p>
          </div>
        </div>

        {/* Step 4: Smaller Outbreak */}
        <div className="flex items-start space-x-3 relative">
          <div className="w-8 h-8 rounded-full bg-[#D9F9DF] border border-[#BDEEC8] shadow-sm flex items-center justify-center shrink-0 text-[#427A54] z-10">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="pt-0.5">
            <div className="text-xs font-bold text-[#427A54]">
              Outbreak Contained & Extinguished
            </div>
            <p className="text-[11px] text-[#787B99] leading-tight">
              Simulation evidence: baseline reached {baselineInfected} vs counterfactual {counterfactualInfected} cases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
