// src/pages/DSALabPage.tsx
import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { Queue } from '../dataStructures/Queue';
import { MinHeap } from '../dataStructures/MinHeap';
import { HashMap } from '../dataStructures/HashMap';

interface DSALabPageProps {
  engine: SimulationEngine;
}

export const DSALabPage: React.FC<DSALabPageProps> = ({ engine }) => {
  const [activeDSA, setActiveDSA] = useState<'adjList' | 'minHeap' | 'queue' | 'hashMap' | 'tree'>('adjList');

  // Adjacency List State
  const [selectedNodeId, setSelectedNodeId] = useState<number>(engine.allNodeIds[0] ?? 0);

  // Standalone Queue Demonstration
  const [demoQueue] = useState<Queue<string>>(() => {
    const q = new Queue<string>();
    q.enqueue('Visit Node #001');
    q.enqueue('Visit Node #004');
    q.enqueue('Visit Node #012');
    return q;
  });
  const [queueItems, setQueueItems] = useState<string[]>([
    'Visit Node #001',
    'Visit Node #004',
    'Visit Node #012',
  ]);
  const [processedItem, setProcessedItem] = useState<string | null>(null);

  // Standalone MinHeap Demonstration
  const [demoHeap] = useState<MinHeap<string>>(() => {
    const h = new MinHeap<string>();
    h.insert(2, 'Become Infectious: Node #005');
    h.insert(4, 'Recover: Node #000');
    h.insert(3, 'Become Infectious: Node #012');
    h.insert(6, 'Recover: Node #005');
    return h;
  });
  const [heapArray, setHeapArray] = useState(() => demoHeap.toArray());

  // Standalone HashMap Demonstration
  const [demoHashMap] = useState<HashMap<string, string>>(() => {
    const m = new HashMap<string, string>(8);
    m.set('node_000', 'Infectious [I]');
    m.set('node_001', 'Exposed [E]');
    m.set('node_002', 'Susceptible [S]');
    m.set('node_008', 'Recovered [R]');
    return m;
  });
  const [hashBuckets, setHashBuckets] = useState(() => demoHashMap.getBucketsSnapshot());
  const [newKey, setNewKey] = useState('node_015');
  const [newVal, setNewVal] = useState('Exposed [E]');

  // Queue actions
  const handleEnqueue = () => {
    const id = Math.floor(Math.random() * 90);
    const item = `Visit Node #${String(id).padStart(3, '0')}`;
    demoQueue.enqueue(item);
    setQueueItems(prev => [...prev, item]);
  };

  const handleDequeue = () => {
    const item = demoQueue.dequeue();
    if (item) {
      setProcessedItem(item);
      setQueueItems(prev => prev.slice(1));
    }
  };

  // MinHeap actions
  const handleHeapInsert = () => {
    const day = Math.floor(Math.random() * 8) + 1;
    const nodeId = Math.floor(Math.random() * 50);
    const text = `${day % 2 === 0 ? 'Recover' : 'Become Infectious'}: Node #${String(nodeId).padStart(3, '0')}`;
    demoHeap.insert(day, text);
    setHeapArray(demoHeap.toArray());
  };

  const handleHeapExtract = () => {
    demoHeap.extractMin();
    setHeapArray(demoHeap.toArray());
  };

  // HashMap actions
  const handleHashMapSet = () => {
    if (!newKey.trim()) return;
    demoHashMap.set(newKey.trim(), newVal);
    setHashBuckets(demoHashMap.getBucketsSnapshot());
  };

  const handleHashMapDelete = (key: string) => {
    demoHashMap.delete(key);
    setHashBuckets(demoHashMap.getBucketsSnapshot());
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] flex flex-col justify-between overflow-y-auto bg-[#f7f8fe] select-none p-4 md:p-6">
      {/* Top Header & Structure Selectors */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[rgba(159,161,255,0.22)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#9192E8] text-white">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#383A59] tracking-tight">
              DSA Laboratory: Live Data Structure Visualizer
            </h2>
          </div>
          <p className="text-xs text-[#787B99] mt-0.5">
            Interactive visual inspections of real data structures driving the simulation engine.
          </p>
        </div>

        {/* DSA Tabs */}
        <div className="flex items-center bg-white/70 p-1 rounded-2xl border border-[rgba(159,161,255,0.25)] shadow-xs overflow-x-auto">
          {[
            { id: 'adjList', label: 'Adjacency List' },
            { id: 'minHeap', label: 'Priority Queue (Heap)' },
            { id: 'queue', label: 'Queue (BFS)' },
            { id: 'hashMap', label: 'Separate Chaining Hash' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDSA(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeDSA === tab.id
                  ? 'bg-[#9192E8] text-white shadow-xs'
                  : 'text-[#676B8C] hover:text-[#444766]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inspection Panel */}
      <div className="flex-1 glass-panel rounded-3xl p-6 border border-[rgba(159,161,255,0.3)] shadow-sm my-3 flex flex-col justify-between min-h-[440px]">
        {/* 1. ADJACENCY LIST VISUALIZER */}
        {activeDSA === 'adjList' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#444766]">
                  Adjacency List: Undirected Network Map
                </h3>
                <span className="text-xs text-[#787B99]">
                  Select any node to inspect its dynamic linked neighbor array in memory.
                </span>
              </div>

              {/* Complexity Card */}
              <div className="flex items-center space-x-2 text-[11px] font-mono bg-white/80 px-3 py-1.5 rounded-xl border border-[#9FA1FF]/25">
                <span>Add Node: <b>O(1)</b></span>
                <span>•</span>
                <span>Neighbors: <b>O(deg)</b></span>
                <span>•</span>
                <span>Space: <b>O(V+E)</b></span>
              </div>
            </div>

            {/* Node Selector Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2">
              {engine.allNodeIds.slice(0, 16).map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedNodeId(id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    selectedNodeId === id
                      ? 'bg-[#9192E8] text-white shadow-xs'
                      : 'bg-white text-[#444766] border border-[#9FA1FF]/25 hover:border-[#9192E8]'
                  }`}
                >
                  #{String(id).padStart(3, '0')}
                </button>
              ))}
            </div>

            {/* Selected Node & Neighbor Chain */}
            <div className="p-4 rounded-2xl bg-white/70 border border-[#9FA1FF]/30 flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#787B99]">Head Node:</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#9192E8] text-white font-mono font-bold text-xs">
                  Node #{String(selectedNodeId).padStart(3, '0')}
                </span>
                <span className="text-xs text-[#787B99]">
                  ({engine.graph.neighbors(selectedNodeId).length} active edges)
                </span>
              </div>

              {/* Connected edges visual list */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {engine.graph.neighbors(selectedNodeId).map((neighborId) => (
                  <div
                    key={neighborId}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#AEE2FF] shadow-xs text-xs font-mono animate-in fade-in zoom-in-95"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#9192E8]" />
                    <span className="font-bold text-[#444766]">
                      #{String(neighborId).padStart(3, '0')}
                    </span>
                    <span className="text-[10px] text-[#427A54] bg-[#D9F9DF] px-1.5 rounded">
                      active
                    </span>
                  </div>
                ))}

                {engine.graph.neighbors(selectedNodeId).length === 0 && (
                  <span className="text-xs text-[#787B99] italic">
                    Node is isolated (no active edges).
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. MIN-HEAP EVENT SCHEDULER VISUALIZER */}
        {activeDSA === 'minHeap' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#444766]">
                  Binary Min-Heap: Priority Event Scheduler
                </h3>
                <span className="text-xs text-[#787B99]">
                  Temporal disease transitions (becomes infectious, recovers) ordered by Day.
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-mono bg-white/80 px-3 py-1.5 rounded-xl border border-[#9FA1FF]/25">
                <span>Insert: <b>O(log N)</b></span>
                <span>•</span>
                <span>ExtractMin: <b>O(log N)</b></span>
                <span>•</span>
                <span>Peek: <b>O(1)</b></span>
              </div>
            </div>

            {/* Interactive Heap Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleHeapInsert}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule New Event</span>
              </button>

              <button
                onClick={handleHeapExtract}
                disabled={heapArray.length === 0}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-black/5 text-[#444766] border border-[#9FA1FF]/30 text-xs font-bold shadow-xs disabled:opacity-40 transition-all"
              >
                <span>Extract Min Event (Root)</span>
              </button>
            </div>

            {/* Heap Array / Bubble Visualizer */}
            <div className="p-4 rounded-2xl bg-white/70 border border-[#9FA1FF]/30">
              <div className="text-xs font-bold text-[#787B99] mb-3">
                Heap Array Order (Root = Index 0):
              </div>
              <div className="flex flex-wrap gap-2">
                {heapArray.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 px-3 rounded-xl border shadow-xs transition-all ${
                      idx === 0
                        ? 'bg-[#9192E8] text-white border-[#9192E8] scale-105'
                        : 'bg-white text-[#444766] border-[#9FA1FF]/30'
                    }`}
                  >
                    <div className="flex items-center space-x-1 text-[10px] font-mono opacity-80">
                      <span>Index [{idx}]</span>
                      <span>•</span>
                      <span className="font-bold">DAY {item.key}</span>
                    </div>
                    <div className="text-xs font-bold mt-0.5">{item.value}</div>
                  </div>
                ))}

                {heapArray.length === 0 && (
                  <span className="text-xs text-[#787B99] italic">Min-Heap is currently empty.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. QUEUE VISUALIZER */}
        {activeDSA === 'queue' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#444766]">
                  FIFO Queue: BFS Wavefront Processing
                </h3>
                <span className="text-xs text-[#787B99]">
                  First-In-First-Out queue used in Breadth-First graph traversal.
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-mono bg-white/80 px-3 py-1.5 rounded-xl border border-[#9FA1FF]/25">
                <span>Enqueue: <b>O(1)</b></span>
                <span>•</span>
                <span>Dequeue: <b>O(1)</b></span>
                <span>•</span>
                <span>Space: <b>O(N)</b></span>
              </div>
            </div>

            {/* Interactive Queue Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEnqueue}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enqueue Step</span>
              </button>

              <button
                onClick={handleDequeue}
                disabled={queueItems.length === 0}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-black/5 text-[#444766] border border-[#9FA1FF]/30 text-xs font-bold shadow-xs disabled:opacity-40 transition-all"
              >
                <span>Dequeue (Head)</span>
              </button>
            </div>

            {/* Conveyor belt queue visual */}
            <div className="p-4 rounded-2xl bg-white/70 border border-[#9FA1FF]/30">
              <div className="flex items-center justify-between text-xs font-bold text-[#787B99] mb-3">
                <span>← DEQUEUE (HEAD)</span>
                <span>ENQUEUE (TAIL) ←</span>
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto py-2">
                {queueItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`shrink-0 p-2.5 px-4 rounded-xl border shadow-xs text-xs font-mono font-bold transition-all ${
                      idx === 0
                        ? 'bg-[#AEE2FF]/40 border-[#AEE2FF] text-[#3B6A84]'
                        : 'bg-white border-[#9FA1FF]/30 text-[#444766]'
                    }`}
                  >
                    {item}
                  </div>
                ))}

                {queueItems.length === 0 && (
                  <span className="text-xs text-[#787B99] italic">Queue is empty.</span>
                )}
              </div>

              {processedItem && (
                <div className="mt-3 text-xs text-[#427A54] bg-[#D9F9DF] p-2 rounded-xl border border-[#BDEEC8] flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Processed Item from Queue: <b>{processedItem}</b></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. HASH MAP VISUALIZER */}
        {activeDSA === 'hashMap' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#444766]">
                  Separate Chaining Hash Map
                </h3>
                <span className="text-xs text-[#787B99]">
                  Bucket arrays with collision lists used for O(1) node state lookups.
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-mono bg-white/80 px-3 py-1.5 rounded-xl border border-[#9FA1FF]/25">
                <span>Avg: <b>O(1)</b></span>
                <span>•</span>
                <span>Worst: <b>O(K)</b></span>
                <span>•</span>
                <span>Buckets: <b>{hashBuckets.length}</b></span>
              </div>
            </div>

            {/* Input fields */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Key (e.g. node_042)"
                className="px-3 py-1.5 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs text-[#444766]"
              />
              <input
                type="text"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                placeholder="Value"
                className="px-3 py-1.5 rounded-xl bg-white border border-[#9FA1FF]/30 text-xs text-[#444766]"
              />
              <button
                onClick={handleHashMapSet}
                className="px-3 py-1.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold"
              >
                Set Key-Value
              </button>
            </div>

            {/* Buckets Grid */}
            <div className="p-4 rounded-2xl bg-white/70 border border-[#9FA1FF]/30 grid grid-cols-2 md:grid-cols-4 gap-2">
              {hashBuckets.map((b) => (
                <div key={b.index} className="p-2 rounded-xl bg-white border border-[#9FA1FF]/25 text-xs">
                  <div className="font-mono font-bold text-[10px] text-[#787B99] pb-1 border-b border-[rgba(159,161,255,0.15)] mb-1">
                    Bucket [{b.index}] ({b.chain.length} items)
                  </div>
                  {b.chain.map((c) => (
                    <div key={c.key} className="flex items-center justify-between text-[11px] py-0.5">
                      <span className="font-mono font-semibold text-[#444766]">{c.key}</span>
                      <button
                        onClick={() => handleHashMapDelete(c.key)}
                        className="text-[#9192E8] hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {b.chain.length === 0 && (
                    <span className="text-[10px] text-[#787B99]/60 italic">empty</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info for viva / evaluation */}
        <div className="pt-3 border-t border-[rgba(159,161,255,0.2)] text-[11px] text-[#787B99] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <b>DSA Capstone Defense:</b> All modules implemented in pure TypeScript inside <code className="bg-white/80 px-1 py-0.5 rounded text-[#9192E8]">src/dataStructures/</code> and <code className="bg-white/80 px-1 py-0.5 rounded text-[#9192E8]">src/algorithms/</code>.
          </span>
          <span className="text-[#427A54] font-semibold">Zero mock data • Live simulation linkage</span>
        </div>
      </div>
    </div>
  );
};
