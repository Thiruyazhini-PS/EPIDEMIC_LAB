// src/components/FloatingEdgeToolbar.tsx
import React from 'react';
import { Trash2, EyeOff, RotateCw, RefreshCw, X, ShieldAlert } from 'lucide-react';
import type { VisualEdge } from '../graph/CanvasGraphRenderer';

interface FloatingEdgeToolbarProps {
  edge: VisualEdge;
  position: { x: number; y: number };
  onRemove: (source: number, target: number) => void;
  onDisable: (source: number, target: number) => void;
  onRestore: (source: number, target: number) => void;
  onRewire: (source: number, target: number) => void;
  onClose: () => void;
}

export const FloatingEdgeToolbar: React.FC<FloatingEdgeToolbarProps> = ({
  edge,
  position,
  onRemove,
  onDisable,
  onRestore,
  onRewire,
  onClose,
}) => {
  const uLabel = `#${String(edge.source).padStart(3, '0')}`;
  const vLabel = `#${String(edge.target).padStart(3, '0')}`;
  const riskPercent = Math.round((edge.weight ?? 1.0) * 35);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${Math.min(window.innerWidth - 260, Math.max(20, position.x - 120))}px`,
        top: `${Math.max(70, position.y - 100)}px`,
      }}
      className="z-40 glass-panel rounded-2xl p-2.5 px-3 border border-[#9FA1FF]/40 shadow-xl select-none animate-in fade-in zoom-in-95 duration-150 min-w-[240px]"
    >
      {/* Edge Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(159,161,255,0.2)]">
        <div className="flex items-center space-x-1.5">
          <span className="font-mono text-xs font-bold text-[#444766]">
            {uLabel} ↔ {vLabel}
          </span>
          {edge.isBridge && (
            <span className="flex items-center space-x-1 text-[9px] bg-[#9192E8]/15 text-[#9192E8] px-1.5 py-0.5 rounded font-bold border border-[#9192E8]/30">
              <ShieldAlert className="w-2.5 h-2.5" />
              <span>BRIDGE</span>
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#787B99] hover:text-[#444766]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Edge Info Tooltip */}
      <div className="flex items-center justify-between text-[11px] text-[#787B99] mb-2 px-1">
        <span>Strength: <b className="text-[#444766] font-mono">{edge.weight?.toFixed(1) || '1.0'}x</b></span>
        <span>Risk: <b className="text-[#9192E8] font-mono">{riskPercent}%</b></span>
      </div>

      {/* Floating Surgery Action Buttons */}
      <div className="grid grid-cols-3 gap-1 pt-1">
        {edge.disabled ? (
          <button
            onClick={() => onRestore(edge.source, edge.target)}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#D9F9DF] text-[#427A54] hover:bg-[#cbf4d3] text-[10px] font-semibold transition-all"
            title="Restore Disabled Contact"
          >
            <RotateCw className="w-3.5 h-3.5 mb-0.5" />
            <span>RESTORE</span>
          </button>
        ) : (
          <button
            onClick={() => onDisable(edge.source, edge.target)}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/80 hover:bg-[#AEE2FF]/30 text-[#444766] text-[10px] font-semibold transition-all border border-[#9FA1FF]/20"
            title="Quarantine / Disable Contact"
          >
            <EyeOff className="w-3.5 h-3.5 mb-0.5 text-[#787B99]" />
            <span>DISABLE</span>
          </button>
        )}

        <button
          onClick={() => onRewire(edge.source, edge.target)}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/80 hover:bg-[#AEE2FF]/30 text-[#444766] text-[10px] font-semibold transition-all border border-[#9FA1FF]/20"
          title="Rewire Edge to Different Neighbor"
        >
          <RefreshCw className="w-3.5 h-3.5 mb-0.5 text-[#9192E8]" />
          <span>REWIRE</span>
        </button>

        <button
          onClick={() => onRemove(edge.source, edge.target)}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#9192E8]/10 hover:bg-[#9192E8]/20 text-[#9192E8] text-[10px] font-semibold transition-all border border-[#9192E8]/25"
          title="Permanently Cut Edge"
        >
          <Trash2 className="w-3.5 h-3.5 mb-0.5" />
          <span>REMOVE</span>
        </button>
      </div>
    </div>
  );
};
