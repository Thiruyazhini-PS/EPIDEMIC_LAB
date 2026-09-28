// src/components/StructuralAnalysisModal.tsx
import React from 'react';
import {
  Network,
  ShieldAlert,
  Crown,
  Compass,
  GitCommit,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { BridgeEdge, HubResult, ComponentResult } from '../algorithms/GraphAlgorithms';

interface StructuralAnalysisModalProps {
  nodeCount: number;
  edgeCount: number;
  density: number;
  avgDegree: number;
  bridges: BridgeEdge[];
  hubs: HubResult[];
  components: ComponentResult[];
  activeAlgorithmLabel?: string | null;
  onFindBridges: () => void;
  onFindHubs: () => void;
  onFindComponents: () => void;
  onRunBFS: () => void;
  onRunDFS: () => void;
  onFindShortestPath: () => void;
  onClearHighlights: () => void;
}

export const StructuralAnalysisModal: React.FC<StructuralAnalysisModalProps> = ({
  nodeCount,
  edgeCount,
  density,
  avgDegree,
  bridges,
  hubs,
  components,
  activeAlgorithmLabel,
  onFindBridges,
  onFindHubs,
  onFindComponents,
  onRunBFS,
  onRunDFS,
  onFindShortestPath,
  onClearHighlights,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-[rgba(159,161,255,0.3)] shadow-lg select-none w-full max-w-sm">
      {/* Title & Active algorithm badge */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[rgba(159,161,255,0.2)]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#9FA1FF]/20 text-[#9192E8]">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#444766] uppercase tracking-wider">
              Network Topology Analysis
            </h3>
            <p className="text-[10px] text-[#787B99]">Real-time Tarjan & Traversal Solvers</p>
          </div>
        </div>

        {activeAlgorithmLabel && (
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#9192E8]/15 text-[#9192E8] border border-[#9192E8]/30 text-[10px] font-bold animate-pulse-subtle">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{activeAlgorithmLabel}</span>
          </div>
        )}
      </div>

      {/* 4 Compact Graph Metrics */}
      <div className="grid grid-cols-4 gap-1.5 mb-3 text-center">
        <div className="p-2 rounded-xl bg-white/70 border border-[#9FA1FF]/20">
          <div className="text-[9px] uppercase font-bold text-[#787B99]">Nodes</div>
          <div className="text-sm font-extrabold text-[#444766] font-mono">{nodeCount}</div>
        </div>
        <div className="p-2 rounded-xl bg-white/70 border border-[#9FA1FF]/20">
          <div className="text-[9px] uppercase font-bold text-[#787B99]">Edges</div>
          <div className="text-sm font-extrabold text-[#444766] font-mono">{edgeCount}</div>
        </div>
        <div className="p-2 rounded-xl bg-white/70 border border-[#9FA1FF]/20">
          <div className="text-[9px] uppercase font-bold text-[#787B99]">Density</div>
          <div className="text-sm font-extrabold text-[#444766] font-mono">
            {(density * 100).toFixed(1)}%
          </div>
        </div>
        <div className="p-2 rounded-xl bg-white/70 border border-[#9FA1FF]/20">
          <div className="text-[9px] uppercase font-bold text-[#787B99]">Avg Deg</div>
          <div className="text-sm font-extrabold text-[#444766] font-mono">
            {avgDegree.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Algorithmic Actions Buttons */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-[#787B99] uppercase tracking-wider px-1">
          Graph Surgery & Detection Solvers
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {/* Find Bridges (Tarjan) */}
          <button
            onClick={onFindBridges}
            className="flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-white/80 hover:bg-[#AEE2FF]/30 border border-[#9FA1FF]/25 text-xs text-[#444766] font-medium transition-all group"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#9192E8] group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-semibold leading-tight">Find Bridges</div>
              <div className="text-[9px] text-[#787B99] font-mono">{bridges.length} detected (Tarjan)</div>
            </div>
          </button>

          {/* Find Hubs */}
          <button
            onClick={onFindHubs}
            className="flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-white/80 hover:bg-[#AEE2FF]/30 border border-[#9FA1FF]/25 text-xs text-[#444766] font-medium transition-all group"
          >
            <Crown className="w-3.5 h-3.5 text-[#9192E8] group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-semibold leading-tight">Identify Hubs</div>
              <div className="text-[9px] text-[#787B99] font-mono">{hubs.length} superspreaders</div>
            </div>
          </button>

          {/* Connected Components */}
          <button
            onClick={onFindComponents}
            className="flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-white/80 hover:bg-[#AEE2FF]/30 border border-[#9FA1FF]/25 text-xs text-[#444766] font-medium transition-all group"
          >
            <Layers className="w-3.5 h-3.5 text-[#9192E8] group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-semibold leading-tight">Components</div>
              <div className="text-[9px] text-[#787B99] font-mono">{components.length} clusters</div>
            </div>
          </button>

          {/* Shortest Path */}
          <button
            onClick={onFindShortestPath}
            className="flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-white/80 hover:bg-[#AEE2FF]/30 border border-[#9FA1FF]/25 text-xs text-[#444766] font-medium transition-all group"
          >
            <ArrowRight className="w-3.5 h-3.5 text-[#9192E8] group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-semibold leading-tight">Shortest Path</div>
              <div className="text-[9px] text-[#787B99] font-mono">Seed to Hub</div>
            </div>
          </button>
        </div>

        {/* Traversal Row */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            onClick={onRunBFS}
            className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl bg-white/70 hover:bg-[#D9F9DF]/60 border border-[#9FA1FF]/25 text-xs font-semibold text-[#444766] transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-[#427A54]" />
            <span>BFS Wave (Queue)</span>
          </button>

          <button
            onClick={onRunDFS}
            className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-xl bg-white/70 hover:bg-[#AEE2FF]/30 border border-[#9FA1FF]/25 text-xs font-semibold text-[#444766] transition-all"
          >
            <GitCommit className="w-3.5 h-3.5 text-[#3B6A84]" />
            <span>DFS Depth Trail</span>
          </button>
        </div>

        {/* Clear overlay button if active */}
        {activeAlgorithmLabel && (
          <button
            onClick={onClearHighlights}
            className="w-full mt-1 py-1 text-center text-[10px] font-semibold text-[#9192E8] hover:underline"
          >
            Clear Graph Visualization Highlights
          </button>
        )}
      </div>
    </div>
  );
};
