// src/pages/LandingPage.tsx
import React, { useEffect, useRef } from 'react';
import {
  Scissors,
  GitBranch,
  Clock,
  ArrowRight,
  Sparkles,
  Activity,
} from 'lucide-react';
import { CanvasGraphRenderer } from '../graph/CanvasGraphRenderer';
import { NetworkGenerator } from '../graph/NetworkGenerator';
import { SeededRNG } from '../utils/SeededRNG';
import type { HealthState } from '../simulation/DiseaseModel';

interface LandingPageProps {
  onEnterLab: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterLab, onExploreDemo }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasGraphRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Set high-DPI canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const renderer = new CanvasGraphRenderer(canvas);
    rendererRef.current = renderer;

    // Generate small, lively showcase network
    const rng = new SeededRNG(101);
    const { nodes, edges } = NetworkGenerator.generateClusteredNetwork(42, 3, 0.12, rng);

    // Initial states: mix of S, E, I, R
    const initialStates = new Map<number, HealthState>();
    for (const n of nodes) {
      if (n.id === 0 || n.id === 14) initialStates.set(n.id, 'I');
      else if (n.id === 1 || n.id === 15 || n.id === 28) initialStates.set(n.id, 'E');
      else if (n.id === 5 || n.id === 20) initialStates.set(n.id, 'R');
      else initialStates.set(n.id, 'S');
    }

    renderer.setData(
      nodes,
      edges.map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight ?? 1.0,
        isBridge: !!e.isBridge,
      })),
      initialStates
    );

    renderer.start();

    // Spawn periodic animated transmission particles for eye candy
    const particleInterval = setInterval(() => {
      if (edges.length > 0) {
        const randomEdge = edges[Math.floor(Math.random() * edges.length)];
        renderer.spawnTransmissionParticle(randomEdge.source, randomEdge.target);
      }
    }, 900);

    return () => {
      clearInterval(particleInterval);
      renderer.stop();
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#f7f8fe] via-[#f2f4ff] to-[#edf1fe]">
      {/* Background scientific decorative circles */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#AEE2FF]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#B5BAFF]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#9FA1FF] to-[#D9F9DF] p-[1.5px] shadow-sm">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#9192E8]" />
            </div>
          </div>
          <span className="font-extrabold text-sm tracking-wider text-[#444766] uppercase">
            EPIDEMIC LAB
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onExploreDemo}
            className="px-4 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-semibold text-[#787B99] hover:text-[#9192E8] border border-[#9FA1FF]/30 transition-all shadow-xs cursor-pointer"
          >
            Guided Story
          </button>
          <button
            onClick={onEnterLab}
            className="px-5 py-1.5 rounded-full bg-[#9192E8] hover:bg-[#8384e5] text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
          >
            Launch Lab
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-6xl mx-auto w-full py-6">
        {/* Animated Hero Canvas */}
        <div className="relative w-full h-[320px] md:h-[400px] mb-4 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Central Overlay Typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/85 border border-[#9FA1FF]/30 shadow-xs mb-3 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#9192E8] animate-ping-soft" />
              <span className="text-[11px] font-bold text-[#787B99] uppercase tracking-widest">
                Network Surgery & Counterfactual Simulator
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-[#383A59] tracking-tight leading-tight max-w-3xl drop-shadow-xs">
              EPIDEMIC LAB
            </h1>

            <p className="mt-2 text-sm md:text-base text-[#676B8C] max-w-xl font-medium">
              Experiment on the network. Trace the outbreak. Change the outcome.
            </p>

            {/* CTAs */}
            <div className="mt-5 flex items-center space-x-3 pointer-events-auto">
              <button
                onClick={onEnterLab}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#9192E8] hover:bg-[#8384e5] text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>ENTER LAB</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreDemo}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-white/90 hover:bg-white text-[#444766] border border-[#9FA1FF]/35 text-sm font-semibold shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#9192E8]" />
                <span>EXPLORE DEMO</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Compact Features Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-4xl mt-2">
          {/* Feature 1 */}
          <div className="glass-panel rounded-2xl p-4 border border-[#9FA1FF]/25 hover:border-[#9192E8]/40 transition-all shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#9192E8]/15 text-[#9192E8] flex items-center justify-center mb-2.5">
              <Scissors className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#444766] uppercase tracking-wide mb-1">
              Network Surgery
            </h3>
            <p className="text-[12px] text-[#787B99] leading-relaxed">
              Cut structural bridges with Tarjan’s algorithm, isolate superspreader hubs, and observe communities partition.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel rounded-2xl p-4 border border-[#9FA1FF]/25 hover:border-[#9192E8]/40 transition-all shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#AEE2FF]/40 text-[#3B6A84] flex items-center justify-center mb-2.5">
              <GitBranch className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#444766] uppercase tracking-wide mb-1">
              Counterfactual Lab
            </h3>
            <p className="text-[12px] text-[#787B99] leading-relaxed">
              Run synchronized parallel realities under identical seeded RNG. Identify blocked paths and prevented cases.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel rounded-2xl p-4 border border-[#9FA1FF]/25 hover:border-[#9192E8]/40 transition-all shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#D9F9DF] text-[#427A54] flex items-center justify-center mb-2.5">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#444766] uppercase tracking-wide mb-1">
              Transmission Replay
            </h3>
            <p className="text-[12px] text-[#787B99] leading-relaxed">
              Step backwards and forwards along the phylogenetic infection tree. Trace any secondary infection directly back to seed.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 px-6 text-center text-[11px] text-[#787B99] z-20 border-t border-[rgba(159,161,255,0.15)] bg-white/40">
        EPIDEMIC LAB • Data Structures & Algorithms Capstone • Min-Heap • Adjacency List • Tarjan Bridges
      </footer>
    </div>
  );
};
