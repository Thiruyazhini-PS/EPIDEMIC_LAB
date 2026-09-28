import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  GitPullRequest,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/SimulationEngine';
import type { TransmissionNode } from '../dataStructures/TransmissionTree';

interface ReplayPageProps {
  engine: SimulationEngine;
}

export const ReplayPage: React.FC<ReplayPageProps> = ({ engine }) => {
  const maxSimulationDay = Math.max(0, engine.snapshots.length - 1);
  const [replayDay, setReplayDay] = useState(maxSimulationDay);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTreeNode, setSelectedTreeNode] = useState<TransmissionNode | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<number[]>([]);

  // Nodes infected up to replayDay
  const treeNodes = useMemo(() => {
    return engine.transmissionTree.filterByDay(replayDay);
  }, [engine.transmissionTree, replayDay]);

  // Compute 2D tree layout coordinates (radial or hierarchical levels)
  const treeLayout = useMemo(() => {
    const width = 850;
    const height = 500;
    const padding = 50;

    // Group by generation level
    const levelMap = new Map<number, TransmissionNode[]>();
    for (const node of treeNodes) {
      const list = levelMap.get(node.generation) || [];
      list.push(node);
      levelMap.set(node.generation, list);
    }

    const maxGen = Math.max(1, ...Array.from(levelMap.keys()));
    const coords = new Map<number, { x: number; y: number }>();

    for (const [gen, nodes] of levelMap.entries()) {
      const x = padding + (gen / maxGen) * (width - 2 * padding);
      const count = nodes.length;
      nodes.forEach((n, idx) => {
        const y = padding + ((idx + 0.5) / count) * (height - 2 * padding);
        coords.set(n.id, { x, y });
      });
    }

    return { coords, width, height };
  }, [treeNodes]);

  // Playback timer
  useEffect(() => {
    let timer: number | null = null;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setReplayDay(prev => {
          if (prev >= maxSimulationDay) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, maxSimulationDay]);

  const handleTraceToSource = (nodeId: number) => {
    const path = engine.transmissionTree.traceToSeed(nodeId);
    setHighlightedPath(path);
  };

  const pathEdges = useMemo(() => {
    const set = new Set<string>();
    if (highlightedPath.length > 1) {
      for (let i = 0; i < highlightedPath.length - 1; i++) {
        set.add(`${highlightedPath[i]}->${highlightedPath[i + 1]}`);
      }
    }
    return set;
  }, [highlightedPath]);

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] flex flex-col justify-between overflow-hidden bg-[#f7f8fe] select-none p-4 md:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[rgba(159,161,255,0.22)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#9192E8] text-white">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#383A59] tracking-tight">
              Phylogenetic Transmission Tree Replay
            </h2>
            <span className="text-[10px] font-bold text-[#427A54] bg-[#D9F9DF] px-2 py-0.5 rounded-full border border-[#BDEEC8]">
              {treeNodes.length} In-Tree Cases
            </span>
          </div>
          <p className="text-xs text-[#787B99] mt-0.5">
            Chronological growth of the outbreak tree from initial seed infection down to leaf cases.
          </p>
        </div>

        {/* Trace button if selected */}
        {selectedTreeNode && (
          <button
            onClick={() => handleTraceToSource(selectedTreeNode.id)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-xs transition-all animate-in fade-in"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>TRACE TO PATIENT ZERO</span>
          </button>
        )}
      </div>

      {/* Hero: Interactive Branching Transmission Tree SVG */}
      <div className="relative flex-1 my-3 glass-panel rounded-3xl p-4 border border-[rgba(159,161,255,0.3)] shadow-sm flex items-center justify-center overflow-auto">
        <svg
          viewBox={`0 0 ${treeLayout.width} ${treeLayout.height}`}
          className="w-full h-full max-h-[560px] preserve-3d"
        >
          {/* Generation Guideline Axis */}
          <line
            x1="50"
            y1={treeLayout.height - 20}
            x2={treeLayout.width - 50}
            y2={treeLayout.height - 20}
            stroke="rgba(159, 161, 255, 0.2)"
            strokeDasharray="4 4"
          />
          <text
            x="50"
            y={treeLayout.height - 8}
            fill="#787B99"
            fontSize="10"
            fontWeight="bold"
          >
            GEN 0 (SEEDS)
          </text>
          <text
            x={treeLayout.width - 50}
            y={treeLayout.height - 8}
            fill="#787B99"
            fontSize="10"
            fontWeight="bold"
            textAnchor="end"
          >
            LATEST WAVE
          </text>

          {/* Tree Branches / Edges */}
          {treeNodes.map((node) => {
            if (node.infectedBy === null) return null;
            const parentCoord = treeLayout.coords.get(node.infectedBy);
            const childCoord = treeLayout.coords.get(node.id);
            if (!parentCoord || !childCoord) return null;

            const isHighlighted = pathEdges.has(`${node.infectedBy}->${node.id}`);

            // Smooth cubic Bezier branch
            const midX = (parentCoord.x + childCoord.x) / 2;
            const pathData = `M ${parentCoord.x} ${parentCoord.y} C ${midX} ${parentCoord.y}, ${midX} ${childCoord.y}, ${childCoord.x} ${childCoord.y}`;

            return (
              <path
                key={`${node.infectedBy}->${node.id}`}
                d={pathData}
                fill="none"
                stroke={isHighlighted ? '#9192E8' : 'rgba(181, 186, 255, 0.45)'}
                strokeWidth={isHighlighted ? 3.5 : 1.5}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            );
          })}

          {/* Tree Nodes */}
          {treeNodes.map((node) => {
            const coord = treeLayout.coords.get(node.id);
            if (!coord) return null;

            const isSelected = selectedTreeNode?.id === node.id;
            const isOnPath = highlightedPath.includes(node.id);
            const isSeed = node.infectedBy === null;

            const fillColor = isSeed ? '#9192E8' : '#AEE2FF';
            const strokeColor = isOnPath || isSelected ? '#9192E8' : '#B5BAFF';
            const radius = isSeed ? 11 : isSelected ? 10 : 8;

            return (
              <g
                key={node.id}
                transform={`translate(${coord.x}, ${coord.y})`}
                onClick={() => setSelectedTreeNode(node)}
                className="cursor-pointer group"
              >
                {/* Glow ring if on path */}
                {(isOnPath || isSelected) && (
                  <circle
                    r={radius + 5}
                    fill="none"
                    stroke="#9192E8"
                    strokeWidth="2"
                    className="animate-ping-soft opacity-60"
                  />
                )}

                <circle
                  r={radius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="transition-all group-hover:scale-125 shadow-sm"
                />

                <text
                  y="3"
                  textAnchor="middle"
                  fill={isSeed ? '#FFFFFF' : '#444766'}
                  fontSize={isSeed ? '8' : '7'}
                  fontWeight="bold"
                >
                  {node.id}
                </text>

                {/* Day label */}
                <text
                  y={radius + 10}
                  textAnchor="middle"
                  fill="#787B99"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  d{node.dayInfected}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Selected Node Info Card */}
        {selectedTreeNode && (
          <div className="absolute right-6 top-6 z-20 glass-panel rounded-2xl p-3 px-4 border border-[#9FA1FF]/40 shadow-lg select-none min-w-[220px]">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[rgba(159,161,255,0.2)]">
              <span className="text-xs font-bold text-[#444766]">
                CASE #{String(selectedTreeNode.id).padStart(3, '0')}
              </span>
              <span className="text-[10px] font-semibold text-[#9192E8] bg-[#9192E8]/10 px-2 py-0.5 rounded-full">
                Gen {selectedTreeNode.generation}
              </span>
            </div>
            <div className="text-[11px] text-[#787B99] space-y-1">
              <div>
                Infected on: <b className="text-[#444766]">Day {selectedTreeNode.dayInfected}</b>
              </div>
              <div>
                Infected by: <b className="text-[#444766]">
                  {selectedTreeNode.infectedBy !== null ? `#${selectedTreeNode.infectedBy}` : 'Patient Zero'}
                </b>
              </div>
              <div>
                Secondary spread: <b className="text-[#9192E8]">{selectedTreeNode.secondaryInfections.length} persons</b>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Chronological Replay Controller */}
      <div className="glass-panel rounded-2xl p-3 px-5 border border-[rgba(159,161,255,0.25)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl transition-all ${
              isPlaying ? 'bg-[#9192E8] text-white shadow-xs' : 'bg-white text-[#444766] hover:bg-[#AEE2FF]/40'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => setReplayDay(prev => Math.min(maxSimulationDay, prev + 1))}
            className="p-2 rounded-xl bg-white text-[#676B8C] hover:text-[#444766]"
          >
            <FastForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setReplayDay(0);
              setHighlightedPath([]);
            }}
            className="p-2 rounded-xl bg-white text-[#676B8C] hover:text-[#9192E8]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="px-3 py-1 rounded-xl bg-white/80 border border-[#9FA1FF]/25 font-mono text-xs">
            <span className="text-[#787B99] mr-1">CHRONO:</span>
            <span className="font-extrabold text-[#444766]">DAY {String(replayDay).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Scrub slider */}
        <div className="w-full md:flex-1 px-4 flex items-center">
          <input
            type="range"
            min={0}
            max={Math.max(1, maxSimulationDay)}
            value={replayDay}
            onChange={(e) => setReplayDay(Number(e.target.value))}
            className="w-full h-2 bg-[#AEE2FF]/50 rounded-lg appearance-none cursor-pointer accent-[#9192E8]"
          />
        </div>

        <div className="text-xs font-mono text-[#787B99]">
          Total Tree Depth: <b className="text-[#444766]">{Math.max(...treeNodes.map(n => n.generation), 0)} Gen</b>
        </div>
      </div>
    </div>
  );
};
