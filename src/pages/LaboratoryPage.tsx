// src/pages/LaboratoryPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Users,
  Zap,
  Share2,
  Dot,
  RotateCcw,
  Scissors,
  Network,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CanvasGraphRenderer } from '../graph/CanvasGraphRenderer';
import type { VisualNode, VisualEdge } from '../graph/CanvasGraphRenderer';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { NetworkGenerator } from '../graph/NetworkGenerator';
import { GraphAlgorithms } from '../algorithms/GraphAlgorithms';
import type { BridgeEdge, HubResult, ComponentResult } from '../algorithms/GraphAlgorithms';
import { FloatingKPIs } from '../components/FloatingKPIs';
import { TimelineScrubber } from '../components/TimelineScrubber';
import { FloatingNodePanel } from '../components/FloatingNodePanel';
import { FloatingEdgeToolbar } from '../components/FloatingEdgeToolbar';
import { StructuralAnalysisModal } from '../components/StructuralAnalysisModal';

import type { PatientRegistry } from '../dataStructures/PatientRegistry';

interface LaboratoryPageProps {
  engine: SimulationEngine;
  isSurgeryMode?: boolean;
  onToggleSurgeryMode?: () => void;
  onNavigateToCounterfactual?: () => void;
  patientRegistry?: PatientRegistry;
  onNavigateToSurveillance?: (nodeId?: number) => void;
  user?: { name: string; nodeId?: number } | null;
  onNavigateToMedical?: () => void;
  initialFocusNodeId?: number | null;
}

