// src/components/DSAXRayPanel.tsx
import React, { useMemo, useState } from 'react';
import {
  Layers,
  Network,
  ListTree,
  GitCommit,
  Hash,
  X,
  Cpu,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import type { SimulationEngine } from '../simulation/SimulationEngine';
import type { VisualNode } from '../graph/CanvasGraphRenderer';

interface DSAXRayPanelProps {
  engine: SimulationEngine;
  selectedNode: VisualNode | null;
  onClose: () => void;
  onSelectNodeById: (id: number) => void;
}

export const DSAXRayPanel: React.FC<DSAXRayPanelProps> = ({
  engine,
  selectedNode,
  onClose,
  onSelectNodeById,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const focusedId = selectedNode ? selectedNode.id : engine.allNodeIds[0] ?? 0;

  // Adjacency Neighbors of focused node
  const neighbors = useMemo(() => {
    return engine.graph.neighbors(focusedId);
  }, [engine.graph, focusedId]);

  // BFS Queue Preview: live simulated 1st & 2nd degree discovery queue
  const bfsQueue = useMemo(() => {
    const queue: number[] = [];
    const visited = new Set<number>();
    visited.add(focusedId);

    for (const nb of neighbors) {
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push(nb);
      }
    }

    // Add 2nd degree contacts up to 8 items
    for (const nb of neighbors) {
      const secondDegree = engine.graph.neighbors(nb);
      for (const s of secondDegree) {
        if (!visited.has(s) && queue.length < 8) {
          visited.add(s);
          queue.push(s);
        }
      }
    }
    return queue;
  }, [engine.graph, focusedId, neighbors]);

  // Priority Queue (MinHeap) snapshot of pending scheduled events
  const pendingEvents = useMemo(() => {
    const events: { day: number; type: string; nodeId: number }[] = [];
    const minHeapArray = engine.eventHeap.toArray();
    for (const item of minHeapArray.slice(0, 5)) {
      events.push({
        day: item.key,
        type: item.value.type,
        nodeId: item.value.nodeId,
      });
    }
    return events;
  }, [engine.eventHeap, engine.currentDay]);

  // Hash Map Record for the node
  const record = useMemo(() => {
    return engine.nodeHealth.get(focusedId);
  }, [engine.nodeHealth, focusedId]);

  // Transmission lineage tree branch
  const lineage = useMemo(() => {
    const tree = engine.transmissionTree;
    const treeNode = tree.getNode(focusedId);
    const parentId = treeNode ? treeNode.infectedBy : null;
    const children = treeNode ? treeNode.secondaryInfections : [];
    const seeds = tree.getSeeds();
    return {
      seed: seeds.length > 0 ? seeds[0] : 0,
      parent: parentId,
      self: focusedId,
      children,
    };
  }, [engine.transmissionTree, focusedId]);

  if (isMinimized) {
    return (
      <div className="absolute top-20 right-4 z-40 rounded-full bg-white/90 border border-[#9FA1FF]/40 shadow-xl px-4 py-2 flex items-center space-x-2.5 text-[#444766] font-mono text-xs backdrop-blur-md animate-in fade-in select-none">
        <div className="w-2 h-2 rounded-full bg-[#9192E8] animate-pulse" />
        <Layers className="w-3.5 h-3.5 text-[#9192E8]" />
        <span className="font-bold">DSA X-RAY [P-{String(focusedId).padStart(3, '0')}]</span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-slate-100 rounded-lg text-[#9192E8] cursor-pointer"
          title="Expand X-Ray Inspector"
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
    <div className="absolute top-20 right-4 z-40 w-96 max-h-[calc(100vh-140px)] overflow-y-auto rounded-2xl glass-panel border border-[#9FA1FF]/45 shadow-2xl p-5 text-[#444766] font-mono text-xs space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(159,161,255,0.22)]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-purple-50 border border-[#9FA1FF]/40 text-[#9192E8]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold uppercase tracking-wider text-xs text-[#444766]">
              DSA X-RAY INSPECTOR
            </h3>
            <span className="text-[10px] text-[#787B99]">LIVE DATA STRUCTURE STATE</span>
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

      {/* Target Node Focus Badge */}
      <div className="p-3 rounded-xl bg-white/90 border border-[#9FA1FF]/25 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#787B99] block font-bold">SELECTED PERSON NODE</span>
          <span className="text-sm font-black text-[#9192E8]">
            P-{String(focusedId).padStart(3, '0')}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#787B99] block font-bold">HEALTH STATE</span>
          <span className="font-bold px-2 py-0.5 rounded-lg text-[11px] bg-purple-50 text-[#9192E8] border border-[#9FA1FF]/30">
            {record ? record.state : 'S'}
          </span>
        </div>
      </div>

      {/* 1. GRAPH / ADJACENCY LIST */}
      <div className="p-3.5 rounded-xl bg-white/80 border border-[#9FA1FF]/25 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#444766] font-bold flex items-center space-x-1.5">
            <Network className="w-3.5 h-3.5 text-[#9192E8]" />
            <span>ADJACENCY LIST [DEGREE: {neighbors.length}]</span>
          </span>
          <span className="text-[9px] text-[#787B99]">O(1) Array</span>
        </div>
        <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 text-[11px] text-[#444766] space-y-1">
          <div className="font-bold text-[#9192E8]">
            P-{String(focusedId).padStart(3, '0')}
          </div>
          {neighbors.length === 0 ? (
            <div className="text-[#787B99] pl-3">└── [ Isolated / No Contacts ]</div>
          ) : (
            neighbors.map((nb, idx) => (
              <div
                key={nb}
                onClick={() => onSelectNodeById(nb)}
                className="pl-3 hover:text-[#9192E8] cursor-pointer transition-colors"
              >
                {idx === neighbors.length - 1 ? '└── ' : '├── '}
                <span className="underline decoration-[#9FA1FF]/60 font-semibold">
                  P-{String(nb).padStart(3, '0')}
                </span>
                <span className="text-[9px] text-[#787B99] ml-1.5">(weight: 1.0)</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. BFS QUEUE */}
      <div className="p-3.5 rounded-xl bg-white/80 border border-[#9FA1FF]/25 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#444766] font-bold flex items-center space-x-1.5">
            <ListTree className="w-3.5 h-3.5 text-[#427A54]" />
            <span>BFS QUEUE [FIFO WAVEFRONT]</span>
          </span>
          <span className="text-[9px] text-[#787B99]">O(V + E)</span>
        </div>
        <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 flex flex-wrap gap-1.5 items-center min-h-10">
          <span className="text-[10px] text-[#787B99] mr-1">HEAD &rarr;</span>
          {bfsQueue.length === 0 ? (
            <span className="text-[#787B99] text-[10px]">[ Empty Queue ]</span>
          ) : (
            bfsQueue.map((id) => (
              <span
                key={id}
                onClick={() => onSelectNodeById(id)}
                className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-[#BDEEC8] text-[#427A54] text-[10px] font-bold cursor-pointer hover:bg-emerald-100 transition-all shadow-xs"
              >
                [P-{String(id).padStart(3, '0')}]
              </span>
            ))
          )}
          <span className="text-[10px] text-[#787B99] ml-1">&larr; TAIL</span>
        </div>
      </div>

      {/* 3. PRIORITY QUEUE / MIN-HEAP */}
      <div className="p-3.5 rounded-xl bg-white/80 border border-[#9FA1FF]/25 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#444766] font-bold flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#B47B1E]" />
            <span>MIN-HEAP [EVENT SCHEDULE]</span>
          </span>
          <span className="text-[9px] text-[#787B99]">O(log N)</span>
        </div>
        <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
          {pendingEvents.length === 0 ? (
            <div className="text-[#787B99] text-[10px]">[ No Pending Events ]</div>
          ) : (
            pendingEvents.map((ev, i) => (
              <div key={i} className="flex justify-between items-center text-[10px]">
                <span className="text-[#B47B1E] font-semibold">
                  Day {ev.day} &bull; {ev.type}
                </span>
                <span className="font-bold text-[#444766]">
                  P-{String(ev.nodeId).padStart(3, '0')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. HASH MAP RECORD */}
      <div className="p-3.5 rounded-xl bg-white/80 border border-[#9FA1FF]/25 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#444766] font-bold flex items-center space-x-1.5">
            <Hash className="w-3.5 h-3.5 text-[#9192E8]" />
            <span>HASH MAP [O(1) DIRECT RECORD]</span>
          </span>
          <span className="text-[9px] text-[#787B99]">Key: {focusedId}</span>
        </div>
        <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 text-[10px] space-y-1 text-[#444766]">
          <div>Key: <span className="text-[#9192E8] font-bold">"P-{String(focusedId).padStart(3, '0')}"</span></div>
          <div>Value: &#123;</div>
          <div className="pl-3">state: <span className="text-[#427A54] font-semibold">"{record?.state}"</span>,</div>
          <div className="pl-3">exposedDay: {record?.dayExposed ?? 'null'},</div>
          <div className="pl-3">infectiousDay: {record?.dayInfectious ?? 'null'},</div>
          <div className="pl-3">infectedBy: {record?.infectedBy !== null ? `P-${record?.infectedBy}` : 'null'}</div>
          <div>&#125;</div>
        </div>
      </div>

      {/* 5. TRANSMISSION TREE LINEAGE */}
      <div className="p-3.5 rounded-xl bg-white/80 border border-[#9FA1FF]/25 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#444766] font-bold flex items-center space-x-1.5">
            <GitCommit className="w-3.5 h-3.5 text-rose-500" />
            <span>TRANSMISSION TREE LINEAGE</span>
          </span>
          <span className="text-[9px] text-[#787B99]">DAG</span>
        </div>
        <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 text-[11px] text-[#444766] space-y-1">
          {lineage.parent !== null && (
            <div className="text-[#787B99]">
              Infected By: P-{String(lineage.parent).padStart(3, '0')}
            </div>
          )}
          <div className="font-bold text-[#9192E8] pl-2">
            └── P-{String(lineage.self).padStart(3, '0')} [Current]
          </div>
          {lineage.children.length > 0 ? (
            lineage.children.map((c: number, i: number) => (
              <div key={c} className="pl-6 text-rose-600 font-semibold">
                {i === lineage.children.length - 1 ? '└── ' : '├── '}
                Spread to: P-{String(c).padStart(3, '0')}
              </div>
            ))
          ) : (
            <div className="pl-6 text-[#787B99] text-[10px]">
              └── [ No Downstream Transmissions ]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
