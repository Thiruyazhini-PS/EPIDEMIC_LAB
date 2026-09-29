// src/components/ProfileModal.tsx
import React from 'react';
import {
  User,
  LogOut,
  X,
  Bookmark,
} from 'lucide-react';
import type { ResearchUser } from '../utils/authSession';

interface ProfileModalProps {
  user: ResearchUser | null;
  onClose: () => void;
  onLogout: () => void;
  simulationCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  onClose,
  onLogout,
  simulationCount,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#444766]/20 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#9FA1FF]/40 p-6 shadow-2xl space-y-5 text-[#444766] font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(159,161,255,0.22)]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-[#9FA1FF]/40 flex items-center justify-center text-[#9192E8]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold uppercase tracking-wider text-sm text-[#444766]">
                RESEARCH PROFILE
              </h3>
              <span className="text-[10px] text-[#787B99]">SECURE SESSION CREDENTIALS</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 text-[#787B99] hover:text-[#444766] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 rounded-xl bg-purple-50/50 border border-[#9FA1FF]/25 flex items-center space-x-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#9FA1FF] to-[#D9F9DF] flex items-center justify-center text-lg font-black text-[#444766] shadow-sm">
            {user ? user.name[0].toUpperCase() : 'R'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-[#444766] truncate">
              {user ? user.name : 'Lead Epidemiologist'}
            </div>
            <div className="text-[11px] text-[#9192E8] font-semibold truncate">
              {user ? user.role : 'Computational Modeler'}
            </div>
            <div className="text-[10px] text-[#787B99] truncate">
              {user ? user.email : 'researcher@epidemiclab.io'}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/20 shadow-xs space-y-1">
            <span className="text-[10px] text-[#787B99] block font-bold">RESEARCH ID</span>
            <span className="font-black text-[#9192E8] text-sm">
              {user ? user.researchId : 'LAB-8821'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/20 shadow-xs space-y-1">
            <span className="text-[10px] text-[#787B99] block font-bold">SESSION STATUS</span>
            <span className="font-bold text-[#427A54] text-[11px] flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#63b379] animate-pulse" />
              <span>ACTIVE &bull; LOCAL</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/20 shadow-xs space-y-1">
            <span className="text-[10px] text-[#787B99] block font-bold">SIMULATION RUNS</span>
            <span className="font-black text-[#444766] text-sm">{simulationCount} Executions</span>
          </div>

          <div className="p-3 rounded-xl bg-white/80 border border-[#9FA1FF]/20 shadow-xs space-y-1">
            <span className="text-[10px] text-[#787B99] block font-bold">SAVED SCENARIOS</span>
            <span className="font-black text-[#444766] text-sm">3 Configurations</span>
          </div>
        </div>

        {/* Experiment History */}
        <div className="p-3.5 rounded-xl bg-white/80 border border-[#9FA1FF]/20 shadow-xs space-y-2">
          <span className="text-[10px] text-[#787B99] block font-bold">RECENT EXPERIMENT SESSIONS</span>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-[#444766]">
              <span className="flex items-center space-x-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#9192E8]" />
                <span>Bridge Severing Counterfactual</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-[#427A54] font-bold">Verified</span>
            </div>
            <div className="flex items-center justify-between text-[#444766]">
              <span className="flex items-center space-x-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#427A54]" />
                <span>Super-Spreader Hub Ring Isolation</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-[#9192E8] font-bold">Completed</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-[#787B99] hover:text-[#444766] transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Secure Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
