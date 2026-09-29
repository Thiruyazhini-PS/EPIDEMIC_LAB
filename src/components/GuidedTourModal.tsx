// src/components/GuidedTourModal.tsx
import React from 'react';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import type { NavScreen } from './Navbar';

export interface DemoStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  phaseLabel: string;
  screen: NavScreen;
  description: string;
  badge: string;
  badgeColor: string;
  keyInsights: string[];
  durationSeconds: number;
  icon: React.ReactNode;
}

interface GuidedTourModalProps {
  currentStep: DemoStep;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  progressPercent: number; // 0 to 100 for auto-advance countdown
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRestart: () => void;
  onClose: () => void;
  isCompleted?: boolean;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  currentStep,
  currentStepIndex,
  totalSteps,
  isPlaying,
  progressPercent,
  onTogglePlay,
  onNext,
  onPrev,
  onRestart,
  onClose,
  isCompleted = false,
}) => {
  if (isCompleted) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 select-none animate-in fade-in slide-in-from-bottom-6 duration-300">
        <div className="bg-white/95 backdrop-blur-xl border border-[#9192E8]/40 shadow-2xl rounded-3xl p-6 text-[#444766] font-mono space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#D9F9DF] border border-[#BDEEC8] flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-6 h-6 text-[#427A54] animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-extrabold uppercase tracking-wide text-[#383A59]">
              GUIDED WALKTHROUGH COMPLETED
            </h3>
            <p className="text-xs text-[#787B99] mt-1">
              All 7 core computational epidemiology and data structure phases have been demonstrated.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={onRestart}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#9192E8] border border-[#9FA1FF]/40 text-xs font-bold cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Guided Tour</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              Explore Freeform Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 select-none animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="bg-white/95 backdrop-blur-2xl border border-[#9192E8]/35 shadow-2xl rounded-3xl p-5 text-[#444766] font-mono space-y-3.5 relative overflow-hidden">
        {/* Animated Countdown Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[#9FA1FF] via-[#9192E8] to-[#63b379] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Top Controls Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-100/80 border border-[#9192E8]/40 text-[#9192E8] text-[10px] font-extrabold">
              <span className="w-2 h-2 rounded-full bg-[#9192E8] animate-pulse" />
              <span>GUIDED DEMO TOUR</span>
            </div>
            <span className="text-[11px] text-[#787B99] font-bold">
              PHASE {currentStepIndex + 1} OF {totalSteps}
            </span>
          </div>

          {/* Play/Pause & Step Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onTogglePlay}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-[#444766] transition-colors cursor-pointer"
              title={isPlaying ? 'Pause Auto-Advance' : 'Resume Auto-Advance'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-[#9192E8]" /> : <Play className="w-4 h-4 text-[#427A54]" />}
            </button>
            <button
              onClick={onPrev}
              disabled={currentStepIndex === 0}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-[#444766] disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous Phase"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-[#444766] transition-colors cursor-pointer"
              title="Next Phase"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-rose-50 text-[#787B99] hover:text-rose-600 transition-colors cursor-pointer"
              title="Exit Guided Demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phase Main Content */}
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-[#9FA1FF]/40 flex items-center justify-center text-[#9192E8] shrink-0 shadow-xs mt-0.5">
            {currentStep.icon}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h4 className="text-sm font-black text-[#383A59] tracking-tight">
                {currentStep.title}
              </h4>
              <span className={`text-[9.5px] px-2 py-0.2 rounded-full font-bold border ${currentStep.badgeColor}`}>
                {currentStep.badge}
              </span>
            </div>

            <p className="text-xs text-[#676B8C] leading-relaxed">
              {currentStep.description}
            </p>

            {/* Key Insights Badges */}
            <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-1">
              {currentStep.keyInsights.map((insight, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[#787B99] font-medium"
                >
                  &bull; {insight}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="pt-2 border-t border-[rgba(159,161,255,0.2)] flex items-center justify-between text-[11px] text-[#787B99]">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9192E8]" />
            <span>Active Screen: <b className="text-[#444766] uppercase">{currentStep.screen}</b></span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-[#787B99]">
              {isPlaying ? 'Auto-advancing...' : 'Paused'}
            </span>
            <button
              onClick={onNext}
              className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-[#9192E8] hover:bg-[#8384e5] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>{currentStepIndex === totalSteps - 1 ? 'Finish Demo' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
