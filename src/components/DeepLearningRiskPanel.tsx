// src/components/DeepLearningRiskPanel.tsx
import React, { useState } from 'react';
import { Cpu, X, Layers, Minimize2, Maximize2 } from 'lucide-react';
import type { VisualNode } from '../graph/CanvasGraphRenderer';

interface DeepLearningRiskPanelProps {
  selectedNode: VisualNode | null;
  onClose: () => void;
}

export const DeepLearningRiskPanel: React.FC<DeepLearningRiskPanelProps> = ({
  selectedNode,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const nodeId = selectedNode ? selectedNode.id : 0;
  const label = selectedNode ? `P-${String(nodeId).padStart(3, '0')}` : 'P-000';

  if (isMinimized) {
    return (
      <div className="absolute top-20 right-4 z-40 rounded-full bg-white/90 border border-amber-300 shadow-xl px-4 py-2 flex items-center space-x-2.5 text-[#444766] font-mono text-xs backdrop-blur-md animate-in fade-in select-none">
        <div className="w-2 h-2 rounded-full bg-[#B47B1E] animate-pulse" />
        <Cpu className="w-3.5 h-3.5 text-[#B47B1E]" />
        <span className="font-bold">ML RISK [{label}]</span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-slate-100 rounded-lg text-[#B47B1E] cursor-pointer"
          title="Expand Risk Prediction Panel"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-lg text-[#787B99] cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-20 right-4 z-40 w-84 rounded-2xl glass-panel border border-[#9FA1FF]/45 shadow-2xl p-5 text-[#444766] font-mono text-xs space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(159,161,255,0.22)]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[#B47B1E]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold uppercase tracking-wider text-xs text-[#444766]">
              TRANSMISSION RISK PREDICTION
            </h3>
            <span className="text-[10px] text-[#787B99]">NEURAL GRAPH NETWORK LAYER</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-[#787B99] hover:text-[#444766] cursor-pointer"
            title="Minimize to floating pill to view background network"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-[#787B99] hover:text-[#444766] cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Node & Risk Slot */}
      <div className="p-4 rounded-xl bg-white/90 border border-[#9FA1FF]/25 text-center space-y-2 shadow-xs">
        <span className="text-[10px] text-[#787B99] block font-bold">SUBJECT INFERENCE TARGET</span>
        <div className="text-xl font-black text-[#444766]">{label}</div>
        <div className="pt-2 border-t border-[rgba(159,161,255,0.2)] flex justify-between items-center text-xs">
          <span className="text-[#676B8C]">Risk Prediction:</span>
          <span className="font-bold text-2xl text-[#787B99]/50 tracking-widest font-mono">--</span>
        </div>
      </div>

      {/* Model Status Card */}
      <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/25 space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#787B99] font-bold">MODEL STATUS</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold">
            NOT CONNECTED
          </span>
        </div>
        <p className="text-[10.5px] text-[#676B8C] leading-relaxed">
          PyTorch / ONNX Runtime interface is structurally mounted. Inference predictions will populate upon backend model deployment.
        </p>
      </div>

      {/* Input Tensor Feature Vector Schema */}
      <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/25 space-y-1.5 shadow-xs">
        <span className="text-[10px] text-[#787B99] block font-bold flex items-center space-x-1">
          <Layers className="w-3.5 h-3.5 text-[#9192E8]" />
          <span>INFERENCE FEATURE TENSOR [1 × 5]</span>
        </span>
        <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 text-[10px] text-[#444766] space-y-0.5">
          <div>[0]: Degree: <span className="font-bold text-[#9192E8]">{selectedNode?.degree ?? 1}</span></div>
          <div>[1]: Community Cluster: <span className="font-bold text-[#9192E8]">{selectedNode?.community ?? 0}</span></div>
          <div>[2]: Health State Encoding: <span className="font-bold text-[#9192E8]">"{selectedNode?.state ?? 'S'}"</span></div>
          <div>[3]: Local Density: <span className="font-bold text-[#9192E8]">0.14</span></div>
          <div>[4]: Closeness Centrality: <span className="text-[#787B99]">pending</span></div>
        </div>
      </div>
    </div>
  );
};
