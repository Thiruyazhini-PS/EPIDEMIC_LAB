// src/components/TimelineScrubber.tsx
import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Activity } from 'lucide-react';
import type { DaySnapshot } from '../simulation/SimulationEngine';

interface TimelineScrubberProps {
  currentDay: number;
  totalDaysRecorded: number;
  snapshots: DaySnapshot[];
  onScrub: (day: number) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentDay,
  totalDaysRecorded,
  snapshots,
  onScrub,
  isRunning,
  onToggleRun,
  onStep,
  onReset,
  speed,
  onSpeedChange,
}) => {
  const maxDay = Math.max(0, totalDaysRecorded - 1);
  const currentSnap = snapshots[currentDay];

  return (
    <div className="w-full glass-panel rounded-2xl p-3 px-5 border border-[rgba(159,161,255,0.28)] shadow-md select-none">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Playback Controls & Metrics Pill */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-1.5 bg-white/70 p-1 rounded-xl border border-[rgba(159,161,255,0.25)]">
            <button
              onClick={onToggleRun}
              className={`p-2 rounded-lg transition-all ${
                isRunning
                  ? 'bg-[#9192E8] text-white shadow-sm'
                  : 'bg-white text-[#444766] hover:bg-[#AEE2FF]/40'
              }`}
              title={isRunning ? 'Pause' : 'Run Simulation'}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={onStep}
              disabled={isRunning}
              className="p-2 rounded-lg text-[#676B8C] hover:text-[#444766] hover:bg-white/60 disabled:opacity-40 transition-colors"
              title="Step +1 Day"
            >
              <FastForward className="w-4 h-4" />
            </button>
            <button
              onClick={onReset}
              className="p-2 rounded-lg text-[#676B8C] hover:text-[#9192E8] hover:bg-white/60 transition-colors"
              title="Reset to Day 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Current Day Stats summary */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-white/80 border border-[#9FA1FF]/25 font-mono">
              <span className="text-[#787B99] font-medium mr-1.5">DAY</span>
              <span className="font-extrabold text-[#444766]">
                {String(currentDay).padStart(2, '0')}
              </span>
              <span className="text-[#787B99] mx-1">/</span>
              <span className="text-[#787B99]">{String(maxDay).padStart(2, '0')}</span>
            </div>

            {currentSnap && (
              <div className="hidden sm:flex items-center space-x-2 text-[11px] font-medium">
                <span className="text-[#9192E8] bg-[#9192E8]/10 px-2 py-0.5 rounded-full">
                  +{currentSnap.newInfectionsToday} new
                </span>
                <span className="text-[#787B99]">
                  {currentSnap.iCount} active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Draggable Glowing Timeline Scrubber Slider */}
        <div className="w-full md:flex-1 px-2 flex flex-col justify-center">
          <div className="relative flex items-center">
            {/* Background mini epidemic curve on scrubber track */}
            <div className="absolute inset-x-0 h-4 -top-3 opacity-30 pointer-events-none overflow-hidden">
              <svg className="w-full h-full preserve-3d" preserveAspectRatio="none" viewBox={`0 0 ${Math.max(1, maxDay)} 100`}>
                {snapshots.length > 1 && (
                  <path
                    d={`M 0 100 ${snapshots.map((s) => `L ${s.day} ${100 - (s.iCount / Math.max(1, ...snapshots.map(x => x.iCount))) * 90}`).join(' ')} L ${maxDay} 100 Z`}
                    fill="#9192E8"
                  />
                )}
              </svg>
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(0, maxDay)}
              value={currentDay}
              onChange={(e) => onScrub(Number(e.target.value))}
              disabled={maxDay === 0}
              className="w-full h-2 bg-gradient-to-r from-[#AEE2FF]/50 via-[#B5BAFF]/60 to-[#9FA1FF]/70 rounded-lg appearance-none cursor-pointer accent-[#9192E8] shadow-inner focus:outline-none"
            />
          </div>

          {/* Tick markers */}
          <div className="flex justify-between text-[10px] text-[#787B99] font-mono mt-1 px-1">
            <span>Day 0</span>
            {maxDay >= 10 && <span>Day {Math.floor(maxDay / 2)}</span>}
            <span>Day {maxDay}</span>
          </div>
        </div>

        {/* Speed Multiplier Pill */}
        <div className="flex items-center space-x-1.5 text-xs text-[#787B99]">
          <Activity className="w-3.5 h-3.5 text-[#9192E8]" />
          <span className="hidden lg:inline text-[11px]">Speed:</span>
          <div className="flex items-center bg-white/70 p-0.5 rounded-lg border border-[#9FA1FF]/25">
            {[600, 350, 150].map((s, idx) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  speed === s
                    ? 'bg-[#9192E8] text-white shadow-xs'
                    : 'text-[#676B8C] hover:text-[#444766]'
                }`}
              >
                {idx === 0 ? '1x' : idx === 1 ? '2x' : '4x'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