export const LaboratoryPage: React.FC<LaboratoryPageProps> = ({
  engine,
  isSurgeryMode = false,
  onToggleSurgeryMode,
  onNavigateToCounterfactual,
  patientRegistry,
  onNavigateToSurveillance,
  user,
  onNavigateToMedical,
  initialFocusNodeId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasGraphRenderer | null>(null);

  // UI state
  const [tick, setTick] = useState(0);
  const [selectedNode, setSelectedNode] = useState<VisualNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ edge: VisualEdge; pos: { x: number; y: number } } | null>(null);
  const [showStructuralAnalysis, setShowStructuralAnalysis] = useState(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState(true);
  const [activeAlgorithmLabel, setActiveAlgorithmLabel] = useState<string | null>(null);

  // Parameters state
  const [population, setPopulation] = useState(engine.params.populationSize);
  const [beta, setBeta] = useState(engine.params.transmissionProbability);
  const [density, setDensity] = useState(engine.params.contactDensity);
  const [seedCount, setSeedCount] = useState(engine.params.initialSeeds);
  const [simSpeed, setSimSpeed] = useState(engine.params.speed);

  // Sync simulation updates to canvas
  const handleSimUpdate = useCallback((sim: SimulationEngine) => {
    if (!rendererRef.current) return;
    const snap = sim.snapshots[sim.currentDay];
    if (snap) {
      rendererRef.current.updateStates(snap.nodeStates);
    }

    // Trigger visual particles for newly infected nodes
    for (const t of sim.recentTransmissions) {
      rendererRef.current.spawnTransmissionParticle(t.source, t.target);
    }

    setTick(prev => prev + 1);
  }, []);

  // Initialize network & canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const renderer = new CanvasGraphRenderer(canvas);
    rendererRef.current = renderer;

    // Hook simulation callback
    engine.onUpdate = handleSimUpdate;

    // Generate network if engine is empty
    if (engine.allNodeIds.length === 0) {
      const net = NetworkGenerator.generateClusteredNetwork(population, 3, density, engine.rng);
      engine.initialize(
        net.nodes.map(n => n.id),
        net.graph,
        undefined,
        {
          populationSize: population,
          transmissionProbability: beta,
          contactDensity: density,
          initialSeeds: seedCount,
          speed: simSpeed,
        }
      );

      const snap0 = engine.snapshots[0];
      renderer.setData(
        net.nodes,
        net.edges.map(e => ({
          source: e.source,
          target: e.target,
          weight: e.weight ?? 1.0,
          isBridge: !!e.isBridge,
        })),
        snap0.nodeStates
      );
    } else {
      // Re-populate existing
      const nodeData = engine.allNodeIds.map(id => ({
        id,
        label: `#${String(id).padStart(3, '0')}`,
        community: id % 3,
      }));
      const edges = engine.graph.getAllEdges().map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        isBridge: false,
        disabled: !e.active,
      }));
      const curSnap = engine.snapshots[engine.currentDay] || engine.snapshots[0];
      renderer.setData(nodeData, edges, curSnap ? curSnap.nodeStates : new Map());
    }

    renderer.options.surgeryMode = isSurgeryMode;
    renderer.options.userNodeId = user?.nodeId;
    if (initialFocusNodeId !== undefined && initialFocusNodeId !== null) {
      renderer.options.focusedNodeId = initialFocusNodeId;
    }

    // Interaction callbacks
    renderer.onNodeSelect = (node) => {
      setSelectedNode(node);
      setSelectedEdge(null);
    };

    renderer.onEdgeSelect = (edge, clientPos) => {
      if (edge) {
        setSelectedEdge({ edge, pos: clientPos });
        setSelectedNode(null);
      } else {
        setSelectedEdge(null);
      }
    };

    renderer.start();

    return () => {
      renderer.stop();
      engine.onUpdate = undefined;
    };
  }, [engine, handleSimUpdate, isSurgeryMode, user?.nodeId, initialFocusNodeId]);

  // Update surgery & user styling mode
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.options.surgeryMode = isSurgeryMode;
      rendererRef.current.options.userNodeId = user?.nodeId;
      if (initialFocusNodeId !== undefined && initialFocusNodeId !== null) {
        rendererRef.current.options.focusedNodeId = initialFocusNodeId;
      }
    }
  }, [isSurgeryMode, user?.nodeId, initialFocusNodeId]);

  // Topology metrics
  const graphMetrics = React.useMemo(() => {
    return GraphAlgorithms.computeMetrics(engine.graph, engine.allNodeIds);
  }, [engine.graph, engine.allNodeIds, tick]);

  const bridges: BridgeEdge[] = React.useMemo(() => {
    return GraphAlgorithms.findBridges(engine.graph, engine.allNodeIds);
  }, [engine.graph, engine.allNodeIds, tick]);

  const hubs: HubResult[] = React.useMemo(() => {
    return GraphAlgorithms.findHubs(engine.graph, engine.allNodeIds, 6);
  }, [engine.graph, engine.allNodeIds, tick]);

  const components: ComponentResult[] = React.useMemo(() => {
    return GraphAlgorithms.findConnectedComponents(engine.graph, engine.allNodeIds);
  }, [engine.graph, engine.allNodeIds, tick]);

  // Regeneration of graph with current slider params
  const handleRegenerate = () => {
    const net = NetworkGenerator.generateClusteredNetwork(population, 3, density, engine.rng);
    engine.initialize(
      net.nodes.map(n => n.id),
      net.graph,
      undefined,
      {
        populationSize: population,
        transmissionProbability: beta,
        contactDensity: density,
        initialSeeds: seedCount,
        speed: simSpeed,
      }
    );
    if (rendererRef.current) {
      const snap0 = engine.snapshots[0];
      rendererRef.current.setData(
        net.nodes,
        net.edges.map(e => ({
          source: e.source,
          target: e.target,
          weight: e.weight ?? 1.0,
          isBridge: !!e.isBridge,
        })),
        snap0.nodeStates
      );
    }
    setSelectedNode(null);
    setSelectedEdge(null);
    setActiveAlgorithmLabel(null);
    setTick(prev => prev + 1);
  };

  // Surgery Handlers
  const handleRemoveEdge = (u: number, v: number) => {
    engine.graph.removeEdge(u, v);
    if (rendererRef.current) {
      const edges = engine.graph.getAllEdges().map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        isBridge: false,
        disabled: !e.active,
      }));
      const curSnap = engine.snapshots[engine.currentDay];
      const nodeData = engine.allNodeIds.map(id => ({
        id,
        label: `#${String(id).padStart(3, '0')}`,
        community: id % 3,
      }));
      rendererRef.current.setData(nodeData, edges, curSnap ? curSnap.nodeStates : new Map());
    }
    setSelectedEdge(null);
    setTick(prev => prev + 1);
  };

  const handleDisableEdge = (u: number, v: number) => {
    engine.graph.disableEdge(u, v);
    if (rendererRef.current) {
      const edges = engine.graph.getAllEdges().map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        isBridge: false,
        disabled: !e.active,
      }));
      const curSnap = engine.snapshots[engine.currentDay];
      const nodeData = engine.allNodeIds.map(id => ({
        id,
        label: `#${String(id).padStart(3, '0')}`,
        community: id % 3,
      }));
      rendererRef.current.setData(nodeData, edges, curSnap ? curSnap.nodeStates : new Map());
    }
    setSelectedEdge(null);
    setTick(prev => prev + 1);
  };

  const handleRestoreEdge = (u: number, v: number) => {
    engine.graph.restoreEdge(u, v);
    if (rendererRef.current) {
      const edges = engine.graph.getAllEdges().map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        isBridge: false,
        disabled: !e.active,
      }));
      const curSnap = engine.snapshots[engine.currentDay];
      const nodeData = engine.allNodeIds.map(id => ({
        id,
        label: `#${String(id).padStart(3, '0')}`,
        community: id % 3,
      }));
      rendererRef.current.setData(nodeData, edges, curSnap ? curSnap.nodeStates : new Map());
    }
    setSelectedEdge(null);
    setTick(prev => prev + 1);
  };

  const handleRewireEdge = (u: number, v: number) => {
    // Rewire to a random alternative node
    const candidates = engine.allNodeIds.filter(id => id !== u && id !== v && !engine.graph.hasEdge(u, id));
    if (candidates.length > 0) {
      const newTarget = candidates[Math.floor(Math.random() * candidates.length)];
      engine.graph.rewireEdge(u, v, newTarget, 1.0);
      handleRegenerate();
    }
    setSelectedEdge(null);
  };

  const handleIsolateNode = (nodeId: number) => {
    engine.graph.isolateNode(nodeId);
    handleRegenerate();
    setSelectedNode(null);
  };

  // Algorithm Visual Solvers
  const handleFindBridges = () => {
    const bridgeSet = new Set<string>();
    for (const b of bridges) {
      bridgeSet.add(`${b.u}-${b.v}`);
      bridgeSet.add(`${b.v}-${b.u}`);
    }
    if (rendererRef.current) {
      rendererRef.current.options.highlightedBridges = bridgeSet;
      rendererRef.current.options.highlightedPath = undefined;
      rendererRef.current.options.traversalOrder = undefined;
    }
    setActiveAlgorithmLabel(`Tarjan Bridges (${bridges.length})`);
    setTick(prev => prev + 1);
  };

  const handleFindHubs = () => {
    const topHub = hubs[0];
    if (topHub && rendererRef.current) {
      rendererRef.current.options.focusedNodeId = topHub.nodeId;
      rendererRef.current.options.highlightedBridges = undefined;
      rendererRef.current.options.highlightedPath = undefined;
      rendererRef.current.options.traversalOrder = undefined;
    }
    setActiveAlgorithmLabel(`Hubs Identified (Top #${hubs[0]?.nodeId})`);
    setTick(prev => prev + 1);
  };

  const handleFindComponents = () => {
    setActiveAlgorithmLabel(`${components.length} Disjoint Components`);
  };

  const handleRunBFS = (startId?: number) => {
    const start = startId ?? engine.initialSeedIds[0] ?? 0;
    const steps = GraphAlgorithms.bfs(engine.graph, start);
    const orderMap = new Map<number, number>();
    steps.forEach((s) => orderMap.set(s.nodeId, s.order));

    if (rendererRef.current) {
      rendererRef.current.options.traversalOrder = orderMap;
      rendererRef.current.options.highlightedBridges = undefined;
      rendererRef.current.options.highlightedPath = undefined;
    }
    setActiveAlgorithmLabel(`BFS Wave: ${steps.length} Nodes Visited`);
    setTick(prev => prev + 1);
  };

  const handleRunDFS = (startId?: number) => {
    const start = startId ?? engine.initialSeedIds[0] ?? 0;
    const steps = GraphAlgorithms.dfs(engine.graph, start);
    const orderMap = new Map<number, number>();
    steps.forEach((s) => orderMap.set(s.nodeId, s.order));

    if (rendererRef.current) {
      rendererRef.current.options.traversalOrder = orderMap;
      rendererRef.current.options.highlightedBridges = undefined;
      rendererRef.current.options.highlightedPath = undefined;
    }
    setActiveAlgorithmLabel(`DFS Trail: ${steps.length} Nodes Visited`);
    setTick(prev => prev + 1);
  };

  const handleFindShortestPath = (sourceId?: number, targetId?: number) => {
    const start = sourceId ?? engine.initialSeedIds[0] ?? 0;
    const target = targetId ?? (hubs[0] ? hubs[0].nodeId : engine.allNodeIds[engine.allNodeIds.length - 1]);
    const path = GraphAlgorithms.shortestPath(engine.graph, start, target);

    if (rendererRef.current) {
      rendererRef.current.options.highlightedPath = path;
      rendererRef.current.options.highlightedBridges = undefined;
      rendererRef.current.options.traversalOrder = undefined;
    }
    setActiveAlgorithmLabel(`Shortest Path (${path.length} hops)`);
    setTick(prev => prev + 1);
  };

  const handleClearHighlights = () => {
    if (rendererRef.current) {
      rendererRef.current.options.highlightedBridges = undefined;
      rendererRef.current.options.highlightedPath = undefined;
      rendererRef.current.options.traversalOrder = undefined;
      rendererRef.current.options.focusedNodeId = null;
    }
    setActiveAlgorithmLabel(null);
    setTick(prev => prev + 1);
  };

  // Timeline scrubber scrub action
  const handleScrub = (day: number) => {
    const snap = engine.getSnapshotAt(day);
    if (snap && rendererRef.current) {
      engine.currentDay = day;
      rendererRef.current.updateStates(snap.nodeStates);
      setTick(prev => prev + 1);
    }
  };

  return (
    <div className={`relative flex-1 w-full h-[calc(100vh-64px)] flex overflow-hidden select-none ${isSurgeryMode ? 'bg-[#ebedfa]' : 'bg-[#f7f8fe]'}`}>
      {/* Network Surgery Dimming Overlay Notice */}
      {isSurgeryMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-white/95 border border-[#9192E8] shadow-lg">
            <Scissors className="w-4 h-4 text-[#9192E8] animate-pulse-subtle" />
            <span className="text-xs font-bold text-[#444766] uppercase tracking-wider">
              Network Surgery Mode Active
            </span>
            <span className="text-xs text-[#787B99] hidden sm:inline">
              • Click any contact edge to Remove, Rewire, or Disable
            </span>
            {onToggleSurgeryMode && (
              <button
                onClick={onToggleSurgeryMode}
                className="ml-2 px-2.5 py-1 rounded-lg bg-[#9192E8] hover:bg-[#8384e5] text-white text-[11px] font-semibold"
              >
                Exit Surgery
              </button>
            )}
          </div>
        </div>
      )}

      {/* LEFT: Experiment Parameter Controls Panel */}
      <aside
        className={`absolute lg:relative z-20 h-full flex flex-col justify-between glass-panel border-r border-[rgba(159,161,255,0.22)] transition-all duration-300 ${
          showControlsDrawer ? 'w-72 p-4' : 'w-0 p-0 overflow-hidden'
        } ${isSurgeryMode ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Controls Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(159,161,255,0.2)]">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#9192E8]" />
              <h3 className="text-xs font-bold text-[#444766] uppercase tracking-wider">
                Laboratory Controls
              </h3>
            </div>
            <button
              onClick={() => handleRegenerate()}
              className="p-1 rounded-lg hover:bg-white/80 text-[#787B99] hover:text-[#9192E8] transition-colors"
              title="Regenerate Network"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1. Population Size Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center space-x-1.5 font-semibold text-[#444766]">
                <Users className="w-3.5 h-3.5 text-[#9192E8]" />
                <span>Population (Nodes)</span>
              </span>
              <span className="font-mono font-bold text-[#9192E8]">{population}</span>
            </div>
            <input
              type="range"
              min={30}
              max={150}
              step={5}
              value={population}
              onChange={(e) => setPopulation(Number(e.target.value))}
              className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
            />
            <div className="flex justify-between text-[10px] text-[#787B99]">
              <span>30 (Sparse)</span>
              <span>150 (Dense)</span>
            </div>
          </div>

          {/* 2. Transmission Probability (Beta) with particles */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center space-x-1.5 font-semibold text-[#444766]">
                <Zap className="w-3.5 h-3.5 text-[#9192E8]" />
                <span>Transmission (β)</span>
              </span>
              <span className="font-mono font-bold text-[#9192E8]">
                {Math.round(beta * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.9}
              step={0.05}
              value={beta}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBeta(val);
                engine.params.transmissionProbability = val;
              }}
              className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
            />
            <div className="flex justify-between text-[10px] text-[#787B99]">
              <span>5% Low</span>
              <span>90% Virulent</span>
            </div>
          </div>

          {/* 3. Contact Density */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center space-x-1.5 font-semibold text-[#444766]">
                <Share2 className="w-3.5 h-3.5 text-[#9192E8]" />
                <span>Contact Density</span>
              </span>
              <span className="font-mono font-bold text-[#9192E8]">
                {Math.round(density * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.03}
              max={0.25}
              step={0.01}
              value={density}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDensity(val);
                engine.params.contactDensity = val;
              }}
              className="w-full h-1.5 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
            />
          </div>

          {/* 4. Seed Patients Count */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center space-x-1.5 font-semibold text-[#444766]">
                <Dot className="w-4 h-4 text-[#9192E8]" />
                <span>Patient Zero (Seeds)</span>
              </span>
              <span className="font-mono font-bold text-[#9192E8]">{seedCount}</span>
            </div>
            <div className="flex space-x-2">
              {[1, 2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeedCount(s)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                    seedCount === s
                      ? 'bg-[#9192E8] text-white border-[#9192E8]'
                      : 'bg-white/80 text-[#444766] border-[#9FA1FF]/25 hover:border-[#9192E8]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Apply / Regenerate Button */}
          <button
            onClick={handleRegenerate}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9FA1FF] to-[#9192E8] hover:from-[#9192E8] hover:to-[#8384e5] text-white text-xs font-bold shadow-sm transition-all"
          >
            Apply & Rebuild Network
          </button>

          {/* Topology Tools Shortcut */}
          <button
            onClick={() => setShowStructuralAnalysis(!showStructuralAnalysis)}
            className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-white/80 hover:bg-white text-xs font-semibold text-[#444766] border border-[#9FA1FF]/30 shadow-xs"
          >
            <Network className="w-3.5 h-3.5 text-[#9192E8]" />
            <span>Structural Analysis & DSA</span>
          </button>
        </div>

        {/* Counterfactual quick CTA */}
        {onNavigateToCounterfactual && (
          <div className="pt-3 border-t border-[rgba(159,161,255,0.2)]">
            <button
              onClick={onNavigateToCounterfactual}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-[#D9F9DF]/80 hover:bg-[#D9F9DF] border border-[#BDEEC8] text-[11px] font-bold text-[#427A54] transition-all"
            >
              <span>Fork Counterfactual Run</span>
              <span>→</span>
            </button>
          </div>
        )}
      </aside>

      {/* Drawer toggle button for mobile/compact */}
      <button
        onClick={() => setShowControlsDrawer(!showControlsDrawer)}
        className="absolute left-2 top-2 z-30 p-1.5 rounded-xl bg-white/80 border border-[#9FA1FF]/30 text-[#444766] hover:bg-white shadow-xs"
        title="Toggle Controls Panel"
      >
        {showControlsDrawer ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* CENTER: Canvas Network Taking 65-70% of Viewport */}
      <main className="relative flex-1 h-full overflow-hidden flex flex-col justify-between">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ width: '100%', height: '100%' }}
        />

        {/* TOP LEFT: Authenticated Subject Live Simulation Linkage Badge */}
        {user?.nodeId !== undefined && (
          <div className="absolute top-4 left-14 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-2xl bg-white/95 border border-[#9192E8] shadow-md backdrop-blur-md text-xs">
              <span className="w-2 h-2 rounded-full bg-[#9192E8] animate-pulse" />
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#383A59]">YOU: {user.name}</span>
                <span className="font-mono px-1.5 py-0.5 rounded-md bg-[#9192E8] text-white font-bold text-[10px]">
                  NODE #{String(user.nodeId).padStart(3, '0')}
                </span>
                <span className="text-[10.5px] font-semibold text-[#787B99]">
                  State: [{engine.nodeHealth.get(user.nodeId)?.state || 'S'}]
                </span>
              </div>
              {onNavigateToMedical && (
                <button
                  onClick={onNavigateToMedical}
                  className="px-2 py-0.5 rounded-lg bg-[#9FA1FF]/20 hover:bg-[#9FA1FF]/30 text-[#444766] font-bold text-[10px] transition-all cursor-pointer"
                >
                  Health Vault →
                </button>
              )}
            </div>
          </div>
        )}

        {/* TOP RIGHT: Floating State Monitor KPIs */}
        <div className={`absolute top-4 right-4 z-20 transition-opacity ${isSurgeryMode ? 'opacity-30 pointer-events-none' : ''}`}>
          <FloatingKPIs
            currentSnapshot={engine.snapshots[engine.currentDay]}
            totalPopulation={engine.allNodeIds.length}
            communityCount={components.length}
            density={graphMetrics.density}
            recentSnapshots={engine.snapshots}
          />
        </div>

        {/* BOTTOM: Draggable Timeline Scrubber */}
        <div className={`absolute bottom-4 inset-x-4 md:inset-x-8 z-20 transition-opacity ${isSurgeryMode ? 'opacity-40 pointer-events-none' : ''}`}>
          <TimelineScrubber
            currentDay={engine.currentDay}
            totalDaysRecorded={engine.snapshots.length}
            snapshots={engine.snapshots}
            onScrub={handleScrub}
            isRunning={engine.isRunning}
            onToggleRun={() => {
              if (engine.isRunning) engine.pause();
              else engine.run();
            }}
            onStep={() => engine.step()}
            onReset={() => engine.reset()}
            speed={simSpeed}
            onSpeedChange={(newSpeed) => {
              setSimSpeed(newSpeed);
              engine.params.speed = newSpeed;
            }}
          />
        </div>

        {/* FLOATING SELECTED NODE DETAILS PANEL */}
        {selectedNode && (
          <div className="absolute left-6 top-16 z-40">
            <FloatingNodePanel
              node={selectedNode}
              healthRecord={engine.nodeHealth.get(selectedNode.id)}
              patientRecord={patientRegistry?.getById(selectedNode.id)}
              neighbors={engine.graph.neighbors(selectedNode.id)}
              secondaryInfectionCount={
                engine.transmissionTree.getNode(selectedNode.id)?.secondaryInfections.length || 0
              }
              onClose={() => setSelectedNode(null)}
              onIsolateNode={handleIsolateNode}
              onTracePathToSeed={(id) => {
                const path = engine.transmissionTree.traceToSeed(id);
                if (rendererRef.current) {
                  rendererRef.current.options.highlightedPath = path;
                }
                setActiveAlgorithmLabel(`Phylogenetic Path (${path.length} hops)`);
                setTick(prev => prev + 1);
              }}
              onBfsFromNode={(id) => handleRunBFS(id)}
              onViewPatientRecord={(id) => {
                if (onNavigateToSurveillance) {
                  onNavigateToSurveillance(id);
                }
              }}
            />
          </div>
        )}

        {/* FLOATING SURGERY EDGE TOOLBAR */}
        {selectedEdge && (
          <FloatingEdgeToolbar
            edge={selectedEdge.edge}
            position={selectedEdge.pos}
            onRemove={handleRemoveEdge}
            onDisable={handleDisableEdge}
            onRestore={handleRestoreEdge}
            onRewire={handleRewireEdge}
            onClose={() => setSelectedEdge(null)}
          />
        )}

        {/* FLOATING STRUCTURAL ANALYSIS MODAL */}
        {showStructuralAnalysis && (
          <div className="absolute right-6 top-16 z-40">
            <StructuralAnalysisModal
              nodeCount={graphMetrics.nodes}
              edgeCount={graphMetrics.edges}
              density={graphMetrics.density}
              avgDegree={graphMetrics.avgDegree}
              bridges={bridges}
              hubs={hubs}
              components={components}
              activeAlgorithmLabel={activeAlgorithmLabel}
              onFindBridges={handleFindBridges}
              onFindHubs={handleFindHubs}
              onFindComponents={handleFindComponents}
              onRunBFS={() => handleRunBFS()}
              onRunDFS={() => handleRunDFS()}
              onFindShortestPath={() => handleFindShortestPath()}
              onClearHighlights={handleClearHighlights}
            />
          </div>
        )}
      </main>
    </div>
  );
};
