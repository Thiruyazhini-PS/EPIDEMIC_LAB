// src/pages/CounterfactualPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Scissors,
  UserMinus,
  TrendingDown,
  Sparkles,
  Lock,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { CanvasGraphRenderer } from '../graph/CanvasGraphRenderer';
import { GraphAlgorithms } from '../algorithms/GraphAlgorithms';
import { WhyOutbreakChanged } from '../components/WhyOutbreakChanged';

interface CounterfactualPageProps {
  baselineEngine: SimulationEngine;
}

export const CounterfactualPage: React.FC<CounterfactualPageProps> = ({ baselineEngine }) => {
  const canvasBaselineRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCounterfactualRef = useRef<HTMLCanvasElement | null>(null);

  const baselineRendererRef = useRef<CanvasGraphRenderer | null>(null);
  const counterfactualRendererRef = useRef<CanvasGraphRenderer | null>(null);

  const [counterfactualEngine, setCounterfactualEngine] = useState<SimulationEngine>(() => {
    return baselineEngine.cloneForCounterfactual();
  });

  const [currentDay, setCurrentDay] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [intervention, setIntervention] = useState<'bridge_removed' | 'isolated_hub' | 'contact_reduced'>('bridge_removed');
  const [, setTick] = useState(0);

  // Initialize both canvii and sync states
  useEffect(() => {
    if (!canvasBaselineRef.current || !canvasCounterfactualRef.current) return;

    const dpr = window.devicePixelRatio || 1;

    // Baseline canvas setup
    const c1 = canvasBaselineRef.current;
    const r1 = c1.getBoundingClientRect();
    c1.width = r1.width * dpr;
    c1.height = r1.height * dpr;
    const ren1 = new CanvasGraphRenderer(c1);
    baselineRendererRef.current = ren1;

    // Counterfactual canvas setup
    const c2 = canvasCounterfactualRef.current;
    const r2 = c2.getBoundingClientRect();
    c2.width = r2.width * dpr;
    c2.height = r2.height * dpr;
    const ren2 = new CanvasGraphRenderer(c2);
    counterfactualRendererRef.current = ren2;

    // Build common node list
    const nodeData = baselineEngine.allNodeIds.map(id => ({
      id,
      label: `#${String(id).padStart(3, '0')}`,
      community: id % 3,
    }));

    const baseEdges = baselineEngine.graph.getAllEdges().map(e => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
      isBridge: false,
      disabled: !e.active,
    }));

    const cfEdges = counterfactualEngine.graph.getAllEdges().map(e => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
      isBridge: false,
      disabled: !e.active,
    }));

    const snapBase = baselineEngine.snapshots[0];
    const snapCf = counterfactualEngine.snapshots[0];

    ren1.setData(nodeData, baseEdges, snapBase ? snapBase.nodeStates : new Map());
    ren2.setData(nodeData, cfEdges, snapCf ? snapCf.nodeStates : new Map());

    ren1.start();
    ren2.start();

    return () => {
      ren1.stop();
      ren2.stop();
    };
  }, [baselineEngine, counterfactualEngine]);

  // Synchronized Step function
  const stepBoth = () => {
    if (!baselineEngine.isCompleted) baselineEngine.step();
    if (!counterfactualEngine.isCompleted) counterfactualEngine.step();

    const nextDay = Math.max(baselineEngine.currentDay, counterfactualEngine.currentDay);
    setCurrentDay(nextDay);

    const bSnap = baselineEngine.snapshots[baselineEngine.currentDay];
    const cSnap = counterfactualEngine.snapshots[counterfactualEngine.currentDay];

    if (bSnap && baselineRendererRef.current) {
      baselineRendererRef.current.updateStates(bSnap.nodeStates);
      for (const t of baselineEngine.recentTransmissions) {
        baselineRendererRef.current.spawnTransmissionParticle(t.source, t.target);
      }
    }

    if (cSnap && counterfactualRendererRef.current) {
      counterfactualRendererRef.current.updateStates(cSnap.nodeStates);
      for (const t of counterfactualEngine.recentTransmissions) {
        counterfactualRendererRef.current.spawnTransmissionParticle(t.source, t.target);
      }
    }

    if (baselineEngine.isCompleted && counterfactualEngine.isCompleted) {
      setIsRunning(false);
    }

    setTick(prev => prev + 1);
  };

  // Synchronized run loop
  useEffect(() => {
    let timer: number | null = null;
    if (isRunning) {
      timer = window.setInterval(() => {
        stepBoth();
      }, 400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, baselineEngine, counterfactualEngine]);

  const handleResetBoth = () => {
    setIsRunning(false);
    baselineEngine.reset();
    counterfactualEngine.reset();
    applyIntervention(intervention);
    setCurrentDay(0);
    setTick(prev => prev + 1);
  };

  // Interventions
  const applyIntervention = (type: 'bridge_removed' | 'isolated_hub' | 'contact_reduced') => {
    setIsRunning(false);
    setIntervention(type);

    const freshCf = baselineEngine.cloneForCounterfactual();

    if (type === 'bridge_removed') {
      // Find and remove primary bridge
      const bridges = GraphAlgorithms.findBridges(freshCf.graph, freshCf.allNodeIds);
      if (bridges.length > 0) {
        freshCf.graph.removeEdge(bridges[0].u, bridges[0].v);
      }
    } else if (type === 'isolated_hub') {
      // Isolate the highest degree hub
      const hubs = GraphAlgorithms.findHubs(freshCf.graph, freshCf.allNodeIds, 1);
      if (hubs.length > 0) {
        freshCf.graph.isolateNode(hubs[0].nodeId);
      }
    } else if (type === 'contact_reduced') {
      // Reduce transmission probability by 40%
      freshCf.params.transmissionProbability = freshCf.params.transmissionProbability * 0.6;
    }

    freshCf.reset();
    setCounterfactualEngine(freshCf);
    setCurrentDay(0);
  };

  const bSnap = baselineEngine.snapshots[currentDay] || baselineEngine.snapshots[baselineEngine.snapshots.length - 1];
  const cSnap = counterfactualEngine.snapshots[currentDay] || counterfactualEngine.snapshots[counterfactualEngine.snapshots.length - 1];

  const baseInfected = (bSnap?.iCount || 0) + (bSnap?.rCount || 0) + (bSnap?.eCount || 0);
  const cfInfected = (cSnap?.iCount || 0) + (cSnap?.rCount || 0) + (cSnap?.eCount || 0);

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] flex flex-col justify-between overflow-hidden bg-[#f7f8fe] select-none p-4">
      {/* Top Header & Intervention Selector */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-[rgba(159,161,255,0.22)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#9192E8] text-white">
              <GitBranch className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#383A59] tracking-tight">
              Counterfactual Parallel Laboratory
            </h2>
            <span className="text-[10px] font-bold text-[#9192E8] bg-[#9192E8]/10 px-2 py-0.5 rounded-full border border-[#9192E8]/20">
              SYNCHRONIZED RNG SEED #{baselineEngine.seedNumber}
            </span>
          </div>
          <p className="text-xs text-[#787B99] mt-0.5">
            Same seed, same transmission trials. One surgical change. Observe causal divergence.
          </p>
        </div>

        {/* Surgical Intervention Controls */}
        <div className="flex items-center space-x-2 bg-white/70 p-1.5 rounded-2xl border border-[rgba(159,161,255,0.25)] shadow-xs">
          <span className="text-xs font-semibold text-[#787B99] pl-1.5">Intervention:</span>

          <button
            onClick={() => applyIntervention('bridge_removed')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              intervention === 'bridge_removed'
                ? 'bg-[#9192E8] text-white shadow-xs'
                : 'text-[#444766] hover:bg-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Sever Bridge</span>
          </button>

          <button
            onClick={() => applyIntervention('isolated_hub')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              intervention === 'isolated_hub'
                ? 'bg-[#9192E8] text-white shadow-xs'
                : 'text-[#444766] hover:bg-white'
            }`}
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span>Isolate Top Hub</span>
          </button>

          <button
            onClick={() => applyIntervention('contact_reduced')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              intervention === 'contact_reduced'
                ? 'bg-[#9192E8] text-white shadow-xs'
                : 'text-[#444766] hover:bg-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-40% Virulence</span>
          </button>
        </div>
      </div>

      {/* CENTER: Split Synchronized Networks (Baseline vs Counterfactual) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 my-3 overflow-hidden">
        {/* LEFT: Baseline Network (Immutable) */}
        <div className="relative glass-panel rounded-3xl p-3 border border-[rgba(159,161,255,0.3)] shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-2 px-2 border-b border-[rgba(159,161,255,0.15)] z-10">
            <div className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-[#787B99]" />
              <span className="text-xs font-bold text-[#444766] uppercase tracking-wider">
                Baseline Outbreak (Natural Spread)
              </span>
            </div>
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-[#9192E8] font-bold">{bSnap?.iCount || 0} active</span>
              <span className="text-[#787B99]">|</span>
              <span className="text-[#444766] font-extrabold">{baseInfected} cumulative</span>
            </div>
          </div>

          <div className="relative flex-1 w-full overflow-hidden">
            <canvas
              ref={canvasBaselineRef}
              className="w-full h-full cursor-grab"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* RIGHT: Counterfactual Network (Surgical Intervention) */}
        <div className="relative glass-panel rounded-3xl p-3 border border-[#9192E8]/40 shadow-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-2 px-2 border-b border-[rgba(159,161,255,0.15)] z-10">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9192E8]" />
              <span className="text-xs font-bold text-[#9192E8] uppercase tracking-wider">
                Counterfactual (Post-Surgery)
              </span>
            </div>
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-[#9192E8] font-bold">{cSnap?.iCount || 0} active</span>
              <span className="text-[#787B99]">|</span>
              <span className="text-[#427A54] font-extrabold">{cfInfected} cumulative</span>
            </div>
          </div>

          <div className="relative flex-1 w-full overflow-hidden">
            <canvas
              ref={canvasCounterfactualRef}
              className="w-full h-full cursor-grab"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Path Blocked Floating Annotation */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#D9F9DF]/90 border border-[#BDEEC8] text-[#427A54] shadow-sm backdrop-blur-xs text-xs font-bold animate-in fade-in duration-300">
                <span className="w-2 h-2 rounded-full bg-[#427A54] animate-ping-soft" />
                <span>PATH BLOCKED • Inter-community transmission halted</span>
              </div>
            </div>

            {/* Path Diff comparison bar */}
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
              <div className="glass-panel-subtle rounded-xl p-2.5 px-3 border border-[#9FA1FF]/30 text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="text-[#787B99]">Baseline Path:</span>
                  <span className="text-[#444766] font-semibold">#000 → #004 → #012 → #028</span>
                </div>
                <div className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="text-[#9192E8] font-semibold">Counterfactual:</span>
                  <span className="text-[#427A54] font-bold">#000 → #004 ✕ BLOCKED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM: Shared Timeline & Synchronized Controls + Evidence Chain Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
        {/* Timeline controls */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-3 px-5 border border-[rgba(159,161,255,0.25)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-2 rounded-xl transition-all ${
                isRunning ? 'bg-[#9192E8] text-white shadow-xs' : 'bg-white text-[#444766] hover:bg-[#AEE2FF]/40'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={stepBoth}
              disabled={isRunning}
              className="p-2 rounded-xl bg-white text-[#676B8C] hover:text-[#444766] disabled:opacity-40"
            >
              <FastForward className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetBoth}
              className="p-2 rounded-xl bg-white text-[#676B8C] hover:text-[#9192E8]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="px-3 py-1 rounded-xl bg-white/80 border border-[#9FA1FF]/25 font-mono text-xs">
              <span className="text-[#787B99] font-medium mr-1">DAY</span>
              <span className="font-extrabold text-[#444766]">{String(currentDay).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Counts Diff Badge */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-[#787B99]">Prevented Cases</div>
              <div className="text-sm font-extrabold text-[#427A54] font-mono">
                +{Math.max(0, baseInfected - cfInfected)} Cases Averted
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#D9F9DF] text-[#427A54] font-bold text-xs border border-[#BDEEC8]">
              {baseInfected > 0 ? Math.round(((baseInfected - cfInfected) / baseInfected) * 100) : 0}% Drop
            </div>
          </div>
        </div>

        {/* Why did outbreak change? Evidence chain */}
        <div className="lg:col-span-1">
          <WhyOutbreakChanged
            baselineInfected={baseInfected}
            counterfactualInfected={cfInfected}
            interventionType={intervention}
          />
        </div>
      </div>
    </div>
  );
};
