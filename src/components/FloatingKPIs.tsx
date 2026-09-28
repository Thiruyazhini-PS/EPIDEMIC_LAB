// src/components/FloatingKPIs.tsx
import React from 'react';
import { Users, Flame, ShieldCheck, Share2, Layers } from 'lucide-react';
import type { DaySnapshot } from '../simulation/SimulationEngine';

interface FloatingKPIsProps {
  currentSnapshot?: DaySnapshot;
  totalPopulation: number;
  communityCount: number;
  density: number;
  recentSnapshots: DaySnapshot[];
}

export const FloatingKPIs: React.FC<FloatingKPIsProps> = ({
  currentSnapshot,
  totalPopulation,
  communityCount,
  density,
  recentSnapshots,
}) => {
  const s = currentSnapshot?.sCount ?? totalPopulation;
  const e = currentSnapshot?.eCount ?? 0;
  const i = currentSnapshot?.iCount ?? 0;
  const r = currentSnapshot?.rCount ?? 0;

  // Tiny sparkline points for infectious curve
  const sparklinePoints = React.useMemo(() => {
    if (recentSnapshots.length < 2) return '';
    const maxVal = Math.max(1, ...recentSnapshots.map(snap => snap.iCount));
    const width = 64;
    const height = 24;
    return recentSnapshots
      .slice(-15)
      .map((snap, idx, arr) => {
        const x = (idx / (arr.length - 1)) * width;
        const y = height - (snap.iCount / maxVal) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [recentSnapshots]);

  return (
    <div className="flex flex-col space-y-2.5 pointer-events-none select-none">
      {/* 1. Infectious (I) with active glow & sparkline */}
      <div className="glass-panel rounded-2xl p-3 px-4 flex items-center justify-between border border-[#9FA1FF]/35 shadow-sm min-w-[210px] pointer-events-auto">
        <div>
          <div className="flex items-center space-x-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9192E8] shadow-[0_0_8px_#9192E8] animate-ping-soft" />
            <span className="text-[11px] font-semibold text-[#787B99] uppercase tracking-wider">
              Infectious [I]
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-[#444766] tracking-tight font-mono">
              {i}
            </span>
            <span className="text-[11px] text-[#9192E8] font-medium">
              {Math.round((i / Math.max(1, totalPopulation)) * 100)}%
            </span>
          </div>
        </div>

        {/* Mini sparkline */}
        <div className="relative w-16 h-8 flex items-center justify-end">
          {sparklinePoints ? (
            <svg className="w-16 h-7 overflow-visible">
              <polyline
                fill="none"
                stroke="#9192E8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePoints}
              />
            </svg>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#9192E8]/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#9192E8]" />
            </div>
          )}
        </div>
      </div>

      {/* 2. Exposed (E) - Sky Blue with pulsing ring */}
      <div className="glass-panel-subtle rounded-2xl p-2.5 px-3.5 flex items-center justify-between border border-[#AEE2FF]/50 shadow-xs pointer-events-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#AEE2FF]/40 border border-[#AEE2FF] flex items-center justify-center">
            <span className="text-xs font-bold text-[#3B6A84]">E</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#787B99] tracking-wider">
              Exposed (Incubating)
            </div>
            <div className="text-xl font-bold text-[#444766] font-mono leading-none mt-0.5">
              {e}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recovered (R) - Soft Mint */}
      <div className="glass-panel-subtle rounded-2xl p-2.5 px-3.5 flex items-center justify-between border border-[#D9F9DF]/80 shadow-xs pointer-events-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#D9F9DF] border border-[#BDEEC8] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#427A54]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#787B99] tracking-wider">
              Recovered & Immune
            </div>
            <div className="text-xl font-bold text-[#444766] font-mono leading-none mt-0.5">
              {r}
            </div>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-[#427A54] bg-[#D9F9DF] px-2 py-0.5 rounded-full">
          {Math.round((r / Math.max(1, totalPopulation)) * 100)}%
        </span>
      </div>

      {/* 4. Susceptible (S) - Soft Lavender */}
      <div className="glass-panel-subtle rounded-2xl p-2.5 px-3.5 flex items-center justify-between border border-[#9FA1FF]/25 shadow-xs pointer-events-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#9FA1FF]/25 border border-[#9FA1FF]/40 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#444766]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#787B99] tracking-wider">
              Susceptible
            </div>
            <div className="text-xl font-bold text-[#444766] font-mono leading-none mt-0.5">
              {s}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Mini Structural Clusters & Density */}
      <div className="glass-panel-subtle rounded-2xl p-2.5 px-3 flex items-center justify-around border border-[rgba(159,161,255,0.2)] text-center pointer-events-auto">
        <div className="flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-[#9192E8]" />
          <div className="text-left">
            <div className="text-[9px] uppercase text-[#787B99] font-bold">Clusters</div>
            <div className="text-xs font-bold text-[#444766] font-mono">{communityCount}</div>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-[#9FA1FF]/20" />

        <div className="flex items-center space-x-1.5">
          <Share2 className="w-3.5 h-3.5 text-[#9192E8]" />
          <div className="text-left">
            <div className="text-[9px] uppercase text-[#787B99] font-bold">Density</div>
            <div className="text-xs font-bold text-[#444766] font-mono">
              {(density * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
